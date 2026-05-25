# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Builder — install dependencies via pip into /install
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /install

# Install build tools needed for some packages (e.g. psycopg2-binary)
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install/pkgs -r requirements.txt


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Runtime — lean final image
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

# Install libpq runtime library (needed by psycopg2-binary / asyncpg at runtime)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /install/pkgs /usr/local

# Create a non-root user for security
RUN useradd --no-create-home --shell /bin/false appuser

WORKDIR /app

# Copy project source
COPY alembic.ini .
COPY src/ ./src/

# Own everything by appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose the API port
EXPOSE 8000

# Entrypoint: run migrations then start the server
CMD ["sh", "-c", "python -m alembic upgrade head && uvicorn src.app:app --host 0.0.0.0 --port 8000 --workers 2"]
