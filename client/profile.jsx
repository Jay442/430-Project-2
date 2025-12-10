const React = require('react');
const { useState } = React;
const { createRoot } = require('react-dom/client');

const ChangePasswordForm = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (message) setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Frontend validation
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('New passwords do not match!');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    if (formData.newPassword.length < 1) {
      setMessage('New password must be at least 1 character!');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    // fetch request for password change
    try {
      const response = await fetch('/changePassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.error) {
        setMessage(result.error);
        setMessageType('error');
      } else {
        setMessage('Password changed successfully!');
        setMessageType('success');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        setTimeout(() => {
          setMessage('');
          setMessageType('');
        }, 3000);
      }
    } catch (err) {
      setMessage('An error occurred. Please try again.');
      setMessageType('error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}
      
      <form id="changePasswordForm" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="currentPassword">Current Password</label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            required
            minLength="1"
            disabled={isLoading}
          />
          <small>Must be at least 1 character long</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            minLength="1"
            disabled={isLoading}
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            id="changePasswordBtn" 
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

const init = () => {
  const root = createRoot(document.getElementById('password-section'));
  root.render(<ChangePasswordForm />);
};

window.onload = init;