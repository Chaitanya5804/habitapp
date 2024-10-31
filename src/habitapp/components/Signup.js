import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import './auth.css';
import Navbar from './Navbar';
import {validatePassword} from '../utils/validatePassword';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [faceDescriptor, setFaceDescriptor] = useState(null); // Store face descriptor
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]); 
  const [error, setError] = useState({ username: '', password: '', role: '', face: '' });
  const [loadingModels, setLoadingModels] = useState(true); // Track model loading state
  const webcamRef = useRef(null);

  const navigate = useNavigate();

  const validateEmail = (email) => {
    if (!email.includes('@')) {
      setError({ ...error, email: 'Email must contain @' });
    } else {
      setError({ ...error, email: '' });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const form = e.target.form;
      const index = Array.prototype.indexOf.call(form, e.target);
      form.elements[index + 1]?.focus();
      e.preventDefault(); // Prevent form submission
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    const errors = validatePassword(e.target.value); // Validate password on input
    setPasswordErrors(errors);
  };

  useEffect(() => {

    const loadModels = async () => {
      await faceapi.nets.ssdMobilenetv1.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights');
      await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights');
      await faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights');
      setLoadingModels(false);
    };

    loadModels();
  }, []);

  const captureFace = async () => {
    if (loadingModels) {
      setError({ ...error, face: 'Face models are still loading. Please wait.' });
      return;
    }

    const video = webcamRef.current.video;
    const detections = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();

    if (detections) {
      setFaceDescriptor(detections.descriptor); // Store the face descriptor in state
      console.log('Face descriptor captured:', detections.descriptor); // Debugging: Log the descriptor
    } else {
      setError({ ...error, face: 'Face not detected. Please try again.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!faceDescriptor) {
      setError({ ...error, face: 'Please capture your face for authentication.' });
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/signup', { 
        username, 
        email,
        password, 
        role, 
        faceDescriptor: Array.from(faceDescriptor) // Send face descriptor to backend
      });
      console.log('Signup successful:', response.data); // Debugging: Log response
      navigate('/login');
    } catch (err) {
      setError(err.response.data.errors);
      console.error('Signup error:', err.response.data); // Debugging: Log error
    }
  };

  return (
    <div>
      <Navbar/>
      <div className="auth-container">
        <h2>Signup</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Username</label>
            <input 
              type="text" 
              value={username} 
              onKeyDown={handleKeyDown}
              onChange={(e) => setUsername(e.target.value)} 
            />
            {error.username && <p>{error.username}</p>}
          </div>
          <div>
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown} 
              onBlur={() => validateEmail(email)}
            />
            {error.email && <p>{error.email}</p>}
          </div>
          <div>
            <label>Password</label>
            <input 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={handlePasswordChange} 
              onKeyDown={handleKeyDown}
            />
            <span onClick={() => setShowPassword(!showPassword)}>👁</span>
            {passwordErrors.length > 0 && (
              <ul>
                {passwordErrors.map((err, idx) => (
                  <li key={idx} style={{ color: 'red' }}>{err}</li>
                ))}
              </ul>
            )}
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
          <div>
            <label>Face Capture</label>
            <Webcam ref={webcamRef} style={{ width: '100%' }} />
            <button type="button" onClick={captureFace}>Capture Face</button>
            {error.face && <p>{error.face}</p>}
          </div>
          <button type="submit">Signup</button>
        </form>
        <p>Already have an account? <button onClick={() => navigate('/login')} className="auth-switch">Login</button></p>
      </div>
    </div>
  );
};

export default Signup;
