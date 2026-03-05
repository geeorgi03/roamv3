# Roam Music

Python service for the Roam music stack.

## Setup

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies (from repo root or this directory):
   ```bash
   pip install -e .
   ```
3. Run:
   ```bash
   python main.py
   ```

## Docker

```bash
docker build -t roam-music .
docker run roam-music
```
