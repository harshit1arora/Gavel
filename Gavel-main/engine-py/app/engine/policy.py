"""Policy loading. The same JSON the Node service and the browser use."""

from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path

from ..schemas import PolicyConfig

_HERE = Path(__file__).resolve().parent
# engine-py/app/engine/ -> repo root -> src/data/policies
_DEFAULT_POLICY_PATH = (
    _HERE.parents[2] / "src" / "data" / "policies" / "pilot-acme.json"
)


def _load(path: Path) -> PolicyConfig:
    with path.open("r", encoding="utf-8") as fh:
        return PolicyConfig(**json.load(fh))


@lru_cache(maxsize=8)
def load_policy(path: str | None = None) -> PolicyConfig:
    """Load a policy by absolute path, or the default pilot policy."""
    env_path = os.environ.get("GAVEL_POLICY_PATH")
    resolved = Path(path or env_path or _DEFAULT_POLICY_PATH)
    if not resolved.exists():
        raise FileNotFoundError(f"Policy file not found: {resolved}")
    return _load(resolved)


DEFAULT_POLICY: PolicyConfig = load_policy()
