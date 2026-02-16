const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubmit = document.getElementById('auth-submit');
const toggleAuthBtn = document.getElementById('toggle-auth');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authStatus = document.getElementById('auth-status');

const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatHistory = document.getElementById('chat-history');
const subjectMode = document.getElementById('subject-mode');
const logoutBtn = document.getElementById('logout-btn');
const welcomeText = document.getElementById('welcome-text');
const dashboard = document.getElementById('dashboard');
const questionsCount = document.getElementById('questions-count');
const messagesCount = document.getElementById('messages-count');
const voiceBtn = document.getElementById('voice-btn');

let isLoginMode = true;
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

function setAuthMode() {
  authTitle.textContent = isLoginMode ? 'Login' : 'Sign Up';
  authSubmit.textContent = isLoginMode ? 'Login' : 'Create Account';
  toggleAuthBtn.textContent = isLoginMode ? 'Need an account? Sign up' : 'Already have an account? Login';
  usernameInput.classList.toggle('hidden', isLoginMode);
  usernameInput.required = !isLoginMode;
  authStatus.textContent = '';
}

function addBubble(role, text) {
  const bubble = document.createElement('div');
  bubble.className = `bubble ${role}`;
  bubble.textContent = text;
  chatHistory.appendChild(bubble);
  chatHistory.scrollTop = chatHistory.scrollHeight;
  return bubble;
}

function showTyping() {
  const typing = document.createElement('div');
  typing.className = 'typing-indicator';
  typing.id = 'typing-indicator';
  typing.innerHTML = '<span></span><span></span><span></span>';
  chatHistory.appendChild(typing);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function hideTyping() {
  document.getElementById('typing-indicator')?.remove();
}

function typeTextEffect(element, text, speed = 15) {
  let index = 0;
  element.textContent = '';

  const timer = setInterval(() => {
    element.textContent += text[index] || '';
    index += 1;
    chatHistory.scrollTop = chatHistory.scrollHeight;
    if (index >= text.length) {
      clearInterval(timer);
      speakText(text);
    }
  }, speed);
}

async function apiRequest(url, method, data) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: data ? JSON.stringify(data) : undefined
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error || 'Request failed');
  }

  return body;
}

async function loadDashboard() {
  try {
    const stats = await apiRequest('/api/dashboard/stats', 'GET');
    questionsCount.textContent = stats.questionsAsked;
    messagesCount.textContent = stats.totalMessages;
  } catch (error) {
    console.error(error.message);
  }
}

async function loadHistory() {
  chatHistory.innerHTML = '';
  try {
    const { history } = await apiRequest('/api/history', 'GET');
    history.forEach((msg) => addBubble(msg.role, msg.content));
  } catch (error) {
    addBubble('assistant', 'Could not load chat history.');
  }
}

function setLoggedInState() {
  if (!token || !currentUser) {
    chatForm.classList.add('hidden');
    dashboard.classList.add('hidden');
    logoutBtn.classList.add('hidden');
    welcomeText.textContent = 'Please log in to start chatting.';
    return;
  }

  chatForm.classList.remove('hidden');
  dashboard.classList.remove('hidden');
  logoutBtn.classList.remove('hidden');
  welcomeText.textContent = `Welcome back, ${currentUser.username}!`;
  loadHistory();
  loadDashboard();
}

function speakText(text) {
  if (!('speechSynthesis' in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
    const payload = {
      email: emailInput.value,
      password: passwordInput.value,
      ...(isLoginMode ? {} : { username: usernameInput.value })
    };

    const data = await apiRequest(endpoint, 'POST', payload);
    token = data.token;
    currentUser = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(currentUser));
    authStatus.style.color = '#4ade80';
    authStatus.textContent = isLoginMode ? 'Login successful!' : 'Account created!';
    setLoggedInState();
  } catch (error) {
    authStatus.style.color = '#f87171';
    authStatus.textContent = error.message;
  }
});

toggleAuthBtn.addEventListener('click', () => {
  isLoginMode = !isLoginMode;
  setAuthMode();
});

logoutBtn.addEventListener('click', () => {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  chatHistory.innerHTML = '';
  setLoggedInState();
});

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = messageInput.value.trim();
  if (!message) {
    return;
  }

  addBubble('user', message);
  messageInput.value = '';
  showTyping();

  try {
    const data = await apiRequest('/api/chat', 'POST', {
      message,
      subjectMode: subjectMode.value
    });

    hideTyping();
    const aiBubble = addBubble('assistant', '');
    typeTextEffect(aiBubble, data.reply);
    loadDashboard();
  } catch (error) {
    hideTyping();
    addBubble('assistant', `Error: ${error.message}`);
  }
});

voiceBtn.addEventListener('click', () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    addBubble('assistant', 'Voice input is not supported in your browser.');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.start();

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    messageInput.value = transcript;
  };

  recognition.onerror = () => {
    addBubble('assistant', 'Voice input failed. Please try again.');
  };
});

setAuthMode();
setLoggedInState();
