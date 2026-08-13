import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Home,
  KeyRound,
  Mail,
  Shield,
  User,
  UserPlus,
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import WebcamCapture from './components/WebcamCapture';
import heroImage from './assets/hero.png';

const API_BASE_URL = 'http://localhost:8000';

function getRouteFromHash() {
  const route = window.location.hash.replace('#', '') || '/';
  return ['/', '/login', '/register'].includes(route) ? route : '/';
}

function goTo(route) {
  window.location.hash = route;
}

function NavButton({ route, activeRoute, icon: Icon, children }) {
  return (
    <a className={`nav-link ${activeRoute === route ? 'active' : ''}`} href={`#${route}`}>
      <Icon size={16} />
      <span>{children}</span>
    </a>
  );
}

function HomePage({ route }) {
  return (
    <main className="home-shell">
      <nav className="top-nav">
        <a className="brand-mark" href="#/">
          <Shield size={20} />
          <span>FaceLock</span>
        </a>
        <div className="nav-actions">
          <NavButton route="/" activeRoute={route} icon={Home}>Home</NavButton>
          <NavButton route="/register" activeRoute={route} icon={UserPlus}>Register</NavButton>
          <NavButton route="/login" activeRoute={route} icon={KeyRound}>Login</NavButton>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow">
            <Shield size={14} />
            Secure face recognition
          </div>
          <h1>FaceLock Access Portal</h1>
          <p>
            Register a face profile with name and email, then login instantly with your camera.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#/register">
              <UserPlus size={18} />
              Register
              <ArrowRight size={16} />
            </a>
            <a className="btn btn-secondary" href="#/login">
              <KeyRound size={18} />
              Login
            </a>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <img src={heroImage} alt="" />
          <div className="scan-card">
            <span className="scan-dot"></span>
            Camera Ready
          </div>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [route, setRoute] = useState(getRouteFromHash);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [scanStatus, setScanStatus] = useState('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const captureFuncRef = useRef(null);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(getRouteFromHash());
      setErrorText('');
      setSuccessText('');
      setScanStatus('idle');
      setStatusMessage('');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleRegisterCapture = (captureFunc) => {
    captureFuncRef.current = captureFunc;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorText('');
    setSuccessText('');

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedUsername) {
      setErrorText('Please enter your full name.');
      return;
    }

    if (!trimmedEmail) {
      setErrorText('Please enter your email address.');
      return;
    }

    if (!captureFuncRef.current) {
      setErrorText('Webcam is not ready yet. Please wait.');
      return;
    }

    setLoading(true);
    setScanStatus('scanning');
    setStatusMessage('Capturing face profile, please hold still...');

    try {
      const frameBlob = await captureFuncRef.current();
      if (!frameBlob) {
        throw new Error('Unable to capture video frame. Is the camera active?');
      }

      setStatusMessage('Creating secure face template...');

      const formData = new FormData();
      formData.append('username', trimmedUsername);
      formData.append('email', trimmedEmail);
      formData.append('file', frameBlob, 'register_face.jpg');

      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || 'Registration failed.');
      }

      setScanStatus('success');
      setStatusMessage(`Registered: ${result.username}`);
      setSuccessText(`Registration completed for ${result.username} (${result.email}).`);
      setUsername('');
      setEmail('');

      setTimeout(() => {
        goTo('/login');
      }, 1600);
    } catch (err) {
      setScanStatus('error');
      setStatusMessage('Registration failed.');
      setErrorText(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setErrorText('');
    setSuccessText('');

    if (!captureFuncRef.current) {
      setErrorText('Webcam is not ready yet. Please wait.');
      return;
    }

    setLoading(true);
    setScanStatus('scanning');
    setStatusMessage('Scanning facial profile, please hold still...');

    try {
      const frameBlob = await captureFuncRef.current();
      if (!frameBlob) {
        throw new Error('Unable to capture video frame. Is the camera active?');
      }

      setStatusMessage('Matching your face with registered users...');

      const formData = new FormData();
      formData.append('file', frameBlob, 'login_face.jpg');

      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || 'Access denied.');
      }

      setScanStatus('success');
      setStatusMessage(`Authenticated: ${result.username}`);

      setTimeout(() => {
        setUser({
          username: result.username,
          email: result.email,
          score: result.score,
        });
        setScanStatus('idle');
        setStatusMessage('');
      }, 1000);
    } catch (err) {
      setScanStatus('error');
      setStatusMessage('Verification failed.');
      setErrorText(err.message || 'Face not recognized. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setScanStatus('idle');
    setStatusMessage('');
    setErrorText('');
    setSuccessText('');
    goTo('/');
  };

  if (user) {
    return (
      <main className="auth-page">
        <div className="glass-panel dashboard-panel">
          <Dashboard user={user} onLogout={handleLogout} apiBaseUrl={API_BASE_URL} />
        </div>
      </main>
    );
  }

  if (route === '/') {
    return <HomePage route={route} />;
  }

  const isRegister = route === '/register';

  return (
    <main className="auth-page">
      <nav className="top-nav compact-nav">
        <a className="brand-mark" href="#/">
          <Shield size={20} />
          <span>FaceLock</span>
        </a>
        <div className="nav-actions">
          <NavButton route="/" activeRoute={route} icon={Home}>Home</NavButton>
          <NavButton route="/register" activeRoute={route} icon={UserPlus}>Register</NavButton>
          <NavButton route="/login" activeRoute={route} icon={KeyRound}>Login</NavButton>
        </div>
      </nav>

      <div className={`glass-panel ${scanStatus === 'success' ? 'highlight-success' : scanStatus === 'error' ? 'highlight-danger' : ''}`}>
        <div className="panel-header">
          <div className="panel-icon">
            {isRegister ? <UserPlus size={30} /> : <KeyRound size={30} />}
          </div>
          <h1>{isRegister ? 'Register Face' : 'Face Login'}</h1>
          <p>{isRegister ? 'Create a new profile with your name, email, and face scan.' : 'Use your camera to authenticate with an enrolled face.'}</p>
        </div>

        {errorText && (
          <div className="alert alert-error">
            <AlertTriangle size={18} />
            <span>{errorText}</span>
          </div>
        )}

        {successText && (
          <div className="alert alert-success">
            <CheckCircle2 size={18} />
            <span>{successText}</span>
          </div>
        )}

        <WebcamCapture
          onCapture={handleRegisterCapture}
          status={scanStatus}
          statusMessage={statusMessage}
          mode={isRegister ? 'register' : 'login'}
        />

        {isRegister ? (
          <form onSubmit={handleRegister}>
            <div className="input-grid">
              <div className="input-group">
                <label className="input-label" htmlFor="username">Full Name</label>
                <div className="input-shell">
                  <User size={18} />
                  <input
                    id="username"
                    type="text"
                    className="input-field"
                    placeholder="Enter full name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    maxLength={60}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="email">Email Address</label>
                <div className="input-shell">
                  <Mail size={18} />
                  <input
                    id="email"
                    type="email"
                    className="input-field"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !username.trim() || !email.trim()}
            >
              {loading ? <span className="spinner"></span> : <UserPlus size={18} />}
              {loading ? 'Registering...' : 'Register Face'}
            </button>
          </form>
        ) : (
          <button type="button" className="btn btn-primary" onClick={handleLogin} disabled={loading}>
            {loading ? <span className="spinner"></span> : <KeyRound size={18} />}
            {loading ? 'Verifying...' : 'Login With Face'}
          </button>
        )}
      </div>
    </main>
  );
}
