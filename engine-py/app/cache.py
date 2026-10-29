"""Redis-backed caching and idempotency, with a graceful in-process fallback.

Redis is optional: if `REDIS_URL` is unset or the server is unreachable, the
service keeps working with a bounded in-memory store. That keeps local dev and
CI dependency-free while production gets shared state.
"""

from __future__ import annotations

import json
import os
import time
from collections import OrderedDict
from typing import Any, Optional

try:  # pragma: no cover - import guard
    import redis.asyncio as redis
except Exception:  # pragma: no cover
    redis = None  # type: ignore[assignment]


class _MemoryStore:
    """Tiny LRU with TTL, used when Redis is not configured."""

    def __init__(self, capacity: int = 1024) -> None:
        self._data: "OrderedDict[str, tuple[float, str]]" = OrderedDict()
        self._capacity = capacity

    async def get(self, key: str) -> Optional[str]:
        item = self._data.get(key)
        if not item:
            return None
        expires_at, value = item
        if expires_at and expires_at < time.time():
            self._data.pop(key, None)
            return None
        self._data.move_to_end(key)
        return value

    async def set(self, key: str, value: str, ttl: int = 0) -> None:
        self._data[key] = (time.time() + ttl if ttl else 0, value)
        self._data.move_to_end(key)
        while len(self._data) > self._capacity:
            self._data.popitem(last=False)

    async def delete(self, key: str) -> None:
        self._data.pop(key, None)

    async def ping(self) -> bool:
        return True


class Store:
    def __init__(self) -> None:
        self._client: Any = None
        self._memory = _MemoryStore()
        self.backend = "memory"

    async def connect(self) -> None:
        url = os.environ.get("REDIS_URL")
        if not url or redis is None:
            return
        try:
            client = redis.from_url(url, encoding="utf-8", decode_responses=True)
            await client.ping()
            self._client = client
            self.backend = "redis"
        except Exception:
            self._client = None
            self.backend = "memory"

    async def close(self) -> None:
        if self._client is not None:
            await self._client.aclose()

    async def get_json(self, key: str) -> Optional[dict]:
        raw = (
            await self._client.get(key)
            if self._client is not None
            else await self._memory.get(key)
        )
        return json.loads(raw) if raw else None

    async def set_json(self, key: str, value: dict, ttl: int = 300) -> None:
        raw = json.dumps(value, default=str)
        if self._client is not None:
            await self._client.set(key, raw, ex=ttl or None)
        else:
            await self._memory.set(key, raw, ttl)

    async def ping(self) -> bool:
        if self._client is not None:
            try:
                return bool(await self._client.ping())
            except Exception:
                return False
        return await self._memory.ping()


store = Store()


def idempotency_key(org_id: str, key: str) -> str:
    safe = "".join(c for c in key if c.isalnum() or c in "_.-")[:200]
    return f"gavel:idem:{org_id}:{safe}"


def policy_cache_key(path: str, version: str) -> str:
    return f"gavel:policy:{version}:{abs(hash(path))}"
