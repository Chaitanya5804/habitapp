import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import Navbar from './Navbar';
import Webcam from 'react-webcam';

const Login = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState({ usernameOrEmail: '', password: '', role: '', face: '' });
  const [loadingModels, setLoadingModels] = useState(true); // Loading state for models
  const webcamRef = useRef(null);
  
  const navigate = useNavigate();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const form = e.target.form;
      const index = Array.prototype.indexOf.call(form, e.target);
      form.elements[index + 1]?.focus();
      e.preventDefault(); // Prevent form submission
    }
  };

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights');
        await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights');
        await faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights');
        setLoadingModels(false);  // Set loading to false when models are loaded
      } catch (err) {
        setError({ ...error, face: 'Failed to load face models. Please try again later.' });
      }
    };

    loadModels();
  });

  const handleFaceLogin = async () => {
    if (loadingModels) {
      setError({ ...error, face: 'Face models are still loading, please wait.' });
      return;
    }
  
    if (!role) {
      setError({ ...error, role: 'Role is required for face login' });
      return;
    }
  
    const video = webcamRef.current.video;
    const detections = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();
    const faceDescriptorArray = Array.from(detections.descriptor);
  
    if (detections) {
      console.log('Captured Face Descriptor:', detections.descriptor);
      try {
        // Make the request to the backend
        const response = await axios.post('http://localhost:5000/api/login-face', { 
          usernameOrEmail,
          role,
          faceDescriptor: faceDescriptorArray,
        });
  
        // Ensure the response has data
        if (response && response.data && response.data.success) {
          const {user} = response.data;
          // Redirect based on role
          if (role === 'admin') {
            navigate(`/admin/${user.username}`, { state: { name: user.username, id: user._id } });
          } else {
            navigate(`/user/${user.username}`, { state: { name: user.username, id: user._id } });
          }
        } else {
          // Handle the case where the response is not successful
          setError({ ...error, face: 'Face recognition failed. Please try again.' });
        }
      } catch (err) {
        if (err.response && err.response.data && err.response.data.errors) {
          setError(err.response.data.errors); 
        } else {
          setError({ ...error, face: 'An error occurred during face login. Please try again.' });
        }
      }
    } else {
      setError({ ...error, face: 'Face not recognized. Try again.' });
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usernameOrEmail || !password || !role) {
      setError({
        usernameOrEmail: !usernameOrEmail ? 'Username or email is required' : '',
        password: !password ? 'Password is required' : '',
        role: !role ? 'Role is required' : '',
      });
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/login', { usernameOrEmail, password, role });
      
      // Store JWT token in localStorage
      localStorage.setItem('token', response.data.token);
      const {user} = response.data;

      if (role === 'admin') {
        navigate(`/admin/${user.username}`, { state: { name: user.username, id: user._id } });
      } else {
        navigate(`/user/${user.username}`, { state: { name: user.username, id: user._id } });
      }
    } catch (err) {
      setError(err.response.data.errors);
    }
  };

  return (
    <div>
      <Navbar/>
      <div className="auth-container">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Username or Email</label>
            <input 
              type="text" required = "required"
              value={usernameOrEmail} 
              onKeyDown={handleKeyDown}
              onChange={(e) => setUsernameOrEmail(e.target.value)} 
            />
            {error.usernameOrEmail && <p>{error.usernameOrEmail}</p>}
          </div>
          <div>
            <label>Password</label>
            <input 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onKeyDown={handleKeyDown}
              onChange={(e) => setPassword(e.target.value)} 
            />
            <span onClick={() => setShowPassword(!showPassword)}>👁</span>
            {error.password && <p>{error.password}</p>}
          </div>
          <div>
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">Select Role</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {error.role && <p>{error.role}</p>}
          </div>
          <button type="submit">Login</button>
        </form>
        <p>Don't have an account? <button onClick={() => navigate('/signup')}>Signup</button></p>
        <p>
          <button onClick={() => navigate('/request-reset-password')}>Forgot Password?</button>
        </p>
        
        {/* Show loading message while models are loading */}
        {loadingModels ? <p>Loading face models...</p> : (
          <>
            <h3>Or login with Face</h3>
            <Webcam ref={webcamRef} style={{ width: '100%' }} />
            <button onClick={handleFaceLogin}>Login with Face</button>
            {error.face && <p>{error.face}</p>}
          </>
        )}
      </div>  
    </div>
  );
};

export default Login;
