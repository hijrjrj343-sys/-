// ===== عناصر DOM =====
const authScreen = document.getElementById('authScreen');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');

const USERS_KEY = 'cairo_school_users';
const CURRENT_USER_KEY = 'cairo_school_current';

// ===== المستخدمون =====
function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null');
}

function saveCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

// ===== تسجيل الدخول =====
function showRegister() {
  loginForm.classList.remove('active-form');
  registerForm.classList.add('active-form');
}

function showLogin() {
  registerForm.classList.remove('active-form');
  loginForm.classList.add('active-form');
}

function togglePassword(id, icon) {
  const input = document.getElementById(id);
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    showToast('⚠️ البريد الإلكتروني أو كلمة المرور غير صحيحة');
    return;
  }

  saveCurrentUser(user);
  enterApp(user);
  loginForm.reset();
});

registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  const confirm = document.getElementById('regConfirm').value.trim();

  if (!name || !email || !password) {
    showToast('⚠️ يرجى ملء جميع الحقول');
    return;
  }

  if (password.length < 6) {
    showToast('⚠️ كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    return;
  }

  if (password !== confirm) {
    showToast('⚠️ كلمة المرور غير متطابقة');
    return;
  }

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    showToast('⚠️ البريد الإلكتروني مستخدم بالفعل');
    return;
  }

  const newUser = { name, email, password };
  users.push(newUser);
  saveUsers(users);
  saveCurrentUser(newUser);

  showToast('✅ تم إنشاء الحساب بنجاح!');
  enterApp(newUser);
  registerForm.reset();
});

function enterApp(user) {
  authScreen.classList.add('hidden');
  mainApp.classList.remove('hidden');
  profileName.textContent = user.name;
  profileEmail.textContent = user.email;
  navigateTo('home');
}

function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  mainApp.classList.add('hidden');
  authScreen.classList.remove('hidden');
  showToast('✅ تم تسجيل الخروج');
}

// ===== التنقل =====
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const targetPage = document.getElementById(`page-${page}`);
  const targetNav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (targetPage) targetPage.classList.add('active-page');
  if (targetNav) targetNav.classList.add('active');
}

// ===== الدردشة =====
chatSendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  const user = getCurrentUser();
  const now = new Date();
  const time = now.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });

  const div = document.createElement('div');
  div.className = 'chat-msg sent';
  div.innerHTML = `<span class="msg-user">${user ? user.name : 'أنت'}</span><p>${escapeHtml(text)}</p><span class="msg-time">${time}</span>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  chatInput.value = '';
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

// ===== التحقق من الجلسة عند التحميل =====
document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  if (user) {
    enterApp(user);
  }
});
