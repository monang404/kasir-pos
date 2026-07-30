from datetime import datetime, timedelta, timezone
from typing import Dict, Tuple

# In-memory store untuk percobaan gagal login (username -> (gagal_count, locked_until))
# Dalam production skala besar disarankan menggunakan Redis
_lockout_store: Dict[str, Tuple[int, datetime]] = {}

MAX_ATTEMPTS = 5
LOCKOUT_SECONDS = 300

def get_lockout_status(username: str) -> Tuple[bool, int, int]:
    """
    Returns (is_locked, remaining_seconds, remaining_attempts)
    """
    username = username.lower()
    if username not in _lockout_store:
        return False, 0, MAX_ATTEMPTS
        
    attempts, locked_until = _lockout_store[username]
    
    if locked_until and datetime.now(timezone.utc) < locked_until:
        remaining_seconds = int((locked_until - datetime.now(timezone.utc)).total_seconds())
        return True, remaining_seconds, 0
    elif locked_until and datetime.now(timezone.utc) >= locked_until:
        # Lockout expired
        _lockout_store.pop(username, None)
        return False, 0, MAX_ATTEMPTS
        
    return False, 0, MAX_ATTEMPTS - attempts

def record_failed_attempt(username: str) -> Tuple[bool, int, int]:
    """
    Mencatat percobaan gagal.
    Returns (is_locked, remaining_seconds, remaining_attempts)
    """
    username = username.lower()
    is_locked, rem_secs, rem_attempts = get_lockout_status(username)
    
    if is_locked:
        return True, rem_secs, 0
        
    attempts, locked_until = _lockout_store.get(username, (0, None))
    attempts += 1
    
    if attempts >= MAX_ATTEMPTS:
        locked_until = datetime.now(timezone.utc) + timedelta(seconds=LOCKOUT_SECONDS)
        _lockout_store[username] = (attempts, locked_until)
        return True, LOCKOUT_SECONDS, 0
        
    _lockout_store[username] = (attempts, None)
    return False, 0, MAX_ATTEMPTS - attempts

def reset_attempts(username: str):
    username = username.lower()
    _lockout_store.pop(username, None)
