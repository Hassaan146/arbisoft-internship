"""Persistence for reviews, behind a small interface.

The service layer depends on ``ReviewRepository`` (the abstract interface),
not on any concrete store — so the JSON-file implementation used here can be
swapped for a real database later without touching services or routes.
"""

import json
import shutil
import threading
import uuid
from abc import ABC, abstractmethod
from datetime import UTC, datetime
from pathlib import Path


class ReviewRepository(ABC):
    """What the service layer needs from a review store."""

    @abstractmethod
    def list_all(self) -> list[dict]:
        """Return every review, newest first."""

    @abstractmethod
    def get(self, review_id: str) -> dict | None:
        """Return one review, or None if the id is unknown."""

    @abstractmethod
    def add(self, fields: dict) -> dict:
        """Store a new review and return it with id + created_at set."""

    @abstractmethod
    def replace(self, review_id: str, fields: dict) -> dict | None:
        """Replace a review's client fields; None if the id is unknown."""

    @abstractmethod
    def delete(self, review_id: str) -> bool:
        """Delete a review; False if the id is unknown."""


class JsonReviewRepository(ReviewRepository):
    """File-backed store: a JSON array with atomic writes.

    A process-wide lock serialises read-modify-write cycles, and every write
    lands in a temp file first and is then atomically renamed over the store,
    so a crash mid-write can never corrupt the data file.
    """

    def __init__(self, data_file: Path, seed_file: Path | None = None) -> None:
        self._data_file = data_file
        self._lock = threading.Lock()
        if not data_file.exists():
            data_file.parent.mkdir(parents=True, exist_ok=True)
            if seed_file is not None and seed_file.exists():
                shutil.copyfile(seed_file, data_file)
            else:
                self._write([])

    def _read(self) -> list[dict]:
        with self._data_file.open(encoding="utf-8") as fh:
            return json.load(fh)

    def _write(self, rows: list[dict]) -> None:
        tmp = self._data_file.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")
        tmp.replace(self._data_file)

    def list_all(self) -> list[dict]:
        with self._lock:
            return self._read()

    def get(self, review_id: str) -> dict | None:
        with self._lock:
            return next((r for r in self._read() if r["id"] == review_id), None)

    def add(self, fields: dict) -> dict:
        row = {
            "id": uuid.uuid4().hex,
            "created_at": datetime.now(UTC).isoformat(),
            **fields,
        }
        with self._lock:
            rows = self._read()
            rows.insert(0, row)  # newest first
            self._write(rows)
        return row

    def replace(self, review_id: str, fields: dict) -> dict | None:
        with self._lock:
            rows = self._read()
            for i, row in enumerate(rows):
                if row["id"] == review_id:
                    updated = {"id": row["id"], "created_at": row["created_at"], **fields}
                    rows[i] = updated
                    self._write(rows)
                    return updated
        return None

    def delete(self, review_id: str) -> bool:
        with self._lock:
            rows = self._read()
            remaining = [r for r in rows if r["id"] != review_id]
            if len(remaining) == len(rows):
                return False
            self._write(remaining)
        return True
