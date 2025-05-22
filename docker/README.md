# Docker Usage for Development and Production

This directory contains all the necessary files to build and run your application using Docker for both development and production environments.

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine.
- Copy or create the following environment files in this `docker` directory:
  - `.env` (for development)
  - `.env.production` (for production)

**Example `.env` file:**

```env
NODE_ENV=development
PORT=3000

# Postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=postgres-db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
# 👇 Specifies whether to use secure connection or not (disable since we are connecting through the docker network)
POSTGRES_SSLMODE=disable

# MongoDB
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=mern-db
MONGODB_USER=admin
MONGODB_PASSWORD=admin

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redispassword
```

Make sure to update the values as needed for your setup.

## Development

### 1. Build and Start All Services

From the project root, run:

```bash
docker compose --env-file docker/.env -f docker/docker-compose.dev.yml up --build
```

- This will build the development image using `Dockerfile.dev` and start the app along with Postgres, MongoDB, and Redis containers.
- The app source code is mounted as a volume for live reload.
- The app will be available at `http://localhost:${PORT}` (default: 3000).

### 2. Stopping Services

You can press `Ctrl+C` to stop the services or run:

```bash
docker compose -f docker/docker-compose.dev.yml down
```

## Production

### 1. Build and Start the App

From the project root, run:

```bash
docker compose --env-file docker/.env.production -f docker/docker-compose.prod.yml up --build
```

- This will build the production image using `Dockerfile.prod` and start the app container.
- The app will be available at `http://localhost:${PORT}` (default: 3000).
- No source code is mounted; the image contains only the built app.

### 2. Stopping the App

You can press `Ctrl+C` to stop the services or run:

```bash
docker compose -f docker/docker-compose.prod.yml down
```

## Notes

- **Environment Files:** Both `.env` and `.env.production` must be present in the `docker` directory before running the respective compose files.
- **Database Access:** In development, you can connect to the databases using the credentials and ports defined in your `.env` file.
- **Production Databases:** The production compose file does **not** start database containers. For production, use managed database services or external databases.

## Troubleshooting

- If you encounter issues with ports, ensure the `PORT` and other variables in your `.env` files match your application's configuration.
- If you change dependencies, rebuild the images with the `--build` flag.

For more details, see the main [`docs/docker.md`](../docs/docker.md).
