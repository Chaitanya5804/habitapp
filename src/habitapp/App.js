import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import ResetPassword from './components/ResetPassword';
import LandingPage from './components/LandingPage';
import ClassDetails from './components/ClassDetails';
import 'bootstrap/dist/css/bootstrap.min.css';
function App() {
  return (
    <Router>
      <Routes>
      <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin/:usernameOrEmail" element={<AdminDashboard />} />
        <Route path="/user/:usernameOrEmail" element={<UserDashboard />} />
        <Route path = "/request-reset-password" element = {<ForgotPassword/>}/>
        <Route path = "/reset-password/:token" element = {<ResetPassword/>}/>
        <Route path="/class/:classId" element={<ClassDetails />} />
      </Routes>
    </Router>
  ); 
}
export default App;
