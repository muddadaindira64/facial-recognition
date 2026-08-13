# Agent Overview

## Purpose

This project is a secure face recognition access agent that enables users to register and authenticate using webcam face scans. It acts as a lightweight authentication service for enrollment and verification, combining a React frontend, a FastAPI backend, OpenCV face models, and a SQLite database.

## Core Responsibilities

- Capture user face images from the browser webcam.
- Send registration and login payloads to the backend.
- Detect and verify faces using OpenCV YuNet and SFace models.
- Store encrypted face embeddings and user profiles securely.
- Provide a simple directory view of registered users.

## User Interaction Flow

1. User opens the React frontend.
2. User chooses to register or login from the UI.
3. Webcam streams are captured via `WebcamCapture`.
4. On registration, the frontend sends `username`, `email`, and a captured image to `/api/register`.
5. On login, the frontend sends a captured image to `/api/login`.
6. The backend returns a success or error response and the UI updates accordingly.

## Behavioral Rules

- Only one face is accepted per image.
- A registration fails if the email already exists.
- Login succeeds only if face similarity exceeds the defined cosine threshold.
- The backend serves as the source of truth for registered identities.

## Component Roles

- `frontend/src/App.jsx`: orchestrates route state, register/login flows, and error handling.
- `frontend/src/components/WebcamCapture.jsx`: manages webcam access, frame capture, and status indicators.
- `frontend/src/components/Dashboard.jsx`: shows authenticated session details and registered user directory.
- `backend/main.py`: defines API endpoints, request validation, and service wiring.
- `backend/face_engine.py`: performs face detection, alignment, embedding extraction, and verification.
- `backend/db.py`: stores user profiles in SQLite and manages database schema.

## Deployment Behavior

- The backend should run with `uvicorn` or a comparable ASGI server.
- The frontend uses Vite for local development and build preview.
- In production, configure `CORS` origins instead of allowing all origins.
- Model files are downloaded automatically at runtime if missing.
