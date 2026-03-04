import React from 'react';
import './Modal.css';

const Modal = ({ show, title, message, onClose, onConfirm, type = 'info', showCancel = false }) => {
  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'confirm':
        return '?';
      default:
        return 'ℹ';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#27ae60';
      case 'error':
        return '#e74c3c';
      case 'warning':
      case 'confirm':
        return '#f39c12';
      default:
        return '#3498db';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={showCancel ? null : onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon" style={{ color: getIconColor() }}>
          {getIcon()}
        </div>
        {title && <h2 className="modal-title">{title}</h2>}
        <p className="modal-message">{message}</p>
        <div className="modal-buttons">
          {showCancel ? (
            <>
              <button 
                className="modal-button modal-button-cancel" 
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                className="modal-button modal-button-confirm" 
                onClick={handleConfirm}
                style={{ background: getIconColor() }}
              >
                OK
              </button>
            </>
          ) : (
            <button 
              className="modal-button" 
              onClick={onClose} 
              style={{ background: getIconColor() }}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
