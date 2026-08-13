
import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraOff, RefreshCw } from 'lucide-react';

export default function WebcamCapture({ onCapture, status, statusMessage, mode }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Start webcam
  // Stop webcam
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  // Start webcam
  const startCamera = useCallback(async () => {
    setErrorMessage(null);
    setCameraReady(false);

    // Stop any existing streams first
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for metadata to load to ensure dimensions are ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
            .then(() => setCameraReady(true))
            .catch(() => setErrorMessage("Failed to start video playback."));
        };
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      if (err.name === 'NotAllowedError') {
        setErrorMessage("Camera access denied. Please enable camera permissions in your browser.");
      } else if (err.name === 'NotFoundError') {
        setErrorMessage("No webcam found on this device.");
      } else {
        setErrorMessage("Unable to access camera: " + err.message);
      }
    }
  }, [stopCamera]);

  // Trigger capture frame
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !cameraReady) return null;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    
    // If mirrored, flip the image on the canvas so it matches the visual display
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  }, [cameraReady]);

  // Expose capture via ref or let the parent trigger it via an action
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Expose capture functionality to parent component when onCapture is ready
  useEffect(() => {
    if (onCapture) {
      onCapture(captureFrame);
    }
  }, [onCapture, captureFrame]);

  // Determine container classes based on state
  const getContainerClass = () => {
    let classes = "camera-container";
    if (!cameraReady) return classes;
    
    if (status === "scanning") classes += " scanning";
    else if (status === "success") classes += " success";
    else if (status === "error") classes += " failed";
    
    return classes;
  };

  // Status Indicator Dot and Text
  const renderStatusIndicator = () => {
    if (!cameraReady) {
      return (
        <div className="status-indicator">
          <span className="dot red"></span>
          <span>OFFLINE</span>
        </div>
      );
    }
    
    if (status === "scanning") {
      return (
        <div className="status-indicator">
          <span className="dot cyan"></span>
          <span>SCANNING FACE</span>
        </div>
      );
    }
    
    if (status === "success") {
      return (
        <div className="status-indicator">
          <span className="dot green"></span>
          <span>VERIFIED</span>
        </div>
      );
    }
    
    if (status === "error") {
      return (
        <div className="status-indicator">
          <span className="dot red"></span>
          <span>FAILED</span>
        </div>
      );
    }

    return (
      <div className="status-indicator">
        <span className="dot green"></span>
        <span>READY</span>
      </div>
    );
  };

  return (
    <div style={{ width: '100%' }}>
      <div className={getContainerClass()}>
        {/* Render Webcam Video */}
        <video 
          ref={videoRef}
          className="camera-video"
          playsInline
          muted
          style={{ display: errorMessage ? 'none' : 'block' }}
        />

        {/* Real-time neon scan overlay line */}
        {cameraReady && status === "scanning" && <div className="scanline"></div>}
        {cameraReady && status === "success" && <div className="scanline"></div>}

        {/* Animated Face Reticle outline */}
        {cameraReady && <div className="face-reticle"></div>}

        {/* Top-right status badge */}
        {renderStatusIndicator()}

        {/* Camera error state overlay */}
        {errorMessage && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '2rem', textAlign: 'center',
            background: 'rgba(2, 6, 23, 0.9)',
            zIndex: 10
          }}>
            <CameraOff size={48} className="text-danger" style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
            <p style={{ color: 'white', marginBottom: '1.5rem', fontSize: '0.95rem' }}>{errorMessage}</p>
            <button className="btn btn-secondary" onClick={startCamera} style={{ width: 'auto' }}>
              <RefreshCw size={16} style={{ marginRight: '0.5rem' }} /> Retry Camera
            </button>
          </div>
        )}

        {/* Camera initializing overlay */}
        {!cameraReady && !errorMessage && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(2, 6, 23, 0.8)',
            zIndex: 9
          }}>
            <div className="spinner" style={{ marginBottom: '1rem' }}></div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Accessing secure video stream...</p>
          </div>
        )}
      </div>
      
      {/* Subtitle helper text under webcam */}
      {cameraReady && (
        <p className="muted" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          {statusMessage || (mode === 'login' ? "Look directly into the camera to authenticate." : "Keep your face centered in the grid to capture.")}
        </p>
      )}
    </div>
  );
}
