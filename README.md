# Backend Template

This is a template for a backend service built with TypeScript and Hono.js. It provides a basic structure for creating RESTful APIs.

## Technology Stack

- **Language:** TypeScript
- **Framework:** Hono.js
- **Bundler:** Tsup (We use tsx for development, and tsup for production)

## Local Development

You must have [Node.js](https://nodejs.org/en/), [pnpm](https://pnpm.io/), and [git](https://git-scm.com/) installed on your machine.

1. Clone the repository.
2. Navigate to the project directory.
3. Install the dependencies: `pnpm install`
4. Run the development server: `pnpm dev`

The API will be available at `http://localhost:3000`.

## Production Build

To build the project for production, run:

```bash
pnpm build
```

This will create a `dist` directory with the compiled code.

To run the production server, use:

```bash
pnpm start
```

This will start the server using the compiled code in the `dist` directory. The API will be available at `http://localhost:3000`.
