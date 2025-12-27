# GearGuard Server

FastAPI backend with PostgreSQL database running in Docker.

## Prerequisites

- Docker
- Docker Compose

## Setup

1. **Copy environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` if you want to change default credentials.

2. **Build and start the containers:**
   ```bash
   docker-compose up --build
   ```

   For detached mode:
   ```bash
   docker-compose up -d --build
   ```

3. **Access the application:**
   - API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## Docker Commands

### Start services
```bash
docker-compose up
```

### Stop services
```bash
docker-compose down
```

### Stop services and remove volumes (WARNING: deletes database data)
```bash
docker-compose down -v
```

### View logs
```bash
docker-compose logs -f api  # API logs
docker-compose logs -f db   # Database logs
```

### Rebuild after code changes
```bash
docker-compose up --build
```

### Execute commands in containers
```bash
# Access API container
docker-compose exec api bash

# Access PostgreSQL
docker-compose exec db psql -U gearguard -d gearguard_db
```

## Database Persistence

The PostgreSQL data is stored in a Docker named volume `postgres_data`. This ensures your database persists across container restarts and avoids permission issues on Windows/WSL. The data will only be deleted if you:

1. Run `docker compose down -v` (which removes volumes)
2. Manually remove the Docker volume using `docker volume rm <volume_name>`

## Development

The code is mounted as a volume, so changes to Python files will automatically reload the server (thanks to `--reload` flag in uvicorn).

## Project Structure

```
server/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── Dockerfile          # Container configuration
├── docker-compose.yml  # Multi-container orchestration
├── .dockerignore       # Files to exclude from Docker
├── .env.example        # Environment variables template
└── README.md          # This file
```
