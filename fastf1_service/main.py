# fastf1_service/main.py
"""
IMPORTANT LIMITATION (read before deploying):

FastF1's live timing client is designed to RECORD data during a session for
later analysis, not to serve structured live telemetry over HTTP. Quote from
the official docs: "Live timing data can only be recorded during a live
session, not used in real-time for analysis."

This service works around that by:
  1. Running SignalRClient in a background thread, writing raw stream
     messages to a file as they arrive.
  2. Tailing that file and parsing each line back into [topic, payload, ts].
  3. Exposing the latest payload per topic via /live.

Some topics (TimingData, WeatherData, TrackStatus, DriverList, SessionInfo,
RaceControlMessages, ...) are plain JSON and genuinely useful as-is.

Two topics (CarData.z, Position.z) are zlib+base64 compressed per-car
telemetry (speed/throttle/brake/gear and X/Y/Z position). This service
best-effort decodes them, but this is an unofficial reverse-engineered
format, not something FastF1 exposes as a supported API, so treat it as
"working today" rather than guaranteed stable.

There is no clean "gap to leader" or "isPitStopped" field handed to you —
if you need that, you'd derive it yourself from TimingData.
"""

import ast
import base64
import json
import logging
import os
import threading
import time
import zlib
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from fastf1.livetiming.client import SignalRClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fastf1-live")

app = FastAPI(title="FastF1 Live API")

# NOTE: allow_credentials=True with allow_origins=["*"] is invalid per the
# CORS spec (browsers will ignore the credentials header). Since this is a
# public read-only API with no cookies/auth, drop credentials instead of
# restricting origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Render's free web service has an ephemeral filesystem - that's fine here,
# this file only needs to survive for the life of one running session.
RAW_FILE = os.environ.get("LIVE_DATA_FILE", "/tmp/live_data.txt")
RECORD_TIMEOUT = int(os.environ.get("RECORD_TIMEOUT_SECONDS", "3600"))  # exit if no data for 1hr

# Topics that are plain JSON, safe to hand back as-is
_PLAIN_TOPICS = {
    "TimingData", "TimingStats", "TimingAppData", "WeatherData",
    "TrackStatus", "SessionInfo", "SessionStatus", "DriverList",
    "RaceControlMessages", "TopThree", "LapCount", "ExtrapolatedClock",
    "Heartbeat",
}
# Topics that are zlib+base64 compressed
_COMPRESSED_TOPICS = {"CarData.z", "Position.z"}

latest_by_topic: Dict[str, Any] = {}
_state_lock = threading.Lock()
_recorder_thread: Optional[threading.Thread] = None
_recorder_error: Optional[str] = None


def _decode_compressed(payload: str) -> Any:
    """Best-effort decode of F1's zlib+base64 compressed channels."""
    raw = base64.b64decode(payload)
    inflated = zlib.decompress(raw, -zlib.MAX_WBITS)
    return json.loads(inflated)


def _deep_merge(base: Any, update: Any) -> Any:
    """F1 sends most topics (TimingData, TimingAppData, DriverList,
    RaceControlMessages, ...) as incremental diffs, not full snapshots -
    one message might only touch one driver's one field. Overwriting the
    stored value with just the latest message would lose everything else.
    This merges dicts recursively; update wins on scalar conflicts."""
    if isinstance(base, dict) and isinstance(update, dict):
        merged = dict(base)
        for k, v in update.items():
            merged[k] = _deep_merge(base.get(k), v)
        return merged
    return update


def _parse_line(line: str) -> Optional[List[Any]]:
    """Each recorded line is a Python repr of [topic, payload, timestamp],
    written by SignalRClient via str(msg). Not JSON (single quotes, True/
    False), so ast.literal_eval is the correct/safe parser here."""
    line = line.strip()
    if not line:
        return None
    try:
        parsed = ast.literal_eval(line)
    except (ValueError, SyntaxError):
        return None
    if not isinstance(parsed, list) or len(parsed) < 2:
        return None
    return parsed


def _tail_and_update(stop_event: threading.Event) -> None:
    """Continuously read new lines appended to RAW_FILE and update
    latest_by_topic. Runs in its own thread alongside the recorder."""
    offset = 0
    while not stop_event.is_set():
        if not os.path.exists(RAW_FILE):
            time.sleep(1)
            continue
        try:
            with open(RAW_FILE, "r") as f:
                f.seek(offset)
                new_lines = f.readlines()
                offset = f.tell()
        except OSError:
            time.sleep(1)
            continue

        for line in new_lines:
            parsed = _parse_line(line)
            if not parsed:
                continue
            topic, payload = parsed[0], parsed[1]
            value: Any = payload
            if topic in _COMPRESSED_TOPICS:
                try:
                    value = _decode_compressed(payload)
                except Exception:
                    # Decoding is best-effort; skip malformed frames
                    continue
                with _state_lock:
                    # CarData.z / Position.z arrive as full snapshots per
                    # tick, not diffs - overwrite is correct here.
                    latest_by_topic[topic] = {
                        "data": value,
                        "received_at": time.time(),
                    }
            else:
                with _state_lock:
                    prior = latest_by_topic.get(topic, {}).get("data")
                    merged = _deep_merge(prior, value)
                    latest_by_topic[topic] = {
                        "data": merged,
                        "received_at": time.time(),
                    }
        time.sleep(1)


def _record_forever(stop_event: threading.Event) -> None:
    """Runs SignalRClient.start() - this is BLOCKING and must stay in its
    own thread, never awaited directly in the asyncio event loop."""
    global _recorder_error
    client = SignalRClient(
        filename=RAW_FILE,
        filemode="w",
        timeout=RECORD_TIMEOUT,
        logger=logger,
    )
    try:
        client.start()
    except Exception as e:
        _recorder_error = str(e)
        logger.exception("SignalRClient stopped unexpectedly")


