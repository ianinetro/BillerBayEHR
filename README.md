# ClinicTraq

Medical billing and practice management system built on Django REST Framework + React/Vite + PostgreSQL.

## Quick Start

```bash
docker-compose up --build
```

## Service URLs

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:5173        |
| API      | http://localhost:8000/api/   |
| Admin    | http://localhost:8000/admin/ |

## Create a Superuser

```bash
docker-compose exec backend python manage.py createsuperuser
```

## Tech Stack

- **Backend**: Django 4.2 + Django REST Framework
- **Frontend**: React + Vite
- **Database**: PostgreSQL 15
- **Containerization**: Docker + Docker Compose
