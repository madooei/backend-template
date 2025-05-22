# Using Docker for Development and Production

In simple terms, Docker is a tool that allows you to run applications in containers. Containers are lightweight, portable, and self-sufficient units that package an application and all its dependencies together. This makes it easy to develop, ship, and run applications consistently across different environments.

## Dockerfile

In the root of the project, you will find a text file named `Dockerfile`. This file contains instructions on how to build a Docker image for the application. The image is a snapshot of the application and its dependencies at a specific point in time.

```plain
# Dockerfile
FROM node:24-bullseye-slim
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install
COPY . .
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["pnpm", "run", "dev"]
```

Here's a breakdown of the Dockerfile:

- `FROM node:24-bullseye-slim`: This line specifies the base _image_ to use. In this case, it's a slim version of Node.js 24 on Debian Bullseye. Think of this as an operating system with Node.js pre-installed.

- `RUN npm install -g pnpm`: This line installs the `pnpm` package manager globally in the container. This is necessary because the application uses `pnpm` to manage its dependencies.

- `WORKDIR /app`: This line sets the working directory inside the container to `/app`. All subsequent commands will be run in this directory. We don't have to call this directory `/app`, but it's a common convention. However, we should be consistent and use the same name in the Dockerfile and the docker-compose.yml file.

- `COPY package.json pnpm-lock.yaml* ./`: This line copies the `package.json` and `pnpm-lock.yaml` files from the host machine to the container. The `*` after `pnpm-lock.yaml` means that if the file doesn't exist, it won't throw an error.

- `RUN pnpm install`: This line installs the application dependencies inside the container using `pnpm`.

- `COPY . .`: This line copies the entire application code from the host machine to the container. The first `.` refers to the current directory on the host, and the second `.` refers to the current directory in the container (which is `/app`).

  - This copying step ignores files and directories specified in the `.dockerignore` file, which is similar to `.gitignore`. This is important to avoid copying unnecessary files into the container, which can increase its size and slow down the build process.
  - Why do we separately copy the `package.json` and `pnpm-lock.yaml` files? We do this to take advantage of Docker's caching mechanism. By copying these files first and running `pnpm install`, we can cache the installed dependencies. If we only copy the application code and run `pnpm install`, Docker would have to reinstall all dependencies every time we make a change to the code, even if the dependencies haven't changed.

- `RUN chown -R node:node /app`: This line changes the ownership of the `/app` directory to the `node` user. This is important for security reasons, as running applications as the root user inside a container can be risky.

- `USER node`: This line sets the user to `node`, which is a non-root user created in the base image. This is another security measure to prevent running the application as the root user.

- `EXPOSE 3000`: This line tells Docker that the container will listen on port 3000 at runtime. This is not a security measure, but rather a way to document which ports the application uses. It doesn't actually publish the port; that is done when you run the container. I assume that the application will listen on port 3000, but if it doesn't, we can change this line to match the actual port.

- `CMD ["pnpm", "run", "dev"]`: This line specifies the command to run when the container starts. In this case, it runs the development server using `pnpm`. This command can be overridden when running the container through the command line or in a `docker-compose.yml` file.
  - How is `CMD` different from `RUN`? The `RUN` command is used to execute commands during the image build process, while `CMD` is used to specify the command that will run when a container is started from the image. In other words, `RUN` is for building the image, and `CMD` is for running the container.
  - `ENTRYPOINT`: This is another command that can be used instead of `CMD`. It specifies the command to run when the container starts, but it cannot be overridden. In this case, we don't need it, as `CMD` is sufficient.

We use the Dockerfile through the `docker-compose.yml` file. However, we can also build the image manually using the command:

```bash
docker build -t backend-template-app .
```

This command builds the Docker image using the Dockerfile in the current directory (`.`) and tags it with the name `backend-template-app`. The `-t` flag is used to specify the name of the image.
After building the image, we can run it using the command:

```bash
docker run -p 3000:3000 backend-template-app
```

This command runs the Docker container from the `backend-template-app` image and maps port 3000 on the host to port 3000 in the container. This allows us to access the application at `http://localhost:3000`.

> [!TIP]
> You can have multiple Dockerfiles in the same project. For example, you might have a `Dockerfile.dev` for development and a `Dockerfile.prod` for production. You can specify which Dockerfile to use when building the image using the `-f` flag: `docker build -f Dockerfile.dev -t backend-template-app .`. This way, you can have different configurations for development and production environments. On that point, you can name your Dockerfile whatever you want, but it's a good practice to name it `Dockerfile` for the main one and use a suffix for others, like `Dockerfile.dev` or `Dockerfile.prod`. This way, you can easily identify which Dockerfile is for which environment.