@app.on_event("startup")
def startup() -> None:
    stop_event = threading.Event()
    app.state.stop_event = stop_event

    recorder = threading.Thread(target=_record_forever, args=(stop_event,), daemon=True)
    recorder.start()

    tailer = threading.Thread(target=_tail_and_update, args=(stop_event,), daemon=True)
    tailer.start()

    app.state.recorder_thread = recorder
    app.state.tailer_thread = tailer


@app.on_event("shutdown")
def shutdown() -> None:
    stop_event: threading.Event = app.state.stop_event
    stop_event.set()


@app.get("/health")
def health() -> dict:
    """Cheap endpoint for cold-start warmup pings / uptime checks."""
    recorder_alive = bool(
        getattr(app.state, "recorder_thread", None)
        and app.state.recorder_thread.is_alive()
    )
    return {
        "status": "ok",
        "recorder_alive": recorder_alive,
        "recorder_error": _recorder_error,
        "topics_seen": list(latest_by_topic.keys()),
    }


@app.get("/live")
def get_live(topic: Optional[str] = None) -> dict:
    """Returns the latest received payload per topic.

    NOTE: there is no per-driver 'live' summary built in - F1's stream isn't
    handed to you that way. TimingData is the closest thing to per-driver
    gaps/sector times; CarData.z / Position.z (best-effort decoded above)
    carry per-car telemetry and GPS position, keyed by car number inside
    the decoded payload.
    """
    with _state_lock:
        if not latest_by_topic:
            raise HTTPException(
                status_code=503,
                detail="No live timing data yet. Either no session is "
                       "currently live, or the connection hasn't received "
                       "data yet - check /health.",
            )
        if topic:
            if topic not in latest_by_topic:
                raise HTTPException(
                    status_code=404,
                    detail=f"No data yet for topic '{topic}'. "
                           f"Available: {list(latest_by_topic.keys())}",
                )
            return {topic: latest_by_topic[topic]}
        return dict(latest_by_topic)


@app.get("/summary")
def get_summary() -> dict:
    """Reshapes the raw F1 topics into a clean per-driver object, so a
    companion app doesn't need to know F1's internal message format.

    NOTE ON RELIABILITY: field names below (Lines, GapToLeader, Stints,
    Compound, etc.) are based on FastF1's community-documented schema for
    these topics, but F1 has changed this format before without notice,
    and this hasn't been validated against a real live session yet since
    none is running right now. Treat the shape as "best effort" until
    you've checked it against a real race weekend - check /live?topic=
    TimingData directly if a field looks wrong or missing, and adjust the
    extraction below to match what's actually coming through.
    """
    with _state_lock:
        timing = (latest_by_topic.get("TimingData") or {}).get("data") or {}
        app_data = (latest_by_topic.get("TimingAppData") or {}).get("data") or {}
        drivers_meta = (latest_by_topic.get("DriverList") or {}).get("data") or {}
        track_status = (latest_by_topic.get("TrackStatus") or {}).get("data")
        race_control = (latest_by_topic.get("RaceControlMessages") or {}).get("data") or {}

    if not timing:
        raise HTTPException(
            status_code=503,
            detail="No TimingData yet - no session live, or data hasn't "
                   "arrived. Check /health, or /live?topic=TimingData "
                   "directly.",
        )

    timing_lines = timing.get("Lines", {}) if isinstance(timing, dict) else {}
    app_lines = app_data.get("Lines", {}) if isinstance(app_data, dict) else {}

    drivers = []
    for car_number, line in timing_lines.items():
        if not isinstance(line, dict):
            continue

        meta = drivers_meta.get(car_number, {}) if isinstance(drivers_meta, dict) else {}
        app_line = app_lines.get(car_number, {}) if isinstance(app_lines, dict) else {}

        # Current tyre = highest-indexed (most recent) stint entry
        stints = app_line.get("Stints", {}) if isinstance(app_line, dict) else {}
        current_stint = None
        if isinstance(stints, dict) and stints:
            try:
                last_key = sorted(stints.keys(), key=lambda k: int(k))[-1]
                current_stint = stints[last_key]
            except (ValueError, TypeError):
                current_stint = next(iter(stints.values()), None)

        drivers.append({
            "carNumber": car_number,
            "tla": meta.get("Tla"),
            "fullName": meta.get("FullName") or meta.get("BroadcastName"),
            "team": meta.get("TeamName"),
            "position": line.get("Position"),
            "gapToLeader": line.get("GapToLeader"),
            "intervalToAhead": (line.get("IntervalToPositionAhead") or {}).get("Value")
                if isinstance(line.get("IntervalToPositionAhead"), dict) else None,
            "lastLapTime": (line.get("LastLapTime") or {}).get("Value")
                if isinstance(line.get("LastLapTime"), dict) else None,
            "inPit": line.get("InPit"),
            "pitCount": line.get("NumberOfPitStops"),
            "retired": line.get("Retired"),
            "compound": current_stint.get("Compound") if current_stint else None,
            "stintLaps": current_stint.get("TotalLaps") if current_stint else None,
        })

    # Sort by position when available, unknowns last
    drivers.sort(key=lambda d: (d["position"] is None, d["position"] or 999))

    rc_messages = race_control.get("Messages") if isinstance(race_control, dict) else None
    recent_rc = list(rc_messages.values())[-5:] if isinstance(rc_messages, dict) else []

    return {
        "trackStatus": track_status,
        "recentRaceControlMessages": recent_rc,
        "drivers": drivers,
    }