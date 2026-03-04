import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

/* ─── GUEST LANDING PAGE ─────────────────────────────────────── */
const GuestHome = () => {
  const stats = [
    { number: '500+', label: 'Study Notes' },
    { number: '100+', label: 'Expert Tutors' },
    { number: '1,000+', label: 'Students' },
    { number: '50+', label: 'Subjects' },
  ];

  const features = [
    { icon: '📚', title: 'Notes Library', desc: 'Access thousands of study materials, notes, and exam prep resources shared by students and tutors.', color: '#667eea' },
    { icon: '👨‍🏫', title: 'Expert Tutors', desc: 'Connect with experienced tutors, view their profiles, and book personalized one-on-one sessions.', color: '#f093fb' },
    { icon: '💬', title: 'Q&A Forum', desc: 'Ask questions, get answers, and engage with a vibrant community of learners and educators.', color: '#4facfe' },
    { icon: '🎓', title: 'Live Classes', desc: 'Enroll in structured classes and attend scheduled online sessions with real-time interaction.', color: '#43e97b' },
    { icon: '📅', title: 'Smart Reminders', desc: 'Never miss a deadline or session with our built-in reminder and notification system.', color: '#fa709a' },
    { icon: '💳', title: 'Secure Payments', desc: 'Upload payment screenshots for easy verification. All transactions are securely reviewed.', color: '#f6d365' },
  ];

  const steps = [
    { num: '01', title: 'Create Account', desc: 'Sign up for free in seconds — no credit card required.' },
    { num: '02', title: 'Explore Resources', desc: 'Browse notes, find tutors, join classes, or ask in the forum.' },
    { num: '03', title: 'Learn & Grow', desc: 'Book sessions, download notes, and track your progress.' },
  ];

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">🚀 The Future of Learning</div>
          <h1>Learn Smarter,<br /><span className="gradient-text">Share Freely</span></h1>
          <p className="hero-subtitle">
            Your all-in-one platform for study notes, expert tutors, live classes,
            and a thriving Q&A community. Level up your education today.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-hero-primary">Get Started Free →</Link>
            <Link to="/login" className="btn btn-hero-secondary">Login</Link>
          </div>
          <div className="hero-trust">
            <span>✅ Free to join</span>
            <span>✅ Verified tutors</span>
            <span>✅ Secure payments</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((s, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-number">{s.number}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="section-label">WHAT WE OFFER</div>
        <h2>Everything You Need to Succeed</h2>
        <p className="section-subtitle">Powerful tools designed to make learning effortless and effective</p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card" key={i} style={{ '--accent': f.color }}>
              <div className="feature-icon" style={{ background: `${f.color}20`, color: f.color }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="hiw-inner">
          <div className="section-label hiw-label">HOW IT WORKS</div>
          <h2>Start Learning in 3 Simple Steps</h2>
          <div className="steps-grid">
            {steps.map((step, i) => (
              <div className="step-card" key={i}>
                <div className="step-num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="cta-inner">
          <h2>Ready to Transform Your Learning?</h2>
          <p>Join thousands of students and tutors already on LearnShare.</p>
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-cta-primary">Create Free Account</Link>
            <Link to="/notes" className="btn btn-cta-secondary">Explore Notes</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

/* ─── LOGGED-IN DASHBOARD ────────────────────────────────────── */
const Dashboard = ({ user }) => {
  const quickLinks = [
    { icon: '📚', title: 'Browse Notes', desc: 'Find & download study materials', to: '/notes', color: '#667eea' },
    { icon: '👨‍🏫', title: 'Find Tutors', desc: 'Book a one-on-one session', to: '/tutors', color: '#f093fb' },
    { icon: '💬', title: 'Forum', desc: 'Ask questions & help others', to: '/forum', color: '#4facfe' },
    { icon: '🎓', title: 'Classes', desc: 'Enroll in live classes', to: '/classes', color: '#43e97b' },
    { icon: '📅', title: 'My Sessions', desc: 'View upcoming sessions', to: '/my-sessions', color: '#fa709a' },
    { icon: '🔔', title: 'Reminders', desc: 'Manage your reminders', to: '/reminders', color: '#f6d365' },
    { icon: '🗂️', title: 'My Classes', desc: 'Classes you enrolled in', to: '/my-classes', color: '#a18cd1' },
    { icon: '📝', title: 'My Notes', desc: 'Notes you purchased', to: '/my-purchased-notes', color: '#fda085' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="dashboard">
      {/* Welcome Banner */}
      <section className="dash-hero">
        <div className="dash-hero-bg">
          <div className="dash-shape ds-1"></div>
          <div className="dash-shape ds-2"></div>
        </div>
        <div className="dash-welcome">
          <span className="dash-greeting-badge">👋 {greeting}</span>
          <h1>Welcome back, <span className="gradient-text" style={{ textTransform: 'capitalize' }}>{user?.full_name || user?.username || 'Learner'}</span>!</h1>
          <p>Ready to continue your learning journey? Pick up where you left off.</p>
          <div className="dash-hero-actions">
            <Link to="/notes" className="btn btn-hero-primary">Browse Notes →</Link>
            <Link to="/profile" className="btn btn-hero-secondary">My Profile</Link>
          </div>
        </div>
      </section>

      {/* Quick Access */}
      <section className="dash-links-section">
        <div className="dash-links-inner">
          <h2 className="dash-section-title">Quick Access</h2>
          <p className="dash-section-sub">Jump straight to what you need</p>
          <div className="dash-links-grid">
            {quickLinks.map((link, i) => (
              <Link to={link.to} className="dash-card" key={i} style={{ '--accent': link.color }}>
                <div className="dash-card-icon" style={{ background: `${link.color}20`, color: link.color }}>{link.icon}</div>
                <div className="dash-card-text">
                  <h3>{link.title}</h3>
                  <p>{link.desc}</p>
                </div>
                <span className="dash-card-arrow" style={{ color: link.color }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Motivational footer strip */}
      <section className="dash-footer-strip">
        <p>🌟 Keep learning — every small step counts. You're doing great, <strong style={{ textTransform: 'capitalize' }}>{user?.full_name || user?.username}</strong>!</p>
      </section>
    </div>
  );
};

/* ─── ROOT COMPONENT ─────────────────────────────────────────── */
const Home = () => {
  const { isAuthenticated, user } = useAuth();
  return isAuthenticated ? <Dashboard user={user} /> : <GuestHome />;
};

export default Home;
