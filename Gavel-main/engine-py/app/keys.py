"""API key store for the decision service.

Production deployments back this with the same `api_keys` collection the Node
gateway writes to. Self-hosted deployments that do not want a database can point
`GAVEL_KEYS_PATH` at a JSON file instead, which is what the CLI writes.

Security properties, same as the gateway:

  - the secret is `sk_{env}_{32 random bytes hex}`
  - only the SHA-256 hash is stored, never the plaintext
  - the prefix is kept for display, so a key can be identified without revealing it
  - keys carry scopes and can be revoked
"""

from __future__ import annotations

import hashlib
import json
import os
import secrets
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

DEFAULT_PATH = Path(os.environ.get("GAVEL_KEYS_PATH", "./data/api_keys.json"))


def hash_key(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@dataclass
class ApiKey:
    id: str
    org_id: str
    org_name: str
    name: str
    env: str
    scopes: list[str]
    key_prefix: str
    key_hash: str
    created_at: str = field(default_factory=_now)
    last_used_at: Optional[str] = None
    is_active: bool = True

    def public(self) -> dict:
        """Everything except the hash and the secret."""
        data = asdict(self)
        data.pop("key_hash", None)
        return data


class KeyStore:
    def __init__(self, path: Optional[Path] = None) -> None:
        self.path = Path(path or DEFAULT_PATH)

    # ── persistence ────────────────────────────────────────────────────
    def _load(self) -> list[dict]:
        if not self.path.exists():
            return []
        try:
            return json.loads(self.path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return []

    def _save(self, records: list[dict]) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(records, indent=2), encoding="utf-8")
        # keys are secrets: owner read/write only
        try:
            os.chmod(self.path, 0o600)
        except OSError:
            pass

    # ── operations ─────────────────────────────────────────────────────
    def create(
        self,
        org_name: str,
        name: str = "default",
        env: str = "test",
        scopes: Optional[list[str]] = None,
        org_id: Optional[str] = None,
    ) -> tuple[str, ApiKey]:
        """Create a key. Returns (plaintext, record). The plaintext is not stored."""
        if env not in {"test", "live"}:
            raise ValueError("env must be 'test' or 'live'")

        raw = f"sk_{env}_{secrets.token_hex(32)}"
        org_slug = "".join(c for c in org_name.lower() if c.isalnum())[:16] or "org"
        record = ApiKey(
            id=f"key_{secrets.token_hex(4)}",
            org_id=org_id or f"org_{org_slug}",
            org_name=org_name,
            name=name,
            env=env,
            scopes=scopes or ["decisions:write", "statements:write", "decisions:read"],
            key_prefix=raw[:12],
            key_hash=hash_key(raw),
        )

        records = self._load()
        records.append(asdict(record))
        self._save(records)
        return raw, record

    def verify(self, raw: str, required_scope: Optional[str] = None) -> Optional[dict]:
        """Return the key record if valid, else None."""
        digest = hash_key(raw)
        for record in self._load():
            if record.get("key_hash") == digest and record.get("is_active", True):
                if required_scope and required_scope not in record.get("scopes", []):
                    return None
                record["last_used_at"] = _now()
                self._touch(digest)
                return record
        return None

    def _touch(self, digest: str) -> None:
        records = self._load()
        for record in records:
            if record.get("key_hash") == digest:
                record["last_used_at"] = _now()
        self._save(records)

    def list_keys(self) -> list[dict]:
        return [
            {k: v for k, v in record.items() if k != "key_hash"} for record in self._load()
        ]

    def revoke(self, key_id: str) -> bool:
        records = self._load()
        found = False
        for record in records:
            if record.get("id") == key_id:
                record["is_active"] = False
                found = True
        if found:
            self._save(records)
        return found

    def has_keys(self) -> bool:
        return any(record.get("is_active", True) for record in self._load())


store = KeyStore()
