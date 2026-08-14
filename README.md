# FaceLock Access Portal

FaceLock is a full-stack face recognition prototype for registering users with a webcam and authenticating them by facial match. The project uses a FastAPI backend with OpenCV YuNet/SFace models and a React + Vite frontend.

## Features

- Webcam-based user registration with name, email, and face capture
- Face login against registered users
- OpenCV YuNet face detection and SFace recognition
- SQLite storage for user records and face embeddings
- React dashboard for authenticated users
- API endpoints for registration, login, listing users, and deleting users

## Tech Stack

- Backend: Python, FastAPI, Uvicorn, OpenCV, NumPy, SQLite
- Frontend: React, Vite, lucide-react
- Models:
  - `face_detection_yunet_2023mar.onnx`
  - `face_recognition_sface_2021dec.onnx`

## Project Structure

```text
.
+-- backend/
|   +-- data/                  # Runtime SQLite database
|   +-- models/                # OpenCV ONNX face models
|   +-- db.py                  # Database helper
|   +-- face_engine.py         # Face detection, embeddings, and verification
|   +-- main.py                # FastAPI application
|   +-- requirements.txt       # Python dependencies
|   +-- test_backend.py        # Backend sanity test
+-- frontend/
|   +-- public/
|   +-- src/
|   |   +-- components/
|   |   +-- App.jsx
|   |   +-- App.css
|   |   +-- index.css
|   |   +-- main.jsx
|   +-- package.json
|   +-- vite.config.js
+-- architecture.md
+-- contract.md
+-- folder structure.md
+-- README.md
```

## Requirements

- Python 3.10 or newer
- Node.js 18 or newer
- A webcam-enabled browser

## Backend Setup

From the project root:

```powershell
cd backend
python -m venv ..\.venv
..\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The backend will run at:

```text
http://localhost:8000
```

API documentation is available at:

```text
http://localhost:8000/docs
```

## Frontend Setup

Open a second terminal from the project root:

```powershell
cd frontend
npm install
npm run dev
```

The frontend will usually run at:

```text
http://localhost:5173
```

The frontend expects the backend API at `http://localhost:8000`.

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Backend status check |
| `POST` | `/api/register` | Register a user with name, email, and face image |
| `POST` | `/api/login` | Authenticate a face image |
| `GET` | `/api/users` | List registered users without embeddings |
| `DELETE` | `/api/users/{email}` | Delete a registered user by email |

## Running Tests

```powershell
cd backend
python test_backend.py
```

## Notes

- This is a prototype project and is not production-ready security software.
- CORS is currently open for local development.
- Face embeddings are stored in SQLite as JSON strings.
- The app stores embeddings instead of raw face images, but production deployments should add encryption, stricter API access control, and safer data retention policies.

## More Documentation

- [Architecture](architecture.md)
- [API Contract](contract.md)
- [Folder Structure](folder%20structure.md)