## `.dockerignore`

In the root of the project, you will also find a file named `.dockerignore`. This file is used to specify files and directories that should be ignored when building the Docker image. This is similar to the `.gitignore` file used in Git. By ignoring unnecessary files, we can reduce the size of the Docker image and speed up the build process.

Here are some common entries you might find in a `.dockerignore` file:

```plain
node_modules
dist
.git
.gitignore
Dockerfile
docker-compose.yml
```

> [!TIP]
> Make sure to ignore `node_modules` directory, as the dependencies will be installed inside the container and we don't want to copy the host's `node_modules` into the container. This is important because the host and container may have different operating systems, and the dependencies may not be compatible.

## `docker-compose.yml`

In the root of the project, you will also find a file named `docker-compose.yml`. This file is used to define and run multi-container Docker applications. In this case, we are using it to define a single container for our application.

```yaml
version: "3.8"

services:
  app:
    container_name: backend-template-app
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - .:/app:delegated
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    command: /bin/sh -c "sleep infinity"
    restart: unless-stopped
    user: node
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

Here's a breakdown of the `docker-compose.yml` file:

- `version: '3.8'`: This line specifies the version of the Docker Compose file format. Version 3.8 is a stable version that supports most features.

- `services`: This section defines the services (containers) that make up the application. In this case, we have a single service named `app`. But we can add more services if needed, such as a database or a cache.

- `container_name: backend-template-app`: This line specifies the name of the container. If we don't specify a name, Docker will generate a random name for the container.

- `build`: This section specifies how to build the Docker image for the service. The `context` is the directory where the Dockerfile is located, and the `dockerfile` is the name of the Dockerfile.

  - If we were to run another service like a database, we would not need to build it, as we would use an existing image from Docker Hub. In that case, we would specify the image name instead of the build context.

- `volumes`: This section defines the volumes to mount in the container. Think of volumes like shared folders between the host and the container. They allow us to persist data and share files between the host and the container.

  - The first volume mounts the current directory on the host (`.`) to `/app` in the container. The `:delegated` option tells Docker to prioritize the container's view of the volume over the host's view, which can improve performance in some cases.
    - Notice the folder name `/app` is the same as the working directory we set in the Dockerfile. This is important for consistency and to avoid confusion.
  - The second volume mounts an empty directory for `node_modules`, ensuring that the host's `node_modules` directory is not used in the container. This is important because the dependencies are installed inside the container, and we don't want to mix them with the host's dependencies.

- `ports`: This section maps the host's port to the container's port. Let's say we run our application on port 3000 in the container, we can map it to port 3000 on the host. This allows us to access the application from the host machine using `http://localhost:3000`.

  - It is common we use the same port for both the container and the host, but we can change it if needed. For example, if we want to run the application on port 4000 on the host, we can change this line to `- "4000:3000"`. This way, we can access the application at `http://localhost:4000` while it still runs on port 3000 inside the container.
  - The format for the port mapping is `host_port:container_port`. This means that the host's port will be mapped to the container's port.
  - I recommend using the same port for both the host and the container; the way I set it up with VS Code devcontainer makes it easier to access the application at the same port on the host and the container.
  - Note that services running inside the container can access each other using the service name as the hostname. For example, another service in the same Docker Compose file can access this service using `http://app:3000`. This is because Docker Compose creates a default network for the services, allowing them to communicate with each other using their service names as hostnames.

- `environment`: This section defines environment variables to set in the container. In this case, we set `NODE_ENV` to `development`, which is a common practice for Node.js applications.

  - Another common practice is to set environment variables as `NODE_ENV=${NODE_ENV}`. This way, we can set the environment variable on the host and it will be passed to the container. This is useful for different environments like development, staging, and production. In this case, you can set the `NODE_ENV` variable in the `.env` file and it will be automatically loaded by Docker Compose. If your `.env` file is named something else, you can specify it in the `docker-compose.yml` file like this: `docker-compose up --env-file .env-name`.

- `command: /bin/sh -c "sleep infinity"`: This line specifies the command to run when the container starts. In this case, it runs a shell command that sleeps indefinitely. This is useful for keeping the container running without doing anything. It fits well with how we use the container through VS Code. It is expected that we open the terminal in VS Code and run the application from there.

  - In production, we would replace this with the command to start the application, such as `pnpm run start`.
  - In test mode, we can use `command: /bin/sh -c "pnpm test"` to run the tests inside the container. This is useful for running tests in a consistent environment.

