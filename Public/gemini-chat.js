document.addEventListener('DOMContentLoaded', () => {
  // ========== CONFIGURACIÓN ==========
  const API_KEY = 'AIzaSyAHTPjpYefnjr2H76BfsuJGi4q0MYv6PXY';
  const MODEL_NAME = 'gemini-2.0-flash';
  
  const generationConfig = {
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 2048
  };

  // ========== ELEMENTOS DEL DOM ==========
  const chatContainer = document.getElementById('chat-container') || createChatUI();
  const chatMessages = document.getElementById('chat-messages');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const chatToggle = document.getElementById('chat-toggle');
  
  // Crear botón de borrado
  const clearChatBtn = document.createElement('button');
  clearChatBtn.id = 'clear-chat';
  clearChatBtn.innerHTML = '🗑️';
  clearChatBtn.title = 'Borrar historial';
  document.body.appendChild(clearChatBtn);

  // ========== ESTADO DEL CHAT ==========
  let chatHistory = JSON.parse(localStorage.getItem('geminiChat')) || [];
  let isChatOpen = false;

  // ========== FUNCIONES PRINCIPALES ==========
  function init() {
    loadChatHistory();
    setupEventListeners();
  }

  function createChatUI() {
    const container = document.createElement('div');
    container.id = 'chat-container';
    container.innerHTML = `
      <div id="chat-messages"></div>
      <div class="chat-input">
        <input type="text" id="user-input" placeholder="Escribe tu pregunta...">
        <button id="send-btn">Enviar</button>
      </div>
    `;
    document.body.appendChild(container);
    
    const toggle = document.createElement('button');
    toggle.id = 'chat-toggle';
    toggle.textContent = '💬';
    document.body.appendChild(toggle);
    
    return container;
  }

  function loadChatHistory() {
    chatHistory.forEach(msg => {
      appendMessage(msg.role, msg.content);
    });
  }

  function setupEventListeners() {
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
    
    // Toggle del chat
    chatToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleChat(!isChatOpen);
    });
    
    // Botón de borrado
    clearChatBtn.addEventListener('click', clearChatHistory);
    
    // Clic fuera del chat
    document.addEventListener('click', (e) => {
      if (isChatOpen && !isClickInChatArea(e)) {
        toggleChat(false);
      }
    });
    
    chatContainer.addEventListener('click', (e) => e.stopPropagation());
  }

  function toggleChat(open) {
    isChatOpen = open;
    chatContainer.style.display = open ? 'flex' : 'none';
    clearChatBtn.style.display = open ? 'flex' : 'none';
  }

  function isClickInChatArea(e) {
    return chatContainer.contains(e.target) || 
           e.target === chatToggle || 
           chatToggle.contains(e.target) || 
           e.target === clearChatBtn || 
           clearChatBtn.contains(e.target);
  }

  // ========== FUNCIONALIDAD DEL CHAT ==========
  async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    appendMessage('user', message);
    userInput.value = '';
    saveToHistory('user', message);

    const botMessageElement = appendMessage('bot', '⌛ Procesando...');

    try {
      const response = await queryGeminiAPI(message);
      const responseText = await processAPIResponse(response);
      
      botMessageElement.innerHTML = formatMessage(responseText);
      saveToHistory('bot', responseText);
    } catch (error) {
      console.error('Error:', error);
      botMessageElement.textContent = `⚠️ Error: ${error.message}`;
    }
  }

  async function queryGeminiAPI(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
    
    const data = {
      generationConfig,
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Error HTTP: ${response.status}`);
    }
    
    return response.json();
  }

  function processAPIResponse(response) {
    if (!response.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Respuesta inesperada de la API');
    }
    return response.candidates[0].content.parts[0].text;
  }

  // ========== MANEJO DE MENSAJES ==========
  function appendMessage(sender, text) {
    const messagesDiv = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    messageDiv.innerHTML = formatMessage(text);
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return messageDiv;
  }

  function formatMessage(text) {
    const escapedText = escapeHtml(text)
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/\_(.*?)\_/g, '<em>$1</em>')
      .replace(/\~(.*?)\~/g, '<s>$1</s>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/\n/g, '<br>');
    
    return escapedText;
  }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ========== MANEJO DEL HISTORIAL ==========
  function saveToHistory(role, content) {
    chatHistory.push({ role, content });
    localStorage.setItem('geminiChat', JSON.stringify(chatHistory));
  }

  function clearChatHistory() {
    chatHistory = [];
    localStorage.removeItem('geminiChat');
    chatMessages.innerHTML = '';
    appendMessage('bot', 'Listo para seguir en cuenta nueva :D');
  }

  // ========== INICIALIZACIÓN ==========
  init();
});