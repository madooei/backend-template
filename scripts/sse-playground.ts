import { users } from "./mock-users.js";

const connectSSE = async () => {
  try {
    const response = await fetch("http://localhost:3000/events", {
      headers: {
        Authorization: `Bearer ${users[2].userId}`,
        Accept: "text/event-stream",
      },
    });

    console.log("Connected to SSE");
    if (!response.body) {
      throw new Error("Response body is null");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("Connection ended");
        break;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        // console.log("Received line:", line.trim());
        if (line.startsWith("event: notes:created")) {
          console.log("Note created event detected!");
        } else if (line.startsWith("event: notes:updated")) {
          console.log("Note updated event detected!");
        } else if (line.startsWith("event: notes:deleted")) {
          console.log("Note deleted event detected!");
        }
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          console.log("Event data:", JSON.parse(data));
        }
        if (line.startsWith(": heartbeat")) {
          console.log("Heartbeat received");
        }
      }
    }
  } catch (error) {
    console.error("SSE error:", error);
  }
};

connectSSE();
// First, run the server with `pnpm dev` (which starts the Hono app on port
// 3000, and the mock auth server on port 3333).
//
// Then, run this script with `npx tsx scripts/sse-playground.ts`.
// Then open Postman and perform CRUD operations on notes.
// You should see the events logged in the console as you perform operations.
//
// Admin should see all events, while regular users should only see their own
// notes.
// If you want to test with different users, change the userId in the
// Authorization header in the fetch request above. For example, use
// `users[0].userId` for a regular user,
