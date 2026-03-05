import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleBellClick = async () => {
    if (!showDropdown) {
      await fetchNotifications();
    }
    setShowDropdown(!showDropdown);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await notificationService.markAsRead(notification.id);
      fetchUnreadCount();
    }
    setShowDropdown(false);

    // Navigate based on notification type
    const routes = {
      payment_request:      '/my-payments',
      session_booking:      '/my-sessions',
      session_payment:      '/session-payments-review',
      session_confirmed:    '/my-sessions',
      session_cancelled:    '/my-sessions',
      payment_review:       '/my-payments',
      enrollment_request:   '/enrollment-requests',
      enrollment_approved:  '/my-classes',
      enrollment_rejected:  '/my-class-sessions',
      payment_submitted:    '/payment-verifications',
      payment_verified:     '/my-class-sessions',
      payment_rejected:     '/my-classes',
      class_enrollment:     '/my-class-sessions',
      class_review:         '/my-class-sessions',
    };

    const dest = routes[notification.type];
    if (dest) navigate(dest);
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    fetchUnreadCount();
    fetchNotifications();
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-left">
          <Link to="/" className="nav-logo">
            <img src="/LearnShare LOGO og.png" alt="LearnShare" className="logo-image" />
          </Link>
        </div>
        
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
          <li className="nav-item">
            <Link to="/classes" className="nav-link">Classes</Link>
          </li>
          
          {isAuthenticated ? (
            <>
              <li className="nav-item">
                <Link to="/reminders" className="nav-link">Reminders</Link>
              </li>
              <li className="nav-item">
                <Link to="/my-sessions" className="nav-link">Sessions</Link>
              </li>
              {user?.role === 'admin' && (
                <li className="nav-item">
                  <Link to="/admin" className="nav-link">Admin</Link>
                </li>
              )}
              {user?.role === 'tutor' && (
                <li className="nav-item">
                  <Link to="/payment-verifications" className="nav-link">Verify Payments</Link>
                </li>
              )}
              
              {/* Notification Bell */}
              <li className="nav-item notification-container" ref={dropdownRef}>
                <button onClick={handleBellClick} className="notification-bell">
                  🔔
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>

                {showDropdown && (
                  <div className="notification-dropdown">
                    <div className="notification-header">
                      <h4>Notifications</h4>
                      {notifications.length > 0 && (
                        <button onClick={handleMarkAllRead} className="mark-all-read">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="notification-list">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(notif)}
                          >
                            <p className="notification-message">{notif.message}</p>
                            <small className="notification-time">
                              {new Date(notif.created_at).toLocaleString()}
                            </small>
                          </div>
                        ))
                      ) : (
                        <p className="no-notifications">No notifications</p>
                      )}
                    </div>
                  </div>
                )}
              </li>

              {/* Profile at the end */}
              <li className="nav-item">
                <Link to="/profile" className="nav-link profile-nav-link">👤 {user?.username}</Link>
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
