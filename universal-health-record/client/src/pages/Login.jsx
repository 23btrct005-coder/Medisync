import { useState } from 'react';
import { Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      return setError('Please enter both email and password.');
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/login', { email, password });
      if (response.data.success) {
        setSuccess('Login successful! Redirecting...');
        // Usually, you would store the token in localStorage here:
        localStorage.setItem('token', response.data.token);
        
        // Redirect to a hypothetical dashboard. For now, just alert.
        setTimeout(() => alert(`Welcome back, ${response.data.patient.name}!`), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--primary)' }}>
          <Activity size={48} />
        </div>
        <h2 className="form-title">Login</h2>
        <p style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Access your patient portal</p>
        
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="john@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <div className="spinner" /> : 'Login'}
          </button>
        </form>
        
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ marginBottom: '1rem' }}>Don't have an account?</p>
          <button 
            type="button" 
            className="btn-primary" 
            style={{ backgroundColor: 'var(--surface)', color: 'var(--primary)', border: '1px solid var(--primary)' }}
            onClick={() => navigate('/register')}
          >
            Go to Registration
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
