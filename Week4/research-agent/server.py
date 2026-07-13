"""FastAPI wrapper for the Agentika web frontend.

Serves the single-page UI (web/index.html) at "/" and exposes one chat
endpoint. One Agent instance = one session memory, same as the CLI.
Run: uvicorn server:app --port 8010
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from pydantic import BaseModel

from config import settings
from main import build

settings.require_keys()

app = FastAPI(title="Agentika")
agent, metrics = build()

WEB_DIR = Path(__file__).resolve().parent / "web"


class ChatRequest(BaseModel):
    message: str


@app.get("/")
def index() -> FileResponse:
    return FileResponse(WEB_DIR / "index.html")


@app.get("/icon.svg")
def icon() -> FileResponse:
    return FileResponse(WEB_DIR / "icon.svg", media_type="image/svg+xml")


@app.post("/api/chat")
def chat(req: ChatRequest) -> dict:
    message = req.message.strip()
    if not message:
        return {"reply": "Please type a question first."}
    try:
        return {"reply": agent.run_turn(message)}
    except Exception as exc:
        return {"reply": f"Something went wrong on the server: {type(exc).__name__}. Please try again."}
