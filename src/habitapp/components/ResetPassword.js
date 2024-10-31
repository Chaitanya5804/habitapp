import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { validatePassword } from '../utils/validatePassword'; // Import the password validation function

const ResetPassword = () => {
  const { token } = useParams(); 
  console.log(token);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handlePasswordChange = (e) => {
    setNewPassword(e.target.value);
    const errors = validatePassword(e.target.value);
    setPasswordErrors(errors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordErrors.length > 0) {
      setError('Please meet all password requirements');
      return;
    }   

    try {
      const response = await axios.post(`http://localhost:5000/api/reset-password/${token}`, { newPassword });
      setSuccess(response.data.message);
      setTimeout(() => navigate('/'), 3000); // Redirect to login after success
    } catch (err) {
        const errorMsg = err?.response?.data?.errors?.email || 'An error occurred. Please try again.';
        setError(errorMsg);
    }
  };

  return (
    <div className="auth-container">
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={handlePasswordChange}
            required
          />
          {passwordErrors.length > 0 && (
            <ul>
              {passwordErrors.map((err, idx) => (
                <li key={idx} style={{ color: 'red' }}>{err}</li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
        <button type="submit">Reset Password</button>
        {success && <p style={{ color: 'green' }}>{success}</p>}
      </form>
    </div>
  );
};

export default ResetPassword;
