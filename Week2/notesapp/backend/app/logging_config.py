"""Central logging configuration (checklist areas 17 & 27).

Keep it simple and dependency-free: a single configured root logger that other
modules obtain via `logging.getLogger(__name__)`. Never log secrets or PII —
log identifiers (ids, paths, status) rather than payloads.
"""

import logging


def configure_logging(level: int = logging.INFO) -> None:
    """Configure the root logger once, idempotently."""
    root = logging.getLogger()
    if root.handlers:  # already configured (e.g. under uvicorn / repeated imports)
        return
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s"))
    root.addHandler(handler)
    root.setLevel(level)
