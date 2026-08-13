# Architecture

## System Overview

The project is split into two main layers:

- **Frontend**: React + Vite application for webcam-based registration and authentication.
- **Backend**: FastAPI service that processes images, runs face recognition, and stores user records.

A third layer includes the **model assets** and **database storage** used by the backend.

## High-Level Architecture

- Browser client captures video frames and calls API endpoints.
- FastAPI receives image uploads and request form data.
- `FaceEngine` loads OpenCV models and computes face embeddings.
- `Database` persists user data and embeddings in SQLite.
- Backend returns structured JSON responses to the frontend.

## Component Diagram

- `frontend/`
  - `src/App.jsx`
  - `src/components/WebcamCapture.jsx`
  - `src/components/Dashboard.jsx`
- `backend/`
  - `main.py`
  - `face_engine.py`
  - `db.py`
- `backend/models/`
  - `face_detection_yunet_2023mar.onnx`
  - `face_recognition_sface_2021dec.onnx`
- `backend/data/`
  - `users.db`

## Backend Architecture

### FastAPI Service

- `main.py` creates a FastAPI app with CORS enabled.
- Routes:
  - `GET /` for status.
  - `POST /api/register` for user enrollment.
  - `POST /api/login` for face authentication.
  - `GET /api/users` to list registered users.
  - `DELETE /api/users/{email}` to remove a profile.

### FaceEngine

- Downloads the YuNet and SFace models if not present.
- Uses `cv2.FaceDetectorYN` for face detection.
- Uses `cv2.FaceRecognizerSF` for face alignment and embedding.
- Converts embeddings to JSON-serializable lists.
- Compares embeddings using cosine similarity.

### Database

- Uses SQLite via `sqlite3`.
- Stores users in the `users` table.
- Schema includes `id`, `username`, `email`, `embedding`, and `created_at`.
- Embeddings are stored as JSON strings.

## Frontend Architecture

- Single-page React application with hash-based routing.
- Pages:
  - Home landing page.
  - Register face page.
  - Login face page.
  - Dashboard after successful authentication.
- Webcam capture and browser media flow are handled in `WebcamCapture`.
- API communication uses the `fetch` API.

## Data Flow

1. User captures webcam frame.
2. Frontend packages the image into `FormData`.
3. Backend decodes the image into an OpenCV BGR frame.
4. `FaceEngine` detects the best face and extracts a 128D embedding.
5. Registration stores the embedding in the database.
6. Login verifies the captured embedding against stored embeddings.
7. The backend returns a matching result and optionally the best user profile.

## Security Considerations

- The backend currently allows all CORS origins for development.
- The database stores face embeddings rather than raw face data.
- Embeddings are not hashed; production should consider encryption and stronger access controls.
- The project is intended as a prototype, not a production-ready secure identity platform.