- `restart: unless-stopped`: This line specifies the restart policy for the container. In this case, it tells Docker to restart the container unless it is explicitly stopped. This is useful for ensuring that the application stays running even if it crashes or the host machine is restarted.

- `user: node`: This line specifies the user to run the container as. In this case, it runs the container as the `node` user, which is a non-root user created in the base image. This is important for security reasons.

- `networks`: This section defines the networks to connect the container to. In this case, we create a custom bridge network named `app-network`. This allows us to isolate the container from other containers and control how they communicate with each other.
  - If we were to run multiple services, we could connect them to the same network, allowing them to communicate with each other using their service names as hostnames.
  - `driver: bridge`: This line specifies the network driver to use. The `bridge` driver is the default driver and creates a private internal network on the host machine. This allows containers to communicate with each other while being isolated from the host network.

We use the `docker-compose.yml` file through VS Code and the `devcontainer.json` file. However, we can also run it manually using the command:

```bash
docker compose up -d
```

This command starts the Docker containers defined in the `docker-compose.yml` file in detached mode (`-d`).Detached mode means that the containers will run in the background, allowing us to continue using the terminal. If we don't use the `-d` flag, the containers will run in the foreground, and we will see their logs in the terminal. This is useful for debugging, but you can always attach to the logs later using the command `docker compose logs -f`.

You can use the command `docker compose down` to stop and remove the containers. This is useful for cleaning up after development or testing. It will also remove any networks created by Docker Compose.

You can also use the command `docker compose build` to build the images defined in the `docker-compose.yml` file. This is useful for rebuilding the images after making changes to the Dockerfile or the application code.

> [!TIP]
> You can have multiple `docker-compose.yml` files in the same project. For example, you might have a `docker-compose.dev.yml` for development and a `docker-compose.prod.yml` for production. You can specify which Docker Compose file to use when running the command using the `-f` flag: `docker-compose -f docker-compose.dev.yml up -d`. This way, you can have different configurations for development and production environments. On that point, you can name your Docker Compose file whatever you want, but it's a good practice to name it `docker-compose.yml` for the main one and use a suffix for others, like `docker-compose.dev.yml` or `docker-compose.prod.yml`. This way, you can easily identify which Docker Compose file is for which environment.

## `.devcontainer/devcontainer.json`

In the `.devcontainer` directory, you will find a file named `devcontainer.json`. This file is used to define the development container configuration for Visual Studio Code. It allows you to create a consistent development environment that can be shared with other developers.

```json
{
  "name": "Backend Template",
  "dockerComposeFile": "../docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/app",
  "forwardPorts": [3000],
  "shutdownAction": "stopCompose",
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "ms-vscode.js-debug-nightly",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-typescript-next"
      ],
      "settings": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "typescript.tsdk": "node_modules/typescript/lib"
      }
    }
  },
  "postCreateCommand": "pnpm install",
  "remoteUser": "node"
}
```

Here's a breakdown of the `devcontainer.json` file:

- `name`: This line specifies the name of the development container. This name will be displayed in Visual Studio Code.

- `dockerComposeFile`: This line specifies the path to the Docker Compose file. In this case, it points to the `docker-compose.yml` file in the root of the project.

- `service`: This line specifies the name of the service to use as the development container. In this case, it uses the `app` service defined in the Docker Compose file.

  - This means that when we open the project in Visual Studio Code, it will automatically start the `app` service defined in the Docker Compose file and attach to it.

- `workspaceFolder`: This line specifies the path to the workspace folder inside the container. In this case, it points to `/app`, which is the working directory defined in the Dockerfile.

- `forwardPorts`: This line specifies the ports to forward from the container to the host. In this case, it forwards port 3000, which is the port the application listens on.

  - Because our `docker-compose.yml` already handles this mapping, explicitly listing 3000 in forwardPorts in devcontainer.json is not strictly necessary for the port to be accessible on your host. You could reach the app at `http://localhost:3000` regardless.
  - However, we'll keep 3000 (or the relevant port) in forwardPorts because it provides a clear signal to VS Code that this port is important for your development workflow within the container. VS Code can then automatically manage this port, display it in the "Ports" tab, and potentially offer conveniences like automatically opening your application in a browser.
  - Note if we have multiple services in the `docker-compose.yml` file, we can specify multiple ports in the `forwardPorts` array. For example, if we have a database service running on port 5432, we can add it like this: `"forwardPorts": [3000, 5432]`.

