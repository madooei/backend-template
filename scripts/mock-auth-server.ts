import { serve } from "@hono/node-server";
import { Hono, type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { users } from "./mock-users";

const PORT = 3333;
const app = new Hono();

app.get("/auth/me", (c: Context) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    throw new HTTPException(401, {
      message: "Authentication required. Bearer token must be provided.",
    });
  }

  const parts = authHeader.split(" ");
  let token: string | undefined;

  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
    token = parts[1];
  }

  if (!token) {
    throw new HTTPException(400, {
      message: "Invalid Authorization header format. Expected Bearer token.",
    });
  }

  const user = users.find((user) => user.userId === token);

  if (!user) {
    throw new HTTPException(401, {
      message: "Authentication failed: user not found or invalid token.",
    });
  }

  return c.json(user, 200);
});

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`Mock Auth Server is running on http://localhost:${info.port}`);
  },
);
