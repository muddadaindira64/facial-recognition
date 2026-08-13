import { useCallback, useEffect, useState } from 'react';
import { Calendar, LogOut, Mail, Shield, Trash2, UserCheck, Users } from 'lucide-react';

export default function Dashboard({ user, onLogout, apiBaseUrl = 'http://localhost:8000' }) {
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch registered users to display in list (admin view/demonstration)
  const fetchRegisteredUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/users`);
      if (!response.ok) throw new Error("Failed to load registered users");
      const data = await response.json();
      setRegisteredUsers(data.users || []);
    } catch (err) {
      console.error(err);
      setError("Unable to retrieve user directory.");
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  // Delete a registered user
  const handleDeleteUser = async (userToDelete) => {
    if (!window.confirm(`Delete "${userToDelete.email}"? This face profile will no longer be able to log in.`)) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/users/${encodeURIComponent(userToDelete.email)}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error("Failed to delete user");
      
      // Remove from state or re-fetch
      setRegisteredUsers(prev => prev.filter(u => u.email !== userToDelete.email));
      
      // If current user deletes themselves, force logout
      if (userToDelete.email === user.email) {
        onLogout();
      }
    } catch (err) {
      alert("Error deleting user: " + err.message);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRegisteredUsers();
  }, [fetchRegisteredUsers]);

  // Format matching score as percentage
  const matchPercentage = user.score ? Math.round(user.score * 100) : null;

  return (
    <div className="dashboard-container">
      {/* Visual Avatar with user initials */}
      <div className="welcome-avatar">
        <UserCheck size={44} />
      </div>

      <h1>System Access Granted</h1>
      <p style={{ marginBottom: '1.5rem' }}>Welcome back, <strong>{user.username}</strong>.</p>

      {/* Security alert status */}
      <div className="alert alert-success" style={{ justifyContent: 'center', margin: '0 auto 1.5rem auto', maxWidth: '380px' }}>
        <Shield size={18} />
        <span>Session authenticated via Secure Face ID</span>
      </div>

      {/* Authentication Info Card */}
      <div className="dashboard-card">
        <h2>Session Details</h2>
        <div className="info-row">
          <span className="info-label">Identity:</span>
          <span className="info-value">{user.username}</span>
        </div>
        {user.email && (
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">{user.email}</span>
          </div>
        )}
        {user.score !== undefined && (
          <div className="info-row">
            <span className="info-label">Recognition Confidence:</span>
            <span className="info-value" style={{ color: 'var(--secondary)' }}>
              {matchPercentage}% Cosine Similarity
            </span>
          </div>
        )}
        <div className="info-row">
          <span className="info-label">Auth Method:</span>
          <span className="info-value">Deep Learning (SFace Model)</span>
        </div>
        <div className="info-row">
          <span className="info-label">Login Time:</span>
          <span className="info-value">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Directory of Registered Faces */}
      <div className="dashboard-card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} /> Face Directory
          </h2>
          <span className="muted" style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
            {registeredUsers.length} enrolled
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div className="spinner" style={{ borderTopColor: 'var(--primary)' }}></div>
          </div>
        ) : error ? (
          <p className="muted" style={{ color: 'var(--danger)' }}>{error}</p>
        ) : registeredUsers.length === 0 ? (
          <p className="muted" style={{ fontStyle: 'italic' }}>No other registered faces found.</p>
        ) : (
          <div style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {registeredUsers.map((u) => (
              <div 
                key={u.email} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: u.username === user.username ? 'var(--secondary)' : 'var(--text-primary)' }}>
                    {u.username} {u.email === user.email && "(You)"}
                  </span>
                  <span className="muted" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Mail size={10} /> {u.email}
                  </span>
                  <span className="muted" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={10} /> Enrolled: {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <button 
                  onClick={() => handleDeleteUser(u)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  title="Remove face profile"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="btn btn-secondary" onClick={onLogout} style={{ marginTop: '1rem' }}>
        <LogOut size={16} /> Secure Logout
      </button>
    </div>
  );
}
