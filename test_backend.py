import sys
import os

def test_imports_and_downloads():
    print("Testing imports and initializing services...")
    try:
        from face_engine import FaceEngine
        from db import Database
        
        print("Successfully imported face_engine and db.")
        
        # This will trigger model downloads
        print("Initializing FaceEngine (this will download model weights if not present)...")
        engine = FaceEngine(models_dir="backend/models")
        print("FaceEngine initialized successfully.")
        
        print("Checking model files:")
        print(f" - YuNet exists: {os.path.exists(engine.yunet_path)}")
        print(f" - SFace exists: {os.path.exists(engine.sface_path)}")
        
        print("Initializing Database...")
        db = Database(db_dir="backend/data")
        print(f"Database initialized. Path: {db.db_path}")
        print(f" - Database file exists: {os.path.exists(db.db_path)}")
        
        print("All backend checks passed!")
    except Exception as e:
        print(f"Error occurred during tests: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_imports_and_downloads()
