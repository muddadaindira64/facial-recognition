# Contract

## API Contract

### Base URL

`http://localhost:8000`

### Endpoints

#### `GET /`

Response:
- `status`: `online`
- `message`: application status message
- `models`: available model names

#### `POST /api/register`

Request type: `multipart/form-data`

Required fields:
- `username` (string) — user full name
- `email` (string) — user email address
- `file` (binary) — captured camera image

Success response:
- `success`: `true`
- `message`: confirmation message
- `username`: registered name
- `email`: registered email
- `bbox`: bounding box of detected face

Error responses:
- `400`: missing fields or email already registered
- `422`: invalid image format or no face detected
- `500`: database or internal failure

#### `POST /api/login`

Request type: `multipart/form-data`

Required fields:
- `file` (binary) — captured camera image

Success response:
- `success`: `true`
- `message`: authentication message
- `username`: matched username
- `email`: matched email
- `score`: face similarity score
- `bbox`: detected face bounding box

Error responses:
- `401`: face not recognized
- `422`: invalid image format or no face detected
- `400`: no registered users

#### `GET /api/users`

Response:
- `count`: number of registered users
- `users`: list of user objects
  - `username`
  - `email`
  - `created_at`

#### `DELETE /api/users/{email}`

Path parameter:
- `email` (string)

Success response:
- `success`: `true`
- `message`: deletion confirmation

Error response:
- `404`: user not found

## User Object Contract

Each user record is represented as:
- `username`: displayed full name
- `email`: normalized lowercase email
- `embedding`: JSON array string stored in SQLite
- `created_at`: timestamp of registration

## Frontend Contract

The React app expects the backend to:
- Accept `multipart/form-data` for registration and login.
- Return JSON responses with `success` or `detail` fields.
- Provide CORS access for local frontend development.
- Expose `/api/users` and `/api/users/{email}` for listing and deleting profiles.

### Frontend expectations

- `/api/register` should reject duplicate email addresses.
- `/api/login` should return `detail` on failure.
- `/api/users` should omit `embedding` for list responses.

## Database Contract

Persistence requirements:
- `users` table must exist with columns:
  - `id` INTEGER PRIMARY KEY AUTOINCREMENT
  - `username` TEXT NOT NULL
  - `email` TEXT UNIQUE NOT NULL
  - `embedding` TEXT NOT NULL
  - `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

- Embeddings are serialized with `json.dumps()` and deserialized with `json.loads()`.
- Email matching is case-insensitive and normalized to lowercase.
