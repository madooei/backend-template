# API Endpoints Documentation

> **Base URL:**  
> The API base URL depends on your environment (e.g., `http://localhost:3000` for local development, or your production domain).  
> **Do not hardcode the base URL in client applications.**

---

## API Endpoints Quick Reference

| Method | Path       | Description                   | Auth Required |
|--------|------------|-------------------------------|:-------------:|
| GET    | /          | Root endpoint (hello)         |      No       |
| GET    | /health    | Health check                  |      No       |
| GET    | /notes     | List notes (with filters)     |      Yes      |
| GET    | /notes/:id | Get note by ID                |      Yes      |
| POST   | /notes     | Create a new note             |      Yes      |
| PUT    | /notes/:id | Update a note                 |      Yes      |
| DELETE | /notes/:id | Delete a note                 |      Yes      |
| GET    | /events    | Real-time events (SSE stream) |      Yes      |

---

## Endpoint Details

### Root

- **GET /**  
  Returns a simple hello message.  
  **Auth:** Not required

### Health Check

- **GET /health**  
  Returns API health status.  
  **Auth:** Not required  
  **Response:**  
  ```json
  { "status": "ok" }
  ```

### Notes

- **GET /notes**  
  List notes with optional filters, sorting, and pagination.  
  **Query:** `search`, `sortBy`, `sortOrder`, `page`, `limit`, `createdBy`  
  **Response:** Paginated list of notes

- **GET /notes/:id**  
  Get a single note by ID.  
  **Response:** Note object or 404 error

- **POST /notes**  
  Create a new note.  
  **Body:**  
  ```json
  { "content": "Note content" }
  ```
  **Response:** Created note object

- **PUT /notes/:id**  
  Update an existing note.  
  **Body:**  
  ```json
  { "content": "Updated content" }
  ```
  **Response:** Updated note object

- **DELETE /notes/:id**  
  Delete a note by ID.  
  **Response:**  
  ```json
  { "message": "Note deleted successfully" }
  ```

### Real-time Events

- **GET /events**  
  Server-Sent Events (SSE) stream for real-time note events.  
  **Response:** `text/event-stream` with events: `notes:created`, `notes:updated`, `notes:deleted`, and heartbeats.

---

## Authentication

All endpoints except `/` and `/health` require a Bearer token:

```http
Authorization: Bearer <your-token>
```

- **Roles:**  
  - `admin`: Full access  
  - `user`: Access to own notes

---

## Data Models

### Note Object

```json
{
  "id": "note-123",
  "content": "Note content",
  "createdBy": "user-456",
  "createdAt": "2025-06-15T20:30:00.000Z",
  "updatedAt": "2025-06-15T20:35:00.000Z"
}
```

### Create Note

```json
{ "content": "Note content" }
```

### Update Note

```json
{ "content": "Updated content" }
```

### Paginated List

```json
{
  "data": [ /* array of notes */ ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

---

## Error Format

All errors return JSON:

```json
{
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

Common status codes: 400, 401, 403, 404, 500

---

## Real-time Events (SSE)

- **Endpoint:** `GET /events`
- **Auth:** Required
- **Event types:**  
  - `notes:created`
  - `notes:updated`
  - `notes:deleted`
  - Heartbeat (`: heartbeat`)

**Example event:**
```
event: notes:created
data: { ...note event payload... }
```

**Client Example (JS):**
```js
const es = new EventSource('/events', { withCredentials: true });
es.addEventListener('notes:created', e => {
  const data = JSON.parse(e.data);
  // handle new note
});
```

---

## Authorization

- **Admin:** Full access to all notes and events
- **User:** Access only to own notes and related events

---

## Development Notes

- **Base URL:** Environment-dependent (see top of document)
- **Mock Auth Service:** Available at `http://localhost:3333` for development
- **Database:** Uses MongoDB (production/dev) or in-memory (test)
- **CORS:** Enabled for all origins in development

---

## Environment Variables

- `PORT`, `NODE_ENV`, `AUTH_SERVICE_URL`, `MONGODB_HOST`, `MONGODB_PORT`, `MONGODB_DATABASE`

---

## Error Handling

- Validation, authentication, authorization, business logic, and system errors are handled with consistent error responses.
