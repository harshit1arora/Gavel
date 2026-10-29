#!/usr/bin/env python3
"""Issue and manage API keys from the command line.

For self-hosted deployments and for provisioning a partner org before they have
a console login.

    python scripts/create_key.py create --org "Acme Finance" --name los-prod --env live
    python scripts/create_key.py list
    python scripts/create_key.py revoke key_8f21

The secret is printed once. Only its SHA-256 hash is written to the key file.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.keys import KeyStore  # noqa: E402

DEFAULT_SCOPES = ["decisions:write", "statements:write", "decisions:read"]


def main() -> int:
    parser = argparse.ArgumentParser(description="Gavel API key administration")
    parser.add_argument("--keys-path", default=None, help="path to the key file")
    sub = parser.add_subparsers(dest="command", required=True)

    create = sub.add_parser("create", help="issue a new key")
    create.add_argument("--org", required=True, help="organisation name")
    create.add_argument("--name", default="default", help="label, e.g. los-prod")
    create.add_argument("--env", default="test", choices=["test", "live"])
    create.add_argument("--scopes", default=",".join(DEFAULT_SCOPES))
    create.add_argument("--json", action="store_true", help="machine readable output")

    sub.add_parser("list", help="list keys (no secrets)")

    revoke = sub.add_parser("revoke", help="revoke a key by id")
    revoke.add_argument("id")

    args = parser.parse_args()
    store = KeyStore(Path(args.keys_path) if args.keys_path else None)

    if args.command == "create":
        raw, record = store.create(
            org_name=args.org,
            name=args.name,
            env=args.env,
            scopes=[s.strip() for s in args.scopes.split(",") if s.strip()],
        )
        if args.json:
            print(json.dumps({**record.public(), "key": raw}, indent=2))
        else:
            print("\n  API key created. Copy it now, it is not shown again.\n")
            print(f"  org     {record.org_name}")
            print(f"  key id  {record.id}")
            print(f"  env     {record.env}")
            print(f"  scopes  {', '.join(record.scopes)}")
            print(f"\n  {raw}\n")
            print("  Try it:")
            print(f'  curl -X POST http://localhost:8090/v1/underwriting/evaluate \\')
            print(f'    -H "Authorization: Bearer {raw}" \\')
            print('    -H "Content-Type: application/json" \\')
            print('    -d @sample.json\n')
        return 0

    if args.command == "list":
        keys = store.list_keys()
        if not keys:
            print("no keys")
            return 0
        for k in keys:
            state = "active" if k["is_active"] else "revoked"
            print(
                f"{k['id']}  {k['key_prefix']}…  {k['org_name']:<32} {k['env']:<5} "
                f"{state:<8} last used {k.get('last_used_at') or 'never'}"
            )
        return 0

    if args.command == "revoke":
        ok = store.revoke(args.id)
        print("revoked" if ok else "no such key")
        return 0 if ok else 1

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
