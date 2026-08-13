# Folder Structure

This project is organized into two main application areas: `backend` and `frontend`.

```
/ (project root)
├── backend/
│   ├── data/
│   │   └── users.db          # SQLite runtime database for registered users
│   ├── models/
│   │   ├── face_detection_yunet_2023mar.onnx
│   │   └── face_recognition_sface_2021dec.onnx
│   ├── db.py                 # SQLite database helper and schema management
│   ├── face_engine.py        # OpenCV face detector, alignment, embedding, and verification
│   ├── main.py               # FastAPI backend application and API endpoints
│   ├── requirements.txt      # Python dependencies for backend services
│   └── test_backend.py       # Basic sanity test for imports and model initialization
├── frontend/
│   ├── public/               # Static public assets served by Vite
│   ├── src/
│   │   ├── App.jsx           # Main React app and route flow
│   │   ├── App.css           # Styling for the frontend UI
│   │   ├── index.css         # Global CSS resets and token definitions
│   │   ├── main.jsx          # React entrypoint
│   │   └── components/
│   │       ├── Dashboard.jsx # Authenticated user dashboard and directory UI
│   │       └── WebcamCapture.jsx # Webcam startup, capture, and status UI
│   ├── package.json          # Node dependencies and Vite scripts
│   ├── README.md             # Frontend project boilerplate documentation
│   └── vite.config.js        # Vite configuration for development and build
└── .venv/                    # Local Python virtual environment (optional)
```

## Notes

- `backend/data/` is created at runtime and holds the `users.db` file.
- `backend/models/` stores downloaded OpenCV ONNX model files.
- `frontend/src/components/` contains reusable UI components.
- `frontend/package.json` specifies React, Vite, and ESLint dependencies.
- `backend/requirements.txt` lists backend Python packages.

## Important files

- `backend/main.py`: the main API application entrypoint.
- `backend/face_engine.py`: face detection and verification logic.
- `backend/db.py`: persistence and database schema logic.
- `frontend/src/App.jsx`: controls registration, login, and routing.
- `frontend/src/components/WebcamCapture.jsx`: interacts with browser camera.
- `frontend/src/components/Dashboard.jsx`: displays auth success and user list.
