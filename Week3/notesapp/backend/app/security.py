"""Password hashing helpers (checklist area 4).

The raw PIN never leaves this boundary as plaintext once hashed. bcrypt applies
a per-hash salt automatically, so identical PINs produce different hashes.
"""

import bcrypt


def hash_password(raw: str) -> str:
    """Return a salted bcrypt hash of the given raw password."""
    return bcrypt.hashpw(raw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(raw: str, hashed: str) -> bool:
    """Return True if the raw password matches the stored hash."""
    return bcrypt.checkpw(raw.encode("utf-8"), hashed.encode("utf-8"))
