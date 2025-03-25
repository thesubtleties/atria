FROM python:3.13-alpine

RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    gcc \
    python3-dev \
    musl-dev \
    netcat-openbsd

WORKDIR /app

COPY requirements.txt setup.py tox.ini ./
RUN pip install -U pip
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install -e .
RUN pip install eventlet  # Add this line to install eventlet

COPY api api/
COPY init.sh .
RUN chmod +x init.sh

ENV PYTHONPATH=/app

CMD ["./init.sh"]