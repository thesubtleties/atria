FROM python:3.13-alpine

# Install dependencies in a single layer
RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    gcc \
    python3-dev \
    musl-dev \
    netcat-openbsd \
    curl  # Added for testing endpoints

WORKDIR /app

# Install Python dependencies
COPY requirements.txt setup.py tox.ini ./

RUN pip install --no-cache-dir -U pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install -e . && \
    pip install eventlet  # for socket.io


# Copy application code
COPY api api/
COPY migrations migrations/
COPY seeders seeders/
COPY init.sh .
RUN chmod +x init.sh

# Environment variables for better logging and debugging
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV FLASK_DEBUG=1
ENV FLASK_ENV=development
ENV GUNICORN_CMD_ARGS="--bind=0.0.0.0:5000 \
    --workers=1 \
    --threads=2 \
    --reload \
    --log-level=debug \
    --access-logfile=- \
    --error-logfile=- \
    --capture-output \
    --timeout=120 \
    --logger-class=gunicorn.glogging.Logger"

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["./init.sh"]