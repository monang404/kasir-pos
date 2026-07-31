import os
import redis
import time

# In-memory fallback
_fallback_attempts = {}
_fallback_lockouts = {}

# Redis connection
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

MAX_ATTEMPTS = 5
LOCKOUT_SECONDS = 300

def _is_redis_available():
    try:
        redis_client.ping()
        return True
    except (redis.exceptions.ConnectionError, redis.exceptions.TimeoutError):
        return False

def get_lockout_status(username: str) -> tuple[bool, int, int]:
    """
    Returns (is_locked, remaining_seconds, remaining_attempts)
    """
    username = username.lower()
    
    if not _is_redis_available():
        # Fallback to in-memory
        if username in _fallback_lockouts:
            unlock_time = _fallback_lockouts[username]
            remaining = int(unlock_time - time.time())
            if remaining > 0:
                return True, remaining, 0
            else:
                del _fallback_lockouts[username]
                _fallback_attempts[username] = 0
                
        attempts = _fallback_attempts.get(username, 0)
        return False, 0, MAX_ATTEMPTS - attempts

    key = f"lockout:{username}"
    
    try:
        attempts_str = redis_client.get(key)
        if not attempts_str:
            return False, 0, MAX_ATTEMPTS
            
        attempts = int(attempts_str)
        if attempts >= MAX_ATTEMPTS:
            ttl = redis_client.ttl(key)
            if ttl > 0:
                return True, ttl, 0
            else:
                return False, 0, MAX_ATTEMPTS
                
        return False, 0, MAX_ATTEMPTS - attempts
    except:
        return False, 0, MAX_ATTEMPTS

def record_failed_attempt(username: str) -> tuple[bool, int, int]:
    """
    Mencatat percobaan gagal menggunakan operasi atomik INCR atau fallback.
    Returns (is_locked, remaining_seconds, remaining_attempts)
    """
    username = username.lower()
    
    if not _is_redis_available():
        # Fallback to in-memory
        is_locked, rem_secs, rem_attempts = get_lockout_status(username)
        if is_locked:
            return True, rem_secs, 0
            
        attempts = _fallback_attempts.get(username, 0) + 1
        _fallback_attempts[username] = attempts
        
        if attempts >= MAX_ATTEMPTS:
            _fallback_lockouts[username] = time.time() + LOCKOUT_SECONDS
            return True, LOCKOUT_SECONDS, 0
            
        return False, 0, MAX_ATTEMPTS - attempts

    key = f"lockout:{username}"
    
    try:
        # Cek dulu apakah sudah ter-lock
        is_locked, rem_secs, rem_attempts = get_lockout_status(username)
        if is_locked:
            return True, rem_secs, 0
            
        # Atomic increment
        attempts = redis_client.incr(key)
        
        # Set expiration
        if attempts == 1:
            redis_client.expire(key, 3600)
        elif attempts >= MAX_ATTEMPTS:
            redis_client.expire(key, LOCKOUT_SECONDS)
            return True, LOCKOUT_SECONDS, 0
            
        return False, 0, MAX_ATTEMPTS - attempts
    except:
        return False, 0, MAX_ATTEMPTS - 1

def reset_attempts(username: str):
    username = username.lower()
    if not _is_redis_available():
        _fallback_attempts.pop(username, None)
        _fallback_lockouts.pop(username, None)
        return
        
    try:
        redis_client.delete(f"lockout:{username}")
    except:
        pass
