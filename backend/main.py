from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from face_engine import FaceEngine
from db import Database

app = FastAPI(
    title="Secure Face Recognition API",
    description="API for face-based secure registration and login using OpenCV YuNet and SFace models.",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the React app domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent

# Initialize services
face_engine = FaceEngine(models_dir=str(BASE_DIR / "models"))
db = Database(db_dir=str(BASE_DIR / "data"))

def decode_image(file_bytes: bytes) -> np.ndarray:
    """Decodes uploaded image bytes into a numpy array for OpenCV."""
    nparr = np.frombuffer(file_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Could not decode image."
        )
    return image

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Secure Face Recognition API is running.",
        "models": {
            "detector": "YuNet (face_detection_yunet_2023mar.onnx)",
            "recognizer": "SFace (face_recognition_sface_2021dec.onnx)"
        }
    }

@app.post("/api/register")
async def register_user(
    username: str = Form(...),
    email: str = Form(...),
    file: UploadFile = File(...)
):
    # Sanitize and validate username
    username = username.strip()
    email = email.strip().lower()
    
    if not username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username (name) cannot be empty."
        )
        
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address cannot be empty."
        )
        
    # Check if user already exists by email
    if db.get_user(email) is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{email}' is already registered."
        )

    # Read and decode image
    contents = await file.read()
    image = decode_image(contents)
    
    # Extract face embedding
    embedding, bbox = face_engine.get_embedding(image)
    if embedding is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No face detected in the image. Please align your face to the camera and try again."
        )
        
    # Register in database
    success = db.register_user(username, email, embedding)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user due to a database conflict."
        )
        
    return {
        "success": True,
        "message": f"User '{username}' registered successfully.",
        "username": username,
        "email": email,
        "bbox": bbox
    }

@app.post("/api/login")
async def login_user(file: UploadFile = File(...)):
    # Read and decode image
    contents = await file.read()
    image = decode_image(contents)
    
    # Extract face embedding from login attempt
    login_embedding, bbox = face_engine.get_embedding(image)
    if login_embedding is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No face detected in the frame. Please align your face to the camera."
        )
        
    # Retrieve all users
    users = db.get_all_users()
    if not users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No users registered in the database yet. Please register first."
        )
        
    # Search for matching face (1-to-N verification)
    best_match_username = None
    best_match_email = None
    best_match_score = -1.0
    
    # OpenCV SFace Cosine similarity threshold (score >= 0.363 is a match)
    match_threshold = 0.363
    
    for user in users:
        is_match, score = face_engine.verify(login_embedding, user["embedding"], threshold=match_threshold)
        if is_match and score > best_match_score:
            best_match_score = score
            best_match_username = user["username"]
            best_match_email = user["email"]
            
    if best_match_username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Face unrecognized. Access denied."
        )
        
    return {
        "success": True,
        "message": f"Authentication successful. Welcome, {best_match_username}!",
        "username": best_match_username,
        "email": best_match_email,
        "score": best_match_score,
        "bbox": bbox
    }

@app.get("/api/users")
def list_users():
    """Utility endpoint to list all registered users (without embeddings for security)."""
    users = db.get_all_users()
    return {
        "count": len(users),
        "users": [{"username": u["username"], "email": u["email"], "created_at": u["created_at"]} for u in users]
    }

@app.delete("/api/users/{email}")
def delete_user(email: str):
    """Utility endpoint to delete a user profile by email."""
    success = db.delete_user(email)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email '{email}' not found."
        )
    return {
        "success": True,
        "message": f"User with email '{email}' deleted successfully."
    }
