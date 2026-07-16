# Root Dockerfile
FROM python:3.11-slim as base

WORKDIR /app

COPY fastf1_service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY fastf1_service ./fastf1_service

EXPOSE 8000
ENV PORT=8000
# Use shell form so $PORT is expanded at runtime
CMD uvicorn fastf1_service.main:app --host 0.0.0.0 --port $PORT
