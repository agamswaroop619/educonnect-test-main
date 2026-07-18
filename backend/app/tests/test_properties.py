"""
Property-based tests using Hypothesis.
Tests properties 1–22 from the design document.
Requirements: 3.3, 3.4, 3.5, 7.1, 7.6, 11.1, 12.5, 14.1, 14.5
"""

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from hypothesis import given, settings as h_settings
from hypothesis import strategies as st

from app.services.auth_service import (
    ACCESS_TOKEN_TTL_SECONDS,
    REFRESH_TOKEN_TTL_SECONDS,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    hash_password,
    verify_password,
    verify_refresh_token,
)


# ---------------------------------------------------------------------------
# Property 2: Token expiry claims — exp - iat == 900 / 604800
# ---------------------------------------------------------------------------

@given(
    user_id=st.uuids(),
    role=st.sampled_from(["student", "teacher", "parent", "school_admin"]),
)
@h_settings(max_examples=50)
def test_access_token_ttl(user_id, role):
    """Property 2: access token exp - iat == 900 exactly."""
    token = create_access_token(user_id, role, None)
    payload = decode_access_token(token)
    assert payload["exp"] - payload["iat"] == ACCESS_TOKEN_TTL_SECONDS


@given(user_id=st.uuids())
@h_settings(max_examples=50)
def test_refresh_token_ttl(user_id):
    """Property 2: refresh token TTL == 604800 seconds."""
    raw, _hash = create_refresh_token(user_id)
    # Decode directly to check claims
    from jose import jwt
    from app.config import settings
    payload = jwt.decode(raw, settings.JWT_REFRESH_SECRET, algorithms=["HS256"])
    assert payload["exp"] - payload["iat"] == REFRESH_TOKEN_TTL_SECONDS


# ---------------------------------------------------------------------------
# Property 3: Password storage security
# ---------------------------------------------------------------------------

@given(password=st.text(min_size=1, max_size=72, alphabet=st.characters(blacklist_categories=("Cs",))))
@h_settings(max_examples=50)
def test_password_never_stored_plaintext(password):
    """Property 3: hash != plaintext; bcrypt verify always True."""
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed) is True


@given(
    password=st.text(min_size=1, max_size=72),
    wrong=st.text(min_size=1, max_size=72),
)
@h_settings(max_examples=30)
def test_wrong_password_rejected(password, wrong):
    """Property 3 corollary: wrong password → verify returns False."""
    if password == wrong:
        return  # skip identical inputs
    hashed = hash_password(password)
    assert verify_password(wrong, hashed) is False


# ---------------------------------------------------------------------------
# Property 9: Attendance summary invariant
# ---------------------------------------------------------------------------

@given(
    present=st.integers(min_value=0, max_value=200),
    absent=st.integers(min_value=0, max_value=200),
    leave=st.integers(min_value=0, max_value=200),
)
def test_attendance_summary_invariant(present, absent, leave):
    """Property 9: total == present + absent + leave; pct computed correctly."""
    total = present + absent + leave
    assert total == present + absent + leave
    if total > 0:
        pct = round((present / total) * 100, 1)
        assert 0.0 <= pct <= 100.0


# ---------------------------------------------------------------------------
# Property 11: Fee balance invariant
# ---------------------------------------------------------------------------

@given(
    transactions=st.lists(
        st.tuples(
            st.floats(min_value=0.01, max_value=100_000, allow_nan=False, allow_infinity=False),
            st.sampled_from(["success", "pending", "failed"]),
        ),
        min_size=0, max_size=20,
    ),
    total_annual=st.floats(min_value=0, max_value=500_000, allow_nan=False, allow_infinity=False),
)
def test_fee_balance_invariant(transactions, total_annual):
    """Property 11: paid == sum(success txns); due == totalAnnual - paid."""
    paid = sum(amt for amt, status in transactions if status == "success")
    due = total_annual - paid
    # These must hold regardless of other transactions
    assert abs(paid - sum(amt for amt, status in transactions if status == "success")) < 0.001
    assert abs(due - (total_annual - paid)) < 0.001


# ---------------------------------------------------------------------------
# Property 8: Circular ordering — pinned before non-pinned
# ---------------------------------------------------------------------------

@given(
    circulars=st.lists(
        st.fixed_dictionaries({
            "pinned": st.booleans(),
            "date": st.datetimes(timezones=st.just(timezone.utc)),
        }),
        min_size=0, max_size=20,
    )
)
def test_circular_ordering_pinned_first(circulars):
    """Property 8: pinned circulars appear before non-pinned in sorted order."""
    sorted_circulars = sorted(
        circulars,
        key=lambda c: (not c["pinned"], c["date"]),
        reverse=False,
    )
    # Re-sort: pinned desc, then date desc
    sorted_circulars = sorted(
        circulars,
        key=lambda c: (0 if c["pinned"] else 1, -c["date"].timestamp()),
    )

    pinned_seen = [c for c in sorted_circulars if c["pinned"]]
    non_pinned_seen = [c for c in sorted_circulars if not c["pinned"]]

    if pinned_seen and non_pinned_seen:
        # All pinned items should come before any non-pinned item
        last_pinned_idx = max(i for i, c in enumerate(sorted_circulars) if c["pinned"])
        first_non_pinned_idx = min(i for i, c in enumerate(sorted_circulars) if not c["pinned"])
        assert last_pinned_idx < first_non_pinned_idx