- `shutdownAction`: This line specifies the action to take when the development container is stopped. In this case, it tells Visual Studio Code to stop the Docker Compose services when the container is shut down.

- `customizations`: This section allows us to customize the development container. In this case, we specify custom settings for Visual Studio Code.

  - `vscode`: This section contains settings specific to Visual Studio Code.
    - `extensions`: This array lists the extensions to install in the development container. In this case, we install ESLint, Prettier, and TypeScript extensions.
    - `settings`: This section contains custom settings for Visual Studio Code. In this case, we enable format on save and set Prettier as the default formatter.

- `postCreateCommand`: This line specifies the command to run after the container is created. In this case, it runs `pnpm install` to install the application dependencies inside the container.

  - This is useful for ensuring that the dependencies are installed in the container, especially if we add new dependencies to the project.
  - This might seem redundant since we already run `pnpm install` in the Dockerfile, but that is not the case. As you develop the application, you might add new dependencies to the `package.json` file. The `postCreateCommand` ensures that these new dependencies are installed in the container, which might have changed since the container image was last built.

- `remoteUser`: This line specifies the user to run the container as. In this case, it runs the container as the `node` user, which is a non-root user created in the base image. This is important for security reasons and ensures that the application runs with the same user as in the Dockerfile.

### How to use the `devcontainer.json` file

> [!NOTE]
> You need to have the ["Remote - Containers" extension pack](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack) installed in Visual Studio Code to use the `devcontainer.json` file. This extension allows you to develop inside a container directly from Visual Studio Code, providing a consistent development environment across different machines.

To use the `devcontainer.json` file, follow these steps:

1. Open the project in Visual Studio Code.

2. If you have the Remote - Containers extension installed, Visual Studio Code will automatically detect the `devcontainer.json` file and prompt you to reopen the project in a container. I like to say "no" to this prompt, as I prefer to open the container manually.

3. To open the project in a container, press `command + shift + p` (or `ctrl + shift + p` on Windows) to open the command palette.

4. Type "Dev Containers: Rebuild and Reopen in Container" and select it. This will start the Docker container defined in the `docker-compose.yml` file and attach Visual Studio Code to it.

5. Once the container is running, you can open a terminal in Visual Studio Code and run the application using `pnpm run dev`. The application will be available at `http://localhost:3000`. Since the VS Code terminal is running inside the container, you can run any command as if you were inside the container. For example, you can run `pnpm test` to run the tests.

6. Edit the code as needed. The changes will be reflected in the container and on the host machine, thanks to the volume mapping in the `docker-compose.yml` file.

7. To stop the container, you can either close Visual Studio Code or run `docker-compose down` in the terminal. This will stop and remove the container.

## Docker related files in the `docker/` directory

In the `docker/` directory, you will find the following files to build and run the application in a production environment:

- `Dockerfile.dev`: This file is a copy of the Dockerfile in the root of the project, included for convenience.
- `Dockerfile.prod`: This file is used to build the Docker image for the production environment. It is similar to the Dockerfile in the root of the project, but it is optimized for production use.
- `docker-compose.dev.yml`: This file is similar to the `docker-compose.yml` file in the root of the project, but it has several services and configurations to provide an example of how to run the application, along other services, in a development environment.
- `docker-compose.prod.yml`: This file is used to define the Docker Compose configuration for the production environment. It is similar to the `docker-compose.yml` file in the root of the project, but it optimizes the production environment.
- `README.md`: This file contains instructions on how to build and run the application in development and production environments using Docker.

### `Dockerfile.prod`

The `Dockerfile.prod` file is used to build the Docker image for the production environment. It is similar to the Dockerfile in the root of the project, but it is optimized for production use. It uses a multi-stage build to reduce the size of the final image and only includes the necessary files for running the application.

```plaintext
# Stage 1: Build
FROM node:24-bullseye-slim AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install
COPY . .
RUN pnpm run build
RUN npm prune --production

# Stage 2: Production
FROM node:24-bullseye-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/package.json /app/pnpm-lock.yaml* ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "run", "start"]
```

Here's a breakdown of the `Dockerfile.prod` file:

