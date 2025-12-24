import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to LearnShare</h1>
          <p className="hero-subtitle">
            Share, Buy, and Request Study Resources, Notes, and Exam Prep Materials
          </p>
          <div className="hero-buttons">
            {!isAuthenticated ? (
              <>
                <Link to="/register" className="btn btn-primary">Get Started</Link>
                <Link to="/login" className="btn btn-secondary">Login</Link>
              </>
            ) : (
              <>
                <Link to="/notes" className="btn btn-primary">Browse Notes</Link>
                <Link to="/tutors" className="btn btn-secondary">Find Tutors</Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="features">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>📚 Notes Library</h3>
            <p>Access a vast collection of study materials, notes, and exam prep resources shared by students and tutors.</p>
          </div>
          <div className="feature-card">
            <h3>💳 Secure Payments</h3>
            <p>Upload payment screenshots for verification. All transactions are reviewed by our admin team.</p>
          </div>
          <div className="feature-card">
            <h3>💬 Q&A Forum</h3>
            <p>Ask questions, get answers, and engage with a community of learners and educators.</p>
          </div>
          <div className="feature-card">
            <h3>👨‍🏫 Expert Tutors</h3>
            <p>Connect with experienced tutors, view their profiles, and book personalized learning sessions.</p>
          </div>
          <div className="feature-card">
            <h3>📅 Reminders</h3>
            <p>Never miss a deadline or session with our built-in reminder system.</p>
          </div>
          <div className="feature-card">
            <h3>🎓 Session Booking</h3>
            <p>Schedule one-on-one sessions with tutors at your convenience.</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <h2>Ready to Start Learning?</h2>
        <p>Join our community of students and tutors today!</p>
        {!isAuthenticated && (
          <Link to="/register" className="btn btn-large">Sign Up Now</Link>
        )}
      </section>
    </div>
  );
};

export default Home;
