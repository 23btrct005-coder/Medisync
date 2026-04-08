import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', dob: '', gender: '', phone: '', email: '', address: '',
    bloodGroup: '', allergies: '', diseases: '', medications: '',
    emergencyContactName: '', emergencyContactPhone: '',
    password: '', confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (formData.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/register', formData);
      if (response.data.success) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--primary)' }}>
          <Activity size={48} />
        </div>
        <h2 className="form-title">Universal Health Record</h2>
        <p style={{ textAlign: 'center', marginBottom: '2rem' }}>Create your secure patient account</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <h3 className="section-title">Personal Information</h3>
            
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="John Doe" />
            </div>
            
            <div className="form-group">
              <label>Date of Birth *</label>
              <input type="date" name="dob" required value={formData.dob} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Gender *</label>
              <select name="gender" required value={formData.gender} onChange={handleChange}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} placeholder="+1 234 567 8900" />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="john@example.com" />
            </div>

            <div className="form-group full-width">
              <label>Residential Address *</label>
              <textarea name="address" required value={formData.address} onChange={handleChange} placeholder="123 Health Ave..." />
            </div>

            <h3 className="section-title">Medical Information</h3>

            <div className="form-group">
              <label>Blood Group *</label>
              <select name="bloodGroup" required value={formData.bloodGroup} onChange={handleChange}>
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>Allergies</label>
              <textarea name="allergies" value={formData.allergies} onChange={handleChange} placeholder="List any known allergies..." />
            </div>

            <div className="form-group full-width">
              <label>Chronic Diseases</label>
              <textarea name="diseases" value={formData.diseases} onChange={handleChange} placeholder="List any chronic diseases (e.g., Diabetes, Hypertension)..." />
            </div>

            <div className="form-group full-width">
              <label>Current Medications</label>
              <textarea name="medications" value={formData.medications} onChange={handleChange} placeholder="List current medications..." />
            </div>

            <h3 className="section-title">Emergency Contact Information</h3>

            <div className="form-group">
              <label>Emergency Contact Name *</label>
              <input type="text" name="emergencyContactName" required value={formData.emergencyContactName} onChange={handleChange} placeholder="Jane Doe" />
            </div>

            <div className="form-group">
              <label>Emergency Contact Phone *</label>
              <input type="tel" name="emergencyContactPhone" required value={formData.emergencyContactPhone} onChange={handleChange} placeholder="+1 987 654 3210" />
            </div>

            <h3 className="section-title">Account Security</h3>

            <div className="form-group">
              <label>Password *</label>
              <input type="password" name="password" required value={formData.password} onChange={handleChange} placeholder="Minimum 6 characters" />
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} placeholder="Type password again" />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <div className="spinner" /> : 'Register Patient Account'}
          </button>
        </form>

        <div className="text-center">
          <p>Already have an account? <a href="/login" className="link" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Login here</a></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
