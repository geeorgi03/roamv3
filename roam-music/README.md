# Roam Music Analysis Service

## Prerequisites

- Python 3.11+
- **uv** — install via `pip install uv` or `brew install uv`

## Setup

```bash
cp .env.example .env
```

Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `.env`.

## Local run

Preferred:

```bash
uv run main.py
```

Alternative:

```bash
pip install -e .
python main.py
```

## Docker

```bash
docker build -t roam-music .
docker run --env-file .env roam-music
```
