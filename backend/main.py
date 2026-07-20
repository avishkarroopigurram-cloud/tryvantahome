"""
Tryvanta Home — FastAPI backend
JWT auth (email allow-list + bcrypt password validation) + relay device management + ESP32 proxy.
In production, also serves the built React frontend (dist/).

Run (dev):
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Run (prod, from workspace root):
    uvicorn backend.main:app --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Any

import bcrypt as _bcrypt
import httpx
import jwt
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# ── Configuration ─────────────────────────────────────────────────────────────
SECRET_KEY: str = os.environ.get(
    "SESSION_SECRET", "change-me-set-SESSION_SECRET-in-environment"
)
ALGORITHM = "HS256"
ACCESS_TTL  = 30 * 24 * 3600   # 30 days
REFRESH_TTL = 60 * 24 * 3600   # 60 days

ESP32_BASE    = "http://192.168.29.220"
ESP32_TIMEOUT = 5.0  # seconds

# ── Password helpers ──────────────────────────────────────────────────────────
def _verify_password(plain: str, hashed: str) -> bool:
    """Constant-time bcrypt verification."""
    try:
        return _bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False

# ── User credentials ───────────────────────────────────────────────────────────
# Passwords are stored as bcrypt hashes in environment variables.
# Set PW_HASH_RAJANI and PW_HASH_AAVISHKAR before starting.
# Only these two emails are authorised.
_CREDENTIALS: dict[str, str | None] = {
    "rajanikanthmattepally@gmail.com": os.environ.get("PW_HASH_RAJANI"),
    "aavishkarroopi@gmail.com":        os.environ.get("PW_HASH_AAVISHKAR"),
}

ALLOWED_EMAILS: set[str] = set(_CREDENTIALS.keys())

# Warn on startup if hashes are missing (server will still start, but login will fail)
for _email, _hash in _CREDENTIALS.items():
    if not _hash:
        print(f"[WARNING] No password hash configured for {_email} "
              f"(set the matching PW_HASH_* environment secret)")

# ── In-memory relay state ─────────────────────────────────────────────────────
_relay_state: dict[int, bool] = {1: False, 2: False, 3: False, 4: False}

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Tryvanta Home API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── JWT helpers ───────────────────────────────────────────────────────────────
def _make_token(email: str, ttl: int) -> str:
    payload = {
        "sub": email,
        "iat": int(time.time()),
        "exp": int(time.time()) + ttl,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return str(payload["sub"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="token expired")
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="invalid token")


_bearer = HTTPBearer()


def current_user_email(
    creds: HTTPAuthorizationCredentials = Depends(_bearer),
) -> str:
    return _decode_token(creds.credentials)


# ── Pydantic models ───────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class CommandRequest(BaseModel):
    command: str
    params: dict[str, Any] = {}


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int


# ── Auth endpoints ────────────────────────────────────────────────────────────
@app.post("/api/v1/auth/login", response_model=TokenPair)
async def login(req: LoginRequest) -> TokenPair:
    email = req.email.strip().lower()

    stored_hash = _CREDENTIALS.get(email)

    # Reject unknown emails and wrong passwords with the same generic error
    # to avoid leaking which emails are registered.
    if stored_hash is None or not _verify_password(req.password, stored_hash):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    return TokenPair(
        access_token=_make_token(email, ACCESS_TTL),
        refresh_token=_make_token(email, REFRESH_TTL),
        expires_in=ACCESS_TTL,
    )


@app.post("/api/v1/auth/refresh", response_model=TokenPair)
async def refresh(req: RefreshRequest) -> TokenPair:
    email = _decode_token(req.refresh_token)
    if email not in ALLOWED_EMAILS:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Access denied.")
    return TokenPair(
        access_token=_make_token(email, ACCESS_TTL),
        refresh_token=_make_token(email, REFRESH_TTL),
        expires_in=ACCESS_TTL,
    )


@app.post("/api/v1/auth/logout")
async def logout() -> dict:
    return {}


# ── User endpoints ────────────────────────────────────────────────────────────
def _make_user(email: str) -> dict:
    local_part = email.split("@")[0].replace(".", " ").title()
    return {
        "id": f"local-{email}",
        "email": email,
        "full_name": local_part,
        "is_active": True,
        "is_superuser": False,
        "email_verified": True,
    }


@app.get("/api/v1/users/me")
async def me(email: str = Depends(current_user_email)) -> dict:
    return _make_user(email)


@app.get("/api/v1/users/me/homes")
async def my_homes(_email: str = Depends(current_user_email)) -> list:
    return [
        {
            "id": "home-local",
            "name": "My Home",
            "timezone": "Asia/Kolkata",
            "tariff_per_kwh": 6.5,
            "currency": "INR",
        }
    ]


# ── Device / room / scene endpoints ──────────────────────────────────────────
RELAY_ROOM_ID = "room-relay-board"


def _relay_device(n: int) -> dict:
    return {
        "id": f"relay-{n}",
        "dm_device_id": f"esp32-relay-{n}",
        "name": f"Relay {n}",
        "kind": "switch",
        "room_id": RELAY_ROOM_ID,
        "manufacturer": "ESP32",
        "model": "4-Channel Relay Board",
        "protocol": "http",
        "capabilities": ["power"],
        "last_state": {"power": _relay_state[n]},
        "online": True,
        "signal_percent": None,
        "battery_percent": None,
        "latency_ms": None,
        "last_seen": None,
        "is_favorite": False,
        "order": n,
    }


@app.get("/api/v1/devices")
async def list_devices(_email: str = Depends(current_user_email)) -> list:
    return [_relay_device(n) for n in range(1, 5)]


@app.get("/api/v1/rooms")
async def list_rooms(_email: str = Depends(current_user_email)) -> list:
    return [
        {
            "id": RELAY_ROOM_ID,
            "name": "Relay Board",
            "kind": "other",
            "icon": "zap",
            "order": 1,
            "device_count": 4,
        }
    ]


@app.get("/api/v1/scenes")
async def list_scenes(_email: str = Depends(current_user_email)) -> list:
    return []


# ── Device command → ESP32 proxy ──────────────────────────────────────────────
_RELAY_MAP: dict[str, int] = {
    "relay-1": 1,
    "relay-2": 2,
    "relay-3": 3,
    "relay-4": 4,
}


@app.post("/api/v1/devices/{device_id}/command")
async def device_command(
    device_id: str,
    req: CommandRequest,
    _email: str = Depends(current_user_email),
) -> dict:
    relay_num = _RELAY_MAP.get(device_id)
    if relay_num is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Device not found")

    cmd = req.command
    if cmd == "turn_on":
        esp32_state, new_power = "on", True
    elif cmd == "turn_off":
        esp32_state, new_power = "off", False
    else:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_type": "unsupported_capability",
                "error": f"Command '{cmd}' not supported by relay devices",
            },
        )

    esp32_url = f"{ESP32_BASE}/relay{relay_num}/{esp32_state}"
    try:
        async with httpx.AsyncClient(timeout=ESP32_TIMEOUT) as client:
            resp = await client.get(esp32_url)
            resp.raise_for_status()
    except httpx.TimeoutException:
        raise HTTPException(
            status.HTTP_504_GATEWAY_TIMEOUT,
            detail=(
                f"Relay {relay_num} timed out — ESP32 at {ESP32_BASE} "
                f"did not respond within {int(ESP32_TIMEOUT)}s"
            ),
        )
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail=f"ESP32 returned HTTP {exc.response.status_code}",
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail=f"Cannot reach ESP32 at {ESP32_BASE}: {exc}",
        )

    _relay_state[relay_num] = new_power
    return {"state": {"power": new_power}}


# ── Frontend static file serving (production only) ────────────────────────────
# In development, Vite runs on its own port and proxies /api to this server.
# In production, the build step compiles the frontend into dist/ and this
# server serves it directly — one port for everything.

_DIST = Path(__file__).parent.parent / "dist"

if _DIST.exists():
    # Serve Vite's hashed asset bundle
    app.mount("/assets", StaticFiles(directory=str(_DIST / "assets")), name="assets")

    # Serve any other static file that exists in dist/ (icons, manifest, sw.js …)
    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str) -> FileResponse:
        # Let explicit files through (favicon, manifest, icons, sw.js …)
        candidate = _DIST / full_path
        if candidate.is_file():
            return FileResponse(str(candidate))
        # Everything else → index.html so the React router can handle it
        return FileResponse(str(_DIST / "index.html"))
