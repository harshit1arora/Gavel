# Gavel decision service — FastAPI
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN useradd --create-home --uid 1001 gavel

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
# The service reads the same policy JSON the Node backend and the browser use.
COPY ../src/data/policies ./policies

USER gavel
EXPOSE 8090

ENV GAVEL_POLICY_PATH=/app/policies/pilot-acme.json

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8090/health').status==200 else 1)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8090", "--workers", "2"]