- Most of the "Stage 1: Build" section is similar to the Dockerfile in the root of the project. However, instead of running `pnpm run dev`, we run `pnpm run build` to build the application for production. This creates a `dist` directory with the compiled code. Moreover, we run `npm prune --production` to remove the development dependencies from the `node_modules` directory. This reduces the size of the final image and ensures that only the necessary dependencies are included.
  - Note the "As builder" part in the first line. This is a label for the build stage. It allows us to refer to this stage in the second stage of the Dockerfile. The `AS builder` part is important because it allows us to use the files from this stage in the second stage without copying them again.
- The "Stage 2: Production" section uses a new base image and copies only the necessary files from the builder stage. This reduces the size of the final image and ensures that only the necessary files are included.
  - `ENV NODE_ENV=production`: This line sets the `NODE_ENV` environment variable to `production`. This is important for Node.js applications, as it tells the application to run in production mode.
  - `COPY --from=builder /app/package.json /app/pnpm-lock.yaml* ./`: This line copies the `package.json` and `pnpm-lock.yaml` files from the builder stage to the production stage. This is useful for ensuring that the application has access to the correct dependencies.
  - `COPY --from=builder /app/dist ./dist`: This line copies the compiled code from the builder stage to the production stage. This is useful for ensuring that the application has access to the compiled code.
  - `COPY --from=builder /app/node_modules ./node_modules`: This line copies the `node_modules` directory from the builder stage to the production stage. This is useful for ensuring that the application has access to the correct dependencies.
  - `CMD ["npm", "run", "start"]`: This line specifies the command to run when the container starts. In this case, it runs the production server using `npm run start`. This is similar to the `CMD` line in the Dockerfile in the root of the project, but it uses `npm` instead of `pnpm`. This is because we don't have `pnpm` installed in the production stage. We could install it, but it's not necessary, as we can use `npm` to run the application.

### `docker-compose.prod.yml`

The `docker-compose.prod.yml` file is used to define the Docker Compose configuration for the production environment. It is similar to the `docker-compose.yml` file in the root of the project, but it does not create a volume for the source code. This is because we don't need the source code in the production environment.

```yaml
version: "3.8"

services:
  app:
    container_name: backend-template-app
    build:
      context: ../ # relative to this file
      dockerfile: docker/Dockerfile.prod # relative to the build context
    env_file:
      - .env.production # relative to this file
    ports:
      - "${PORT}:${PORT}" # Map port host:container
    environment:
      - NODE_ENV=production
      - PORT=${PORT}
      # - POSTGRES_HOST=${POSTGRES_HOST}
      # - POSTGRES_USER=${POSTGRES_USER}
      # - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      # - POSTGRES_DATABASE=${POSTGRES_DATABASE}
      # - MONGODB_HOST=${MONGODB_HOST}
      # - MONGODB_PORT=${MONGODB_PORT}
      # - MONGODB_DATABASE=${MONGODB_DATABASE}
      # - MONGODB_USER=${MONGODB_USER}
      # - MONGODB_PASSWORD=${MONGODB_PASSWORD}
      # - REDIS_HOST=${REDIS_HOST}
      # - REDIS_PORT=${REDIS_PORT}
      # - REDIS_PASSWORD=${REDIS_PASSWORD}
    command: /bin/sh -c "npm run start"
    user: node
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

Notice the `context: ../ # relative to this file` line. This line specifies the path to the project root directory. This is because the `docker-compose.prod.yml` file is located in `docker/` subdirectory, inside the project root. This way, we can use the `../` path to refer to the project root directory.

You are expected to run the `docker-compose.prod.yml` file from the project root directory. Please refer to the `docker/README.md` file for instructions on how to build and run the application in production.

> [!IMPORTANT]
> You must use the `--env-file` flag to pass the `.env.production` file to the `docker-compose.prod.yml` file. For example: `docker compose --env-file docker/.env.production -f docker/docker-compose.prod.yml up --build`. The `env_file` section in the `docker-compose.yml` file is not enough; it only sets the environment variables inside the container and not when the container is being built.

### `docker-compose.dev.yml`

The `docker-compose.dev.yml` file is similar to the `docker-compose.yml` file in the root of the project, but it has several services and configurations to provide an example of how to run the application, along other services, in a development environment.

