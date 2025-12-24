import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <img src="/LearnShare LOGO.png" alt="LearnShare" className="logo-image" />
        </Link>
        
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/notes" className="nav-link">Notes</Link>
          </li>
          <li className="nav-item">
            <Link to="/forum" className="nav-link">Forum</Link>
          </li>
          <li className="nav-item">
            <Link to="/tutors" className="nav-link">Tutors</Link>
          </li>
          
          {isAuthenticated ? (
            <>
              <li className="nav-item">
                <Link to="/profile" className="nav-link">Profile</Link>
              </li>
              <li className="nav-item">
                <Link to="/reminders" className="nav-link">Reminders</Link>
              </li>
              <li className="nav-item">
                <Link to="/my-sessions" className="nav-link">Sessions</Link>
              </li>
              {user?.role === 'admin' && (
                <li className="nav-item">
                  <Link to="/admin/payments" className="nav-link">Admin</Link>
                </li>
              )}
              <li className="nav-item">
                <button onClick={logout} className="nav-link btn-logout">
                  Logout ({user?.username})
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-link">Login</Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-link btn-register">Register</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
