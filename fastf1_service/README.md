# Deploying the FastF1 Live Service

## What this actually does (read this first)

FastF1's live timing client records the F1 SignalR stream to a file during a
live session — it is not designed to serve structured, real-time telemetry
over HTTP. This service works around that by recording in a background
thread and tailing the file, then exposing whatever's been received so far
through `/live`.

That means:
- `/live` only returns data while an F1 session is actually in progress
  (practice, quali, sprint, race). Outside a session window, it'll return
  a 503.
- `TimingData`, `WeatherData`, `TrackStatus`, `DriverList`, etc. come
  through as readable JSON.
- `CarData.z` / `Position.z` (per-car speed/throttle/gear and GPS position)
  are zlib+base64 compressed on the wire. This service decodes them
  best-effort, but that's a reverse-engineered format, not a supported
  FastF1 API — treat it as "works today," not guaranteed stable.
- There's no built-in "gap to leader" or "pit status" field — derive that
  yourself from `TimingData` if you need it.

## 1️⃣ Build the container locally (optional)
```
cd fastf1-service
docker build -t fastf1-service .
```
(If you don't have Docker locally, just push this folder to a repo and let
Render build it.)

## 2️⃣ Create a **Web Service** on Render (not a Background Worker)

A Background Worker has no inbound HTTP — `/live` and `/health` would be
unreachable. This needs to be a Web Service.

1. Sign in to <https://render.com>.
2. Click **New** → **Web Service**.
3. Point it to your GitHub repo containing this `fastf1-service` folder.
4. Render will detect the Dockerfile and build the image.
5. Instance type: free tier is fine to start. Note the tradeoffs from
   earlier — spins down after 15 min idle, ~30-60s cold start, no
   persistent disk (fine here, the recording file is meant to be ephemeral
   anyway).
6. Deploy and note the assigned URL, e.g. `https://<service>.onrender.com`.

## 3️⃣ Wire it into your n8n workflow

Point an HTTP Request node at:
```
GET https://<service>.onrender.com/live
GET https://<service>.onrender.com/live?topic=TimingData
GET https://<service>.onrender.com/health
```
Since the free tier spins down when idle, have n8n hit `/health` first to
warm the service up before the real `/live` call if this runs on a
schedule.

## 4️⃣ Verify the service

While an F1 session is live, visit:
```
https://<service>.onrender.com/live
```
You should get back a JSON object keyed by topic (`TimingData`,
`WeatherData`, etc.), each with the latest payload and a `received_at`
timestamp. An empty response or `503` most likely means no session is
currently live — check `/health` to confirm the recorder thread is
actually connected (`recorder_alive: true`).

## 5️⃣ Local development
```
pip install -r requirements.txt
uvicorn main:app --reload
```
Then point n8n (or curl) at `http://localhost:8000/live`.

---
**Notes:**
- The recorder runs in a background thread, not the asyncio event loop —
  this is required because `SignalRClient.start()` is a blocking call.
- If `/health` shows `recorder_alive: false` shortly after startup, check
  the Render logs — `recorder_error` will show the exception, most likely
  a connectivity issue to `livetiming.formula1.com`.
- This will only produce useful output during an actual session; testing
  outside a race weekend will just leave `/live` returning 503.