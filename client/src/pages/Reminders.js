import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reminderService } from '../services/reminderService';
import './Reminders.css';

const Reminders = () => {
  const navigate = useNavigate();
  const [allReminders, setAllReminders] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'action_required', 'upcoming', 'custom'
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reminder_date: '',
    reminder_time: '',
    type: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    actionRequired: 0
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllReminders();
    // Refresh every 5 minutes to keep timing accurate
    const interval = setInterval(fetchAllReminders, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllReminders = async () => {
    try {
      setLoading(true);
      const data = await reminderService.getAggregatedReminders();
      setAllReminders(data.reminders || []);
      setStats({
        total: data.count || 0,
        critical: data.criticalCount || 0,
        actionRequired: data.actionRequiredCount || 0
      });
    } catch (error) {
      console.error('Error fetching reminders:', error);
      setError('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await reminderService.createReminder(formData);
      setMessage('Reminder created successfully!');
      setFormData({
        title: '',
        description: '',
        reminder_date: '',
        reminder_time: '',
        type: ''
      });
      setShowForm(false);
      fetchAllReminders();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error creating reminder:', error);
      setError(error.response?.data?.error || 'Failed to create reminder');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleMarkComplete = async (reminderId) => {
    try {
      await reminderService.updateReminder(reminderId, { is_completed: true });
      setMessage('Reminder marked as complete!');
      fetchAllReminders();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating reminder:', error);
      setError('Failed to update reminder');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleDelete = async (reminderId) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;

    try {
      await reminderService.deleteReminder(reminderId);
      setMessage('Reminder deleted successfully');
      fetchAllReminders();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting reminder:', error);
      setError('Failed to delete reminder');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleAction = (reminder) => {
    switch (reminder.type) {
      case 'enrollment_request':
        navigate('/enrollment-requests');
        break;
      case 'verify_payment':
      case 'session_payment_verify':
        navigate('/payment-verification');
        break;
      case 'payment_required':
        navigate(`/enrollment-payment/${reminder.relatedId}`);
        break;
      case 'class_starting':
        navigate('/my-class-sessions');
        break;
      case 'session_starting':
      case 'tutor_session':
        navigate('/my-sessions');
        break;
      default:
        break;
    }
  };

  const getFilteredReminders = () => {
    switch (filter) {
      case 'action_required':
        return allReminders.filter(r => r.actionRequired);
      case 'upcoming':
        return allReminders.filter(r => 
          r.type === 'class_starting' || 
          r.type === 'session_starting' || 
          r.type === 'tutor_session'
        );
      case 'custom':
        return allReminders.filter(r => r.type === 'custom');
      default:
        return allReminders;
    }
  };

  const getReminderIcon = (type) => {
    const icons = {
      custom: '📝',
      class_starting: '🎓',
      session_starting: '👨‍🏫',
      tutor_session: '👩‍🏫',
      enrollment_request: '✋',
      payment_required: '💰',
      verify_payment: '✅',
      session_payment_verify: '💳'
    };
    return icons[type] || '🔔';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: '#dc3545',
      high: '#fd7e14',
      medium: '#ffc107',
      low: '#28a745'
    };
    return colors[priority] || '#6c757d';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const filteredReminders = getFilteredReminders();

  return (
    <div className="reminders-container">
      <div className="reminders-header">
        <div>
          <h2>My Reminders</h2>
          <div className="reminders-stats">
            <span className="stat-badge">Total: {stats.total}</span>
            {stats.critical > 0 && (
              <span className="stat-badge critical">Urgent: {stats.critical}</span>
            )}
            {stats.actionRequired > 0 && (
              <span className="stat-badge action">Action Required: {stats.actionRequired}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-new-reminder"
        >
          {showForm ? 'Cancel' : '+ New Reminder'}
        </button>
      </div>

      {message && (
        <div className="message-success">
          {message}
        </div>
      )}

      {error && (
        <div className="message-error">
          {error}
        </div>
      )}

      {showForm && (
        <div className="reminder-form-box">
          <h3>Create Personal Reminder</h3>
          <form onSubmit={handleSubmit}>
            <div className="reminder-form-group">
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Study for Math Exam"
              />
            </div>

            <div className="reminder-form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                placeholder="Additional details about this reminder..."
              />
            </div>

            <div className="reminder-form-grid">
              <div className="reminder-form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={formData.reminder_date}
                  onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                  required
                />
              </div>

              <div className="reminder-form-group">
                <label>Time</label>
                <input
                  type="time"
                  value={formData.reminder_time}
                  onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                />
              </div>

              <div className="reminder-form-group">
                <label>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="">General</option>
                  <option value="study">Study</option>
                  <option value="assignment">Assignment</option>
                  <option value="exam">Exam</option>
                  <option value="session">Tutor Session</option>
                  <option value="payment">Payment</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-submit-reminder">
              Create Reminder
            </button>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="reminder-tabs">
        <button
          onClick={() => setFilter('all')}
          className={`reminder-tab ${filter === 'all' ? 'active' : ''}`}
        >
          All ({allReminders.length})
        </button>
        <button
          onClick={() => setFilter('action_required')}
          className={`reminder-tab ${filter === 'action_required' ? 'active' : ''}`}
        >
          Action Required ({allReminders.filter(r => r.actionRequired).length})
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`reminder-tab ${filter === 'upcoming' ? 'active' : ''}`}
        >
          Upcoming Classes/Sessions
        </button>
        <button
          onClick={() => setFilter('custom')}
          className={`reminder-tab ${filter === 'custom' ? 'active' : ''}`}
        >
          Personal
        </button>
      </div>

      {/* Reminders List */}
      {loading ? (
        <div className="reminders-loading">
          <div className="spinner"></div>
          <p>Loading reminders...</p>
        </div>
      ) : filteredReminders.length === 0 ? (
        <div className="reminders-empty">
          <h3>No reminders</h3>
          <p>
            {filter === 'all' 
              ? 'You have no pending reminders. Create a personal reminder to get started!' 
              : `No ${filter.replace('_', ' ')} reminders at this time.`}
          </p>
        </div>
      ) : (
        <div className="reminders-list">
          {filteredReminders.map((reminder, index) => (
            <div
              key={`${reminder.type}_${reminder.id}_${index}`}
              className={`reminder-card priority-${reminder.priority}`}
              style={{ borderLeftColor: getPriorityColor(reminder.priority) }}
            >
              <div className="reminder-icon">
                {getReminderIcon(reminder.type)}
              </div>
              
              <div className="reminder-content">
                <div className="reminder-header-row">
                  <h3 className="reminder-title">{reminder.title}</h3>
                  <span 
                    className={`priority-badge priority-${reminder.priority}`}
                  >
                    {reminder.priority}
                  </span>
                </div>
                
                <p className="reminder-description">{reminder.description}</p>
                
                <div className="reminder-meta">
                  <span className="meta-item">
                    📅 {formatDate(reminder.date)}
                  </span>
                  {reminder.time && (
                    <span className="meta-item">
                      🕐 {formatTime(reminder.time)}
                    </span>
                  )}
                  {reminder.amount && (
                    <span className="meta-item amount">
                      💵 Rs. {reminder.amount}
                    </span>
                  )}
                </div>
              </div>

              <div className="reminder-actions">
                {reminder.actionRequired && reminder.actionLabel && (
                  <button
                    onClick={() => handleAction(reminder)}
                    className="action-btn primary"
                  >
                    {reminder.actionLabel}
                  </button>
                )}
                {reminder.type === 'custom' && (
                  <>
                    <button
                      onClick={() => handleMarkComplete(reminder.id)}
                      className="action-btn success"
                      title="Mark as complete"
                    >
                      ✓ Complete
                    </button>
                    <button
                      onClick={() => handleDelete(reminder.id)}
                      className="action-btn danger"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </>
                )}
                {(reminder.type === 'class_starting' || 
                  reminder.type === 'session_starting' || 
                  reminder.type === 'tutor_session') && (
                  <button
                    onClick={() => handleAction(reminder)}
                    className="action-btn info"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="reminders-info">
        <p>💡 <strong>Tip:</strong> Reminders refresh automatically every 5 minutes. Critical reminders appear first!</p>
      </div>
    </div>
  );
};

export default Reminders;
