// helper.js - Robust version that checks both IDs
const handleError = (message) => {
  const errorMessage = document.getElementById('errorMessage');
  if (errorMessage) {
    errorMessage.textContent = message;
  }
  
  // Try tournamentMessage first, then domoMessage
  let messageContainer = document.getElementById('tournamentMessage');
  if (!messageContainer) {
    messageContainer = document.getElementById('domoMessage');
  }
  
  if (messageContainer) {
    messageContainer.classList.remove('hidden');
  }
};

const sendPost = async (url, data, handler) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    // Hide any error message container
    let messageContainer = document.getElementById('tournamentMessage');
    if (!messageContainer) {
      messageContainer = document.getElementById('domoMessage');
    }
    if (messageContainer) {
      messageContainer.classList.add('hidden');
    }

    if(result.redirect) {
      window.location = result.redirect;
    }

    if(result.error) {
      handleError(result.error);
    }

    if(handler) {
      handler(result);
    }
  } catch (err) {
    console.error('Network error:', err);
    handleError('A network error occurred. Please try again.');
  }
};

const hideError = () => {
  let messageContainer = document.getElementById('tournamentMessage');
  if (!messageContainer) {
    messageContainer = document.getElementById('domoMessage');
  }
  if (messageContainer) {
    messageContainer.classList.add('hidden');
  }
};

module.exports = {
  handleError,
  sendPost,
  hideError,
};