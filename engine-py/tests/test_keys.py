"""API key lifecycle: creation, verification, scopes, revocation."""

from __future__ import annotations

from pathlib import Path

import pytest

from app.keys import KeyStore, hash_key


@pytest.fixture()
def store(tmp_path: Path) -> KeyStore:
    return KeyStore(tmp_path / "api_keys.json")


def test_create_returns_a_plaintext_key_once_and_stores_only_the_hash(store: KeyStore) -> None:
    raw, record = store.create(org_name="Akg Investment Scenario (P) Ltd", env="test")

    assert raw.startswith("sk_test_")
    assert len(raw.split("_")[-1]) == 64
    assert record.key_prefix == raw[:12]
    assert record.key_hash == hash_key(raw)

    on_disk = (store.path).read_text()
    assert raw not in on_disk          # the secret is never persisted
    assert hash_key(raw) in on_disk    # only the hash


def test_verify_accepts_the_right_key_and_rejects_others(store: KeyStore) -> None:
    raw, record = store.create(org_name="Akg Investment Scenario (P) Ltd")

    verified = store.verify(raw)
    assert verified is not None
    assert verified["org_name"] == "Akg Investment Scenario (P) Ltd"
    assert verified["id"] == record.id

    assert store.verify("sk_test_deadbeef") is None


def test_scopes_are_enforced(store: KeyStore) -> None:
    raw, _ = store.create(org_name="Scoped Co", scopes=["decisions:read"])

    assert store.verify(raw, required_scope="decisions:read") is not None
    assert store.verify(raw, required_scope="disbursements:write") is None


def test_revocation_stops_the_key(store: KeyStore) -> None:
    raw, record = store.create(org_name="Revoke Co")

    assert store.verify(raw) is not None
    assert store.revoke(record.id) is True
    assert store.verify(raw) is None
    assert store.revoke("key_nope") is False


def test_list_never_leaks_the_hash(store: KeyStore) -> None:
    store.create(org_name="List Co")
    listed = store.list_keys()

    assert len(listed) == 1
    assert "key_hash" not in listed[0]
    assert listed[0]["key_prefix"].startswith("sk_test_")


def test_last_used_is_recorded(store: KeyStore) -> None:
    raw, record = store.create(org_name="Usage Co")
    assert store.list_keys()[0]["last_used_at"] is None

    store.verify(raw)
    assert store.list_keys()[0]["last_used_at"] is not None


def test_live_and_test_environments_are_distinct(store: KeyStore) -> None:
    live, _ = store.create(org_name="Env Co", env="live")
    test, _ = store.create(org_name="Env Co", env="test")

    assert live.startswith("sk_live_")
    assert test.startswith("sk_test_")

    with pytest.raises(ValueError):
        store.create(org_name="Env Co", env="prod")
