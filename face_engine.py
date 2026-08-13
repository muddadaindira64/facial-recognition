import os
import requests
import cv2
import numpy as np

# Model URLs from OpenCV Zoo
YUNET_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
SFACE_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"

class FaceEngine:
    def __init__(self, models_dir="backend/models"):
        self.models_dir = os.path.abspath(models_dir)
        os.makedirs(self.models_dir, exist_ok=True)
        
        self.yunet_path = os.path.join(self.models_dir, "face_detection_yunet_2023mar.onnx")
        self.sface_path = os.path.join(self.models_dir, "face_recognition_sface_2021dec.onnx")
        
        # Download models if not exists
        self._download_model_if_needed(YUNET_URL, self.yunet_path)
        self._download_model_if_needed(SFACE_URL, self.sface_path)
        
        # Load SFace Face Recognizer
        self.recognizer = cv2.FaceRecognizerSF.create(
            model=self.sface_path,
            config="",
            backend_id=cv2.dnn.DNN_BACKEND_OPENCV,
            target_id=cv2.dnn.DNN_TARGET_CPU
        )
        
        # We will create the YuNet detector dynamically based on input size,
        # but let's initialize a placeholder detector with a default size.
        self.detector = cv2.FaceDetectorYN.create(
            model=self.yunet_path,
            config="",
            input_size=(320, 320),
            score_threshold=0.8,
            nms_threshold=0.3,
            top_k=5000,
            backend_id=cv2.dnn.DNN_BACKEND_OPENCV,
            target_id=cv2.dnn.DNN_TARGET_CPU
        )

    def _download_model_if_needed(self, url, dest_path):
        if not os.path.exists(dest_path):
            print(f"Downloading model from {url} to {dest_path}...")
            response = requests.get(url, stream=True)
            response.raise_for_status()
            with open(dest_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print("Download completed successfully.")

    def detect_face(self, image: np.ndarray):
        """
        Detects a face in the image and returns the detector output for the face
        with the highest score, along with its bounding box coordinates.
        """
        h, w = image.shape[:2]
        self.detector.setInputSize((w, h))
        _, faces = self.detector.detect(image)
        
        if faces is None or len(faces) == 0:
            return None, None
            
        # Select the face with the highest confidence score
        # The faces array shape is (N, 15), score is at index 14
        best_face_idx = np.argmax(faces[:, 14])
        best_face = faces[best_face_idx]
        
        # Bounding box is at faces[best_face_idx][0:4] -> [x, y, width, height]
        bbox = best_face[0:4].astype(int).tolist()
        
        return best_face, bbox

    def get_embedding(self, image: np.ndarray):
        """
        Detects, aligns, and crops the face to calculate its 128-dimensional embedding.
        """
        face, bbox = self.detect_face(image)
        if face is None:
            return None, None
            
        # Align and crop the face using SFace
        aligned_face = self.recognizer.alignCrop(image, face)
        
        # Extract features (128-D embedding vector)
        embedding = self.recognizer.feature(aligned_face)
        
        # Convert embedding to flat list of floats for easy serialization
        embedding_flat = embedding.flatten().tolist()
        
        return embedding_flat, bbox

    def verify(self, embedding1: list, embedding2: list, threshold=0.363):
        """
        Compares two 128D embeddings using cosine similarity.
        SFace Cosine similarity default threshold is 0.363.
        Returns: (match: bool, score: float)
        """
        emb1 = np.array(embedding1, dtype=np.float32).reshape(1, -1)
        emb2 = np.array(embedding2, dtype=np.float32).reshape(1, -1)
        
        # Calculate Cosine similarity
        score = self.recognizer.match(emb1, emb2, cv2.FaceRecognizerSF_FR_COSINE)
        
        # COSINE matches if score >= threshold
        is_match = bool(score >= threshold)
        
        return is_match, float(score)
