// chat.js - Updated with WebsimSocket implementation

document.addEventListener('DOMContentLoaded', () => {
  const room = new WebsimSocket();
  const chatContainer = document.getElementById('chat-container');
  const chatHeaderClose = document.getElementById('chat-close');
  const sendChatBtn = document.getElementById('send-chat');
  const chatMessageInput = document.getElementById('chat-message');
  const chatMessages = document.getElementById('chat-messages');

  function toggleChat() {
    chatContainer.style.display = chatContainer.style.display === 'none' ? 'flex' : 'none';
    if (chatContainer.style.display === 'flex') {
      chatMessageInput.focus();
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'c') {
      toggleChat();
    }
  });

  chatHeaderClose.addEventListener('click', toggleChat);

  function sendMessage() {
    const message = chatMessageInput.value.trim();
    if (message === '') return;
    
    room.send({
      type: "chat",
      message: message
    });
    
    chatMessageInput.value = '';
  }

  sendChatBtn.addEventListener('click', sendMessage);
  chatMessageInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  function displayMessage(username, text) {
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.innerHTML = `
      <div class="chat-avatar">
        <img src="https://images.websim.ai/avatar/${username}" alt="${username}">
      </div>
      <div class="chat-content">
        <span class="chat-username">${username}</span>
        <span class="chat-text">${text}</span>
      </div>
    `;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // WebsimSocket event handling
  room.onmessage = (event) => {
    const data = event.data;
    if (data.type === "chat") {
      displayMessage(data.username, data.message);
    }
  };

  // Subscribe to peer updates
  room.party.subscribe((peers) => {
    console.log("Connected peers:", peers);
  });

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes messageAppear {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .chat-message {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 8px 12px;
      margin: 5px 0;
    }

    .chat-avatar {
      display: inline-block;
      width: 30px;
      height: 30px;
      margin-right: 10px;
      vertical-align: top;
    }

    .chat-avatar img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
    }

    .chat-content {
      display: inline-block;
      vertical-align: top;
    }

    .chat-username {
      color: #4fc3f7;
      font-weight: bold;
      margin-right: 8px;
    }

    .chat-text {
      color: #fff;
    }
  `;
  document.head.appendChild(style);
});