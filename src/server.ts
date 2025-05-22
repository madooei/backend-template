import { serve } from "@hono/node-server";
import { app } from "@/app.ts";
import { env } from "@/env.ts";

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
