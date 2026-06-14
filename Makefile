.PHONY: dev up down build logs test clean

# ── Development (Docker) ──────────────────────────────────────

up: build
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

# ── Development (Local) ──────────────────────────────────────

dev-backend:
	cd backend && ./venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

dev: dev-backend dev-frontend

# ── Testing ──────────────────────────────────────────────────

test-backend:
	cd backend && ./venv/bin/python3 -m pytest

test-frontend:
	cd frontend && npm run lint

test: test-backend test-frontend

# ── Utilities ────────────────────────────────────────────────

clean:
	docker compose down -v
	rm -rf backend/venv frontend/.next frontend/node_modules
	find . -name __pycache__ -type d -exec rm -rf {} + 2>/dev/null || true

venv:
	cd backend && python3 -m venv venv && ./venv/bin/pip install -r requirements.txt

db-init:
	cd backend && ./venv/bin/python3 -c "from app.core.init_db import init_db; from app.core.database import SessionLocal; init_db(); print('DB seeded')"

# ── Service-specific ─────────────────────────────────────────

service-%:
	cd services/$*-service && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8$(shell printf '%03d' $(shell echo $* | md5sum | cut -c1-3 | tr 'a-f' '0-5'))
