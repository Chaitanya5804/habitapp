import React from 'react';
import './LandingPage.css';
import { useNavigate } from 'react-router-dom';


const LandingPage = () => {

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };
const navigate = useNavigate();
  return (
    <div>
      <nav className="navbar navbar-expand-lg sticky-top">
        <div className="container-fluid">
          <img src = "/images/logo.png" className="navbar-logo navbar-brand" href="/" alt = 'logo'></img>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <button className="nav-link btn" onClick={() => scrollToSection('features')}>Features</button>
              </li>
              <li className="nav-item">
                <button className="nav-link btn" onClick={() => scrollToSection('contact')}>Contact Us</button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section d-flex align-items-center justify-content-center text-center">
        <div className="container">
          <h1 className="display-4 text-light">Welcome to HabitApp</h1>
          <p className="lead text-light">Build habits, track your progress, and achieve your goals.</p>
          <div className="hero-buttons">
            <button className="btn btn-outline-light mx-2" onClick={() => navigate('/login')}>Login</button>
            <button className="btn btn-outline-light mx-2" onClick={() => navigate('/signup')}>Sign Up</button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <h2 className="section-title">Features of HabitApp</h2>
        <div className="features-list">
          <div className="feature-item">
            <h3>Task Management</h3>
            <p>Admins assign tasks to users. Users can also add their own tasks which count towards streaks.</p>
          </div>
          <div className="feature-item">
            <h3>Streak Tracking</h3>
            <p>Track your streaks based on daily task completion. Miss a day, and the streak resets (except Sundays).</p>
          </div>
          <div className="feature-item">
            <h3>Points and Badges</h3>
            <p>Earn points by completing tasks and unlocking badges as you hit milestones!</p>
          </div>
          <div className="feature-item">
            <h3>Admin Dashboard</h3>
            <p>Admins can view user performance, task completion, and generate monthly reports.</p>
          </div>
        </div>
    </section>

      {/* Contact Us Section */}
      
        <footer id="contact" className="contact-section">
          <h2>Contact Us</h2>
          <div className="contact-info">
            <p>Email: <a href="mailto:contact@habitapp.com">contact@habitapp.com</a></p>
            <p>Phone: <a href="tel:+1234567890">+123-456-7890</a></p>
            <p>LinkedIn: <a href="https://linkedin.com/habitapp" target="_blank" rel="noopener noreferrer">linkedin.com/habitapp</a></p>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} HabitApp. All rights reserved.</p>
          </div>
        </footer>
      

    </div>
  );
};

export default LandingPage;