```yaml
version: "3.8"

services:
  app:
    container_name: backend-template-app # Rename as needed
    build:
      context: ../ # relative to this file
      dockerfile: docker/Dockerfile.dev # relative to the build context
    volumes:
      - ../:/app:delegated
      - /app/node_modules
    env_file:
      - .env # relative to this file
    ports:
      - "${PORT}:${PORT}" # Map port host:container
    environment:
      - NODE_ENV=development
      - PORT=${PORT}
      - POSTGRES_HOST=postgres_db # Use service name instead of localhost
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DATABASE=${POSTGRES_DATABASE}
      - MONGODB_HOST=mongo_db # Use service name instead of localhost
      - MONGODB_PORT=${MONGODB_PORT}
      - MONGODB_DATABASE=${MONGODB_DATABASE}
      - MONGODB_USER=${MONGODB_USER}
      - MONGODB_PASSWORD=${MONGODB_PASSWORD}
      - REDIS_HOST=redis_cache # Use service name instead of localhost
      - REDIS_PORT=${REDIS_PORT}
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    depends_on:
      mongo_db:
        condition: service_healthy
      postgres_db:
        condition: service_healthy
      redis_cache:
        condition: service_healthy
    command: /bin/sh -c "npm run start"
    user: node
    restart: unless-stopped
    networks:
      - app-network

  postgres_db:
    image: postgres:latest
    env_file:
      - .env
    ports:
      - "${POSTGRES_PORT}:${POSTGRES_PORT}"
    user: "${POSTGRES_USER}"
    volumes:
      - pgdata:/var/lib/postgresql/data # Where Postgres stores its data by default
    healthcheck:
      test: ["CMD-SHELL", "pg_isready"]
      interval: 1s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - app-network

  mongo_db:
    image: mongo:latest
    env_file:
      - .env
    ports:
      - "${MONGODB_PORT}:${MONGODB_PORT}"
    volumes:
      - mongodb_data:/data/db # Where MongoDB stores its data by default
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGODB_USER}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGODB_PASSWORD}
      - MONGO_INITDB_DATABASE=${MONGODB_DATABASE}
    healthcheck:
      test:
        [
          "CMD",
          "mongosh",
          "--authenticationDatabase=admin",
          "-u",
          "${MONGODB_USER}",
          "-p",
          "${MONGODB_PASSWORD}",
          "--eval",
          "db.runCommand('ping').ok",
          "--quiet",
        ]
      interval: 10s
      timeout: 10s
      retries: 5
    restart: unless-stopped
    networks:
      - app-network

  redis_cache:
    image: redis:latest
    env_file:
      - .env
    ports:
      - "${REDIS_PORT}:${REDIS_PORT}"
    volumes:
      - redis_data:/data # Where Redis stores its data by default
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 10s
      retries: 5
    command: ["redis-server", "--requirepass", "${REDIS_PASSWORD}"]
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  pgdata:
  mongodb_data:
  redis_data:
```

Notice we defined three other services: `postgres_db`, `mongo_db`, and `redis_cache`. For each of these services, we defined a volume to store its data. This is useful for persisting data across container restarts. Moreover, we defined a healthcheck for each service to ensure that it is running properly. It is important that the services are running before the application starts.

All of these services share the same network, `app-network`. This allows them to communicate with each other using the service names. If you want to access the services from within the Docker network, you should use the service names. For example:

- `postgres_db`: `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres_db:${POSTGRES_PORT}/${POSTGRES_DATABASE}`
- `mongo_db`: `mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@mongo_db:${MONGODB_PORT}/${MONGODB_DATABASE}?authSource=admin`
- `redis_cache`: `redis://${REDIS_PASSWORD}@redis_cache:${REDIS_PORT}`

However, to access `postgres_db`, `mongo_db`, and `redis_cache` from the host machine, you should use the host.IP instead of the service name. For example:

- `postgres_db`: `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${HOST.IP}:${POSTGRES_PORT}/${POSTGRES_DATABASE}`
- `mongo_db`: `mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${HOST.IP}:${MONGODB_PORT}/${MONGODB_DATABASE}?authSource=admin`
- `redis_cache`: `redis://${REDIS_PASSWORD}@${HOST.IP}:${REDIS_PORT}`

In these cases, `${HOST.IP}` is the IP address of the host machine. You can use `localhost` or `127.0.0.1` as the host.IP when running the application on your local machine.

> [!TIP]
> You can run these services in the production environment as well. However, it is not recommended to do so! There is so much more to think about when it comes to production databases, including backups, replications, scaling, failover, security, monitoring, logging, and more. My recommendation is to use a managed database service like MongoDB Atlas, AWS RDS, Google Cloud SQL, etc.
