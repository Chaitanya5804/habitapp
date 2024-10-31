import React, { useState } from 'react';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/request-reset-password', { email });
      console.log(response);
      setSuccess(response.data.message);
      setError('');
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.response?.data?.errors?.email || 'An unexpected error occurred. Please try again.';
      setError(errorMsg);
      setSuccess(''); 
    }
  };

  return (
    <div className="auth-container">
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
        <button type="submit" disabled={success} >Send Reset Link</button>
        {success && <p style={{ color: 'green' }}>{success}</p>}
      </form>
    </div>
  );
};

export default ForgotPassword;
