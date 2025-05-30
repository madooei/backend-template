# Backend Template

This is a template for a backend service built with TypeScript and Hono.js. It provides a basic structure for creating RESTful APIs.

## Architecture

The application follows a common layered architecture pattern, consisting of the following main layers:

1. **Model Layer (Schemas)**: Defines the structure and validation rules for data entities (e.g., `Note`, `UserContext`), DTOs (Data Transfer Objects), and query parameters.
2. **Data Access Layer (Repositories)**: Abstracts the interaction with the data store (e.g., MongoDB).
3. **Services Layer**: Contains the core business logic of the application.
4. **Controllers Layer**: Handles incoming HTTP requests and outgoing responses.
5. **Middlewares Layer**: Handles cross-cutting concerns that apply to multiple routes or requests.
6. **Routes Layer**: Defines the specific HTTP routes (e.g., `/notes`, `/notes/:id`) and their corresponding HTTP methods (GET, POST, PUT, DELETE).

## Technology Stack

- **Language:** TypeScript
- **Framework:** Hono.js
- **Bundler:** Tsup (We use tsx for development, and tsup for production)
- **Linter:** ESLint
- **Formatter:** Prettier
- **Testing:** Vitest

## Local Development

### Setting up the environment variables

You must have a `.env` file in the root of the project. If you don't have one, you can create one by copying the `.env.example` file.

```bash
cp .env.example .env
```

Adjust the environment variables as needed.

### External Authentication Service

This template assumes an external User Authentication Service (`auth-service`) for user verification and information retrieval rather than implementing authentication directly. For development purposes, a minimal mock authentication service is provided. Start it using this command:

```bash
npx tsx scripts/mock-auth-server.ts
```

The mock service will run at `http://localhost:3333`. Set this URL as your `AUTH_SERVICE_URL` environment variable in the `.env` file.

For more information about authentication and authorization, see [docs/memory-bank/03-system-patterns.md](docs/memory-bank/03-system-patterns.md).

### Using Docker for Development (Recommended)

You must have [Docker](https://docs.docker.com/get-docker/) and [VS Code](https://code.visualstudio.com/) installed on your machine. You also need to have the ["Remote - Containers" extension pack](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack) installed in Visual Studio Code.

1. Clone the repository.
2. Open the project directory in Visual Studio Code.
3. If you have the Remote - Containers extension installed, Visual Studio Code will automatically detect the `.vscode/devcontainer.json` file and prompt you to reopen the project in a container. I like to say "no" to this prompt, as I prefer to open the container manually.
4. To open the project in a container, press `command + shift + p` (or `ctrl + shift + p` on Windows) to open the command palette.
5. Type "Dev Containers: Rebuild and Reopen in Container" and select it. This will start the Docker container defined in the `docker-compose.yml` file and attach Visual Studio Code to it.
6. Once the container is running, you can open a terminal in Visual Studio Code and run the application using `pnpm run dev`. The application will be available at `http://localhost:{PORT}` (replace `{PORT}` with the port number configured in your `.env` file). Since the VS Code terminal is running inside the container, you can run any command as if you were inside the container. For example, you can run `pnpm test` to run the tests.
7. Edit the code as needed. The changes will be reflected in the container and on the host machine, thanks to the volume mapping in the `docker-compose.yml` file.
8. To stop the container, you can either close Visual Studio Code or run `docker-compose down` in the terminal. This will stop and remove the container. All changes to the code are persisted thanks to the volume mapping in the `docker-compose.yml` file.

> [!TIP]
> To learn more about how I have configured the development container, refer to the [docs/guides/docker.md](docs/guides/docker.md) file.

### Using Node.js

You must have [Node.js](https://nodejs.org/en/), [pnpm](https://pnpm.io/), and [git](https://git-scm.com/) installed on your machine.

1. Clone the repository.
2. Navigate to the project directory.
3. Install the dependencies: `pnpm install`
4. Run the development server: `pnpm dev`. The API will be available at `http://localhost:{PORT}` (as defined in your `.env` file).
5. Edit the code as needed. The changes will be reflected immediately thanks to the `--watch` flag in the `tsx` command.
6. You can stop the development server by pressing `ctrl + c` in the terminal.

### Debugging

You can debug the application using the VS Code debugger. To do this, you need to add a breakpoint to the code and run the debugger.

1. Add a breakpoint to the code.
2. Run the debugger by pressing `F5` in VS Code. (Alternatively, open the Debug panel in VSCode, select "Debug Application" from the dropdown, and click the green play button).
3. The debugger will stop at the breakpoint.

> [!NOTE]
> To learn more about how I have configured the VS Code debugger, refer to the [docs/guides/vscode.md](docs/guides/vscode.md) file.

## Production Build

### Using Docker for Production (Recommended)

1. SSH into the production server.
2. You must have `git` and `docker` installed on the production server.
3. Clone the repository.
4. Follow the instructions in the [Docker README](docker/README.md) to build and run the application in production.

### Manual Build

1. SSH into the production server.
2. You must have `git`, `node`, and `pnpm` installed on the production server.
3. Clone the repository.
4. Navigate to the project directory.
5. Install the dependencies: `pnpm install`
6. Build the project: `pnpm build`. This will create a `dist` directory with the compiled code.
7. Start the production server: `pnpm start`

This will start the server using the compiled code in the `dist` directory. The API will be available at `http://localhost:{PORT}` (where `{PORT}` is the port number configured in your `.env` file).

### Mapping the Port

In both cases, you must map the port to the production server. For example, if you are using `nginx`, you can add the following to the `nginx.conf` file:

```plaintext
server {
    listen 80;
    server_name example.com;
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

This will map the port `3000` (assuming the port is `3000` in the `.env` file) to the port `80` on the production server which is the default port for `nginx`.

## Testing

We use [Vitest](https://vitest.dev/) for testing. All tests are in the `tests/` directory. This folder should replicate the `src/` folder structure. We aim to test the code at each layer of the application in isolation, by mocking dependencies.

- Run all tests: `pnpm test`
- Run tests in watch mode: `pnpm test:watch`
- Run tests with coverage: `pnpm test:coverage` (coverage is reported in the `coverage/` directory)
  - To view the coverage report, open `coverage/index.html` in your browser.
- Run specific test file: `pnpm test -- tests/controllers/note.controller.test.ts`

For more information about testing, see [docs/memory-bank/03-system-patterns.md](docs/memory-bank/03-system-patterns.md).

## Scripts

We use the `scripts` directory to store scripts that may be useful for the project but are not part of the application. A hello world script is provided as an example (in `scripts/hello-world.ts`).

To run the script, you can use the following commands:

```bash
npx tsx scripts/hello-world.ts
npx tsx --watch scripts/hello-world.ts # to run the script and watch for changes
```

To run a script in debug mode:

- Add a breakpoint to the script.
- Open the Debug panel in VSCode, select "Debug Script" from the dropdown, and click the green play button.

The scripts have access to the same environment variables and dependencies as the application. If you need to install a dependency for a script, do so as a dev dependency so that it is not installed in the production environment (unless you will be running the script in production).
