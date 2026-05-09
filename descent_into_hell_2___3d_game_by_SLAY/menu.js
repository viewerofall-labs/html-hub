// menu.js - Enhanced with working settings, better functionality and scrolling

document.addEventListener('DOMContentLoaded', () => {
  const openMenuBtn = document.getElementById('open-menu');
  const menuContainer = document.getElementById('menu-container');
  const closeMenuBtn = document.getElementById('close-menu');
  
  // State management with persistence
  let settings = JSON.parse(localStorage.getItem('gameSettings')) || {
    effects: true,
    fog: true,
    hints: true,
    particles: true,
    music: true,
    difficulty: 'normal'
  };

  // Save settings to localStorage
  function saveSettings() {
    localStorage.setItem('gameSettings', JSON.stringify(settings));
  }

  // Enhanced menu content with working controls and scrolling
  menuContainer.innerHTML = `
    <div class="menu-scroll-container">
      <h2>Settings</h2>
      
      <div class="menu-section">
        <h3>Dev Panel</h3>
        <div class="dev-controls">
          <button id="instant-heaven" class="dev-btn">
            Quick Heaven Access
          </button>
          <button id="give-virtues" class="dev-btn">
            Give 10 Virtues
          </button>
          <button id="toggle-godmode" class="dev-btn">
            Toggle God Mode
          </button>
          <button id="spawn-enemy" class="dev-btn">
            Spawn Test Enemy
          </button>
          <div class="dev-info">
            <small>Press ~ to toggle dev panel</small>
          </div>
        </div>
      </div>

      <div class="menu-section">
        <h3>Graphics</h3>
        <button id="toggle-effects" class="setting-btn ${settings.effects ? 'active' : ''}">
          Visual Effects: ${settings.effects ? 'ON' : 'OFF'}
        </button>
        <button id="toggle-fog" class="setting-btn ${settings.fog ? 'active' : ''}">
          Fog Effects: ${settings.fog ? 'ON' : 'OFF'}
        </button>
        <button id="toggle-particles" class="setting-btn ${settings.particles ? 'active' : ''}">
          Particle Effects: ${settings.particles ? 'ON' : 'OFF'}
        </button>
      </div>

      <div class="menu-section">
        <h3>Gameplay</h3>
        <button id="toggle-hints" class="setting-btn ${settings.hints ? 'active' : ''}">
          Hints: ${settings.hints ? 'ON' : 'OFF'}
        </button>
        <select id="difficulty" class="setting-select">
          <option value="easy" ${settings.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
          <option value="normal" ${settings.difficulty === 'normal' ? 'selected' : ''}>Normal</option>
          <option value="hard" ${settings.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
        </select>
      </div>

      <div class="menu-section">
        <h3>Progress</h3>
        <div id="current-stats">
          <div>Health: <span id="menu-health">100%</span></div>
          <div>Souls/Virtues: <span id="menu-souls">0</span></div>
        </div>
        <div id="progress-bar">
          <div class="progress-fill"></div>
        </div>
        <div id="game-requirements">
          <h4>Requirements:</h4>
          <ul>
            <li id="souls-req">✧ Collect 10 Souls/Virtues</li>
            <li id="health-req">✧ Maintain 50%+ Health</li>
            <li>✧ Press 'H' for Heaven</li>
          </ul>
        </div>
      </div>

      <div class="menu-section">
        <h3>Quick Actions</h3>
        <button id="toggle-chat" class="setting-btn">Toggle Chat</button>
        <button id="ascend-heaven" class="setting-btn" style="display: none;">
          Ascend to Heaven
        </button>
      </div>

      <div class="menu-section">
        <h3>Controls</h3>
        <div class="controls-list">
          <div>WASD - Move</div>
          <div>Mouse - Look</div>
          <div>Space - Jump</div>
          <div>Shift - Sprint</div>
          <div>E - Collect</div>
          <div>Left Click - Attack</div>
          <div>C - Chat</div>
          <div>Esc - Menu</div>
        </div>
      </div>
    </div>
    <button id="close-menu" class="close-btn">Close Menu</button>
  `;

  // Initialize and update menu styles
  function initializeMenuStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .menu-scroll-container {
        max-height: 80vh;
        overflow-y: auto;
        padding: 15px;
        scrollbar-width: thin;
        scrollbar-color: #ff3300 rgba(0,0,0,0.2);
      }

      .menu-scroll-container::-webkit-scrollbar {
        width: 8px;
      }

      .menu-scroll-container::-webkit-scrollbar-track {
        background: rgba(0,0,0,0.2);
        border-radius: 4px;
      }

      .menu-scroll-container::-webkit-scrollbar-thumb {
        background: #ff3300;
        border-radius: 4px;
      }

      #menu-container {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 300px;
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid #ff3300;
        border-radius: 10px;
        z-index: 1000;
        display: none;
      }

      #menu-container.visible {
        display: block;
      }
      
      .menu-section {
        margin: 15px 0;
        padding: 15px;
        background: rgba(255, 51, 0, 0.1);
        border-radius: 8px;
      }
      
      .setting-btn {
        width: 100%;
        padding: 12px;
        margin: 8px 0;
        border: 1px solid #ff3300;
        background: rgba(255, 51, 0, 0.2);
        color: #ff3300;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s;
        font-size: 14px;
      }
      
      .setting-btn.active {
        background: #ff3300;
        color: white;
      }

      .setting-btn.special {
        background: #4fc3f7;
        color: white;
        border-color: #03a9f4;
      }
      
      .setting-btn:hover {
        background: #ff5500;
        color: white;
        transform: translateY(-2px);
      }
      
      .setting-select {
        width: 100%;
        padding: 12px;
        margin: 8px 0;
        background: rgba(255, 51, 0, 0.1);
        border: 1px solid #ff3300;
        color: #ff3300;
        border-radius: 6px;
        cursor: pointer;
      }
      
      #progress-bar {
        width: 100%;
        height: 10px;
        background: rgba(255, 51, 0, 0.1);
        border-radius: 5px;
        margin: 10px 0;
        overflow: hidden;
      }
      
      .progress-fill {
        height: 100%;
        width: 0%;
        background: #ff3300;
        border-radius: 5px;
        transition: width 0.3s;
      }

      #current-stats {
        color: #ff3300;
        margin-bottom: 10px;
      }
      
      #game-requirements {
        margin-top: 15px;
        padding: 15px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
      }
      
      #game-requirements ul {
        list-style: none;
        padding: 0;
        margin: 10px 0;
      }
      
      #game-requirements li {
        margin: 8px 0;
        color: #ff3300;
        font-size: 14px;
        padding-left: 20px;
        position: relative;
      }

      #game-requirements li:before {
        content: '✧';
        position: absolute;
        left: 0;
        color: #ff6600;
      }

      #game-requirements li.completed {
        color: #4fc3f7;
      }
      
      .close-btn {
        width: 100%;
        padding: 12px;
        background: #ff3300;
        color: white;
        border: none;
        border-radius: 0 0 8px 8px;
        cursor: pointer;
        transition: background 0.3s;
        font-size: 16px;
      }
      
      .close-btn:hover {
        background: #ff5500;
      }

      .controls-list {
        color: #ff3300;
        font-size: 14px;
      }

      .controls-list div {
        margin: 5px 0;
        padding: 5px 0;
      }

      h2, h3, h4 {
        color: #ff3300;
        margin: 0 0 15px 0;
        text-align: center;
      }
    `;
    document.head.appendChild(style);
  }

  initializeMenuStyles();

  // Add dev panel styles
  const devStyles = document.createElement('style');
  devStyles.textContent = `
    .dev-controls {
      background: rgba(255, 0, 0, 0.1);
      padding: 10px;
      border-radius: 8px; 
      margin-bottom: 15px;
    }

    .dev-btn {
      width: 100%;
      padding: 8px;
      margin: 4px 0;
      background: rgba(255, 0, 0, 0.3);
      border: 1px solid #ff3300;
      color: #ff3300;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .dev-btn:hover {
      background: rgba(255, 0, 0, 0.5);
      transform: translateY(-2px);
    }

    .dev-info {
      color: #ff3300;
      font-size: 12px;
      text-align: center;
      margin-top: 8px;
      opacity: 0.7;
    }
  `;
  document.head.appendChild(devStyles);

  // Dev panel functionality
  let godMode = false;

  document.getElementById('instant-heaven')?.addEventListener('click', () => {
    window.location.href = 'heaven.html';
  });

  document.getElementById('give-virtues')?.addEventListener('click', () => {
    if (window.virtues !== undefined) {
      window.virtues = 10;
      showDevNotification('Added 10 virtues');
      document.querySelector('.stat-item:nth-child(4)').textContent = `VIRTUES COLLECTED: 10`;
    }
  });

  document.getElementById('toggle-godmode')?.addEventListener('click', function() {
    godMode = !godMode;
    if (window.health !== undefined) {
      window.health = 100;
    }
    this.classList.toggle('active');
    showDevNotification(`God Mode: ${godMode ? 'ON' : 'OFF'}`);
  });

  document.getElementById('spawn-enemy')?.addEventListener('click', () => {
    if (window.demonsList && window.Demon) {
      const types = [window.DemonLord, window.SpectralHunter, window.WhisperingShade];
      const RandomEnemy = types[Math.floor(Math.random() * types.length)] || window.Demon;
      window.demonsList.push(new RandomEnemy());
      showDevNotification('Spawned test enemy');
    }
  });

  // Dev notification helper
  function showDevNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'dev-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  }

  // Toggle dev panel with tilde key
  document.addEventListener('keydown', (e) => {
    if (e.key === '`' || e.key === '~') {
      const devControls = document.querySelector('.dev-controls');
      if (devControls) {
        devControls.style.display = devControls.style.display === 'none' ? 'block' : 'none';
      }
    }
  });

  function toggleMenu() {
    menuContainer.classList.toggle('visible');
    window.gameState = window.gameState || {};
    window.gameState.paused = menuContainer.classList.contains('visible');
    
    if (menuContainer.classList.contains('visible')) {
      updateProgressBars();
    }
  }

  function updateProgressBars() {
    // Get stats from UI
    const healthElement = document.getElementById('health');
    const soulsElement = document.querySelector('.stat-item:nth-child(4)');
    
    if (healthElement && soulsElement) {
      const healthText = healthElement.textContent || '100%';
      const health = parseInt(healthText.match(/\d+/)?.[0] || '100');
      
      const soulsText = soulsElement.textContent || '0';
      const souls = parseInt(soulsText.match(/\d+/)?.[0] || '0');
      
      // Update menu stats
      document.getElementById('menu-health').textContent = `${health}%`;
      document.getElementById('menu-souls').textContent = souls.toString();
      
      // Update progress bar
      const progressFill = document.querySelector('.progress-fill');
      const progress = (souls / 10) * 100;
      if (progressFill) {
        progressFill.style.width = `${progress}%`;
      }
      
      // Update requirement checks
      const soulsReq = document.getElementById('souls-req');
      const healthReq = document.getElementById('health-req');
      const ascendBtn = document.getElementById('ascend-heaven');
      
      if (soulsReq && healthReq && ascendBtn) {
        if (souls >= 10) soulsReq.classList.add('completed');
        else soulsReq.classList.remove('completed');
        
        if (health >= 50) healthReq.classList.add('completed');
        else healthReq.classList.remove('completed');
        
        if (souls >= 10 && health >= 50) {
          ascendBtn.style.display = 'block';
          ascendBtn.classList.add('special');
        } else {
          ascendBtn.style.display = 'block';
          ascendBtn.classList.remove('special');
        }
      }
    }
  }

  // Event Handlers
  document.getElementById('toggle-effects')?.addEventListener('click', function() {
    settings.effects = !settings.effects;
    this.classList.toggle('active');
    this.textContent = `Visual Effects: ${settings.effects ? 'ON' : 'OFF'}`;
    document.body.classList.toggle('effects-disabled', !settings.effects);
    saveSettings();
  });

  document.getElementById('toggle-fog')?.addEventListener('click', function() {
    settings.fog = !settings.fog;
    this.classList.toggle('active');
    this.textContent = `Fog Effects: ${settings.fog ? 'ON' : 'OFF'}`;
    if (window.scene?.fog) {
      window.scene.fog.density = settings.fog ? 0.015 : 0;
    }
    saveSettings();
  });

  document.getElementById('toggle-particles')?.addEventListener('click', function() {
    settings.particles = !settings.particles;
    this.classList.toggle('active');
    this.textContent = `Particle Effects: ${settings.particles ? 'ON' : 'OFF'}`;
    document.body.classList.toggle('particles-disabled', !settings.particles);
    saveSettings();
  });

  document.getElementById('toggle-hints')?.addEventListener('click', function() {
    settings.hints = !settings.hints;
    this.classList.toggle('active');
    this.textContent = `Hints: ${settings.hints ? 'ON' : 'OFF'}`;
    saveSettings();
  });

  document.getElementById('difficulty')?.addEventListener('change', function() {
    settings.difficulty = this.value;
    switch(settings.difficulty) {
      case 'easy':
        window.DEMON_COUNT = 3;
        break;
      case 'normal':
        window.DEMON_COUNT = 5;
        break;
      case 'hard':
        window.DEMON_COUNT = 7;
        break;
    }
    saveSettings();
  });

  document.getElementById('ascend-heaven')?.addEventListener('click', function() {
    window.location.href = 'heaven.html';
  });

  document.getElementById('toggle-chat')?.addEventListener('click', function() {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
      chatContainer.style.display = chatContainer.style.display === 'none' ? 'flex' : 'none';
    }
  });

  // Menu toggle handlers
  if (openMenuBtn && closeMenuBtn) {
    openMenuBtn.addEventListener('click', toggleMenu);
    closeMenuBtn.addEventListener('click', toggleMenu);
  }

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menuContainer.contains(e.target) && 
        !openMenuBtn.contains(e.target) && 
        menuContainer.classList.contains('visible')) {
      toggleMenu();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (menuContainer.classList.contains('visible')) {
        toggleMenu();
      }
    } else if (e.key.toLowerCase() === 'h') {
      const soulsCount = parseInt(document.querySelector('.stat-item:nth-child(4)')?.textContent.match(/\d+/)?.[0] || '0');
      const health = parseInt(document.getElementById('health')?.textContent.match(/\d+/)?.[0] || '0');
      
      if (soulsCount >= 10 && health >= 50) {
        window.location.href = 'heaven.html';
      } else {
        window.menuSystem?.showHint('Collect 10 souls/virtues and maintain 50%+ health to ascend!');
      }
    }
  });

  // Update stats periodically
  setInterval(updateProgressBars, 1000);

  // Export menu system for external use
  window.menuSystem = {
    toggleMenu,
    showHint: (message) => {
      if (!settings.hints) return;
      
      const hint = document.createElement('div');
      hint.className = 'hint';
      hint.textContent = message;
      document.body.appendChild(hint);
      setTimeout(() => hint.remove(), 3000);
    },
    updateProgressBars,
    settings
  };
});