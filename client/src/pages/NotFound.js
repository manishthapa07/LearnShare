import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '40px 20px',
    }}>
      <div style={{ fontSize: '80px', marginBottom: '16px' }}>🔍</div>
      <h1 style={{ fontSize: '72px', fontWeight: '800', color: '#667eea', margin: 0 }}>404</h1>
      <h2 style={{ fontSize: '24px', color: '#333', marginTop: '12px', marginBottom: '8px' }}>
        Page Not Found
      </h2>
      <p style={{ color: '#666', fontSize: '16px', maxWidth: '400px', marginBottom: '32px' }}>
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          to="/"
          style={{
            padding: '12px 28px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '15px',
          }}
        >
          ← Back to Home
        </Link>
        <Link
          to="/notes"
          style={{
            padding: '12px 28px',
            background: 'transparent',
            color: '#667eea',
            border: '2px solid #667eea',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '15px',
          }}
        >
          Browse Notes
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
