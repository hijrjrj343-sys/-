const API = window.location.origin + '/api';
let TOKEN = localStorage.getItem('cairo_token') || '';
let currentUser = null;
const currentStage = 'first';

function api(path, opts = {}) {
  const headers = { ...(opts.body && !(opts.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}) };
  if (TOKEN) headers['Authorization'] = 'Bearer ' + TOKEN;
  return fetch(API + path, { ...opts, headers }).then(r => {
    if (!r.ok) return r.json().then(e => { throw new Error(e.error || 'خطأ في الطلب'); });
    return r.json();
  });
}

// ===== عناصر DOM =====
const $ = id => document.getElementById(id);
const authScreen = $('authScreen'), mainApp = $('mainApp');
const loginForm = $('loginForm'), registerForm = $('registerForm');
const profileName = $('profileName'), profileEmail = $('profileEmail');

// ===== المصادقة =====
function showRegister() { loginForm.classList.remove('active-form'); registerForm.classList.add('active-form'); }
function showLogin() { registerForm.classList.remove('active-form'); loginForm.classList.add('active-form'); }

function togglePassword(id, icon) {
  const input = $(id);
  input.type = input.type === 'password' ? 'text' : 'password';
  icon.classList.toggle('fa-eye-slash');
}

function showToast(msg, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function previewPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    $('photoPreview').innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
    $('photoPreview').dataset.photo = e.target.result;
  };
  reader.readAsDataURL(file);
}

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const data = await api('/login', {
      method: 'POST',
      body: JSON.stringify({ email: $('loginEmail').value.trim(), password: $('loginPassword').value.trim() })
    });
    TOKEN = data.token;
    localStorage.setItem('cairo_token', TOKEN);
    currentUser = data.user;
    enterApp();
    loginForm.reset();
  } catch (err) { showToast('⚠️ ' + err.message); }
});

registerForm.addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData();
  fd.append('name', $('regName').value.trim());
  fd.append('email', $('regEmail').value.trim());
  fd.append('password', $('regPassword').value.trim());
  const photoData = $('photoPreview').dataset.photo;
  if (photoData) fd.append('photo', dataURLtoBlob(photoData), 'photo.png');

  if (!fd.get('name') || !fd.get('email') || !fd.get('password')) {
    showToast('⚠️ يرجى ملء جميع الحقول'); return;
  }
  if (fd.get('password').length < 6) { showToast('⚠️ كلمة المرور 6 أحرف على الأقل'); return; }
  if ($('regPassword').value !== $('regConfirm').value) { showToast('⚠️ كلمة المرور غير متطابقة'); return; }

  try {
    const data = await api('/register', { method: 'POST', body: fd });
    TOKEN = data.token;
    localStorage.setItem('cairo_token', TOKEN);
    currentUser = data.user;
    showToast('✅ تم إنشاء الحساب بنجاح!');
    enterApp();
    registerForm.reset();
    $('photoPreview').innerHTML = '<i class="fas fa-camera"></i>';
    delete $('photoPreview').dataset.photo;
  } catch (err) { showToast('⚠️ ' + err.message); }
});

function dataURLtoBlob(dataURL) {
  const parts = dataURL.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const bytes = atob(parts[1]);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

async function enterApp() {
  authScreen.classList.add('hidden');
  mainApp.classList.remove('hidden');
  await updateProfileUI();
  navigateTo('home');
}

async function updateProfileUI() {
  if (!currentUser) return;
  profileName.textContent = currentUser.name;
  profileEmail.textContent = currentUser.email;

  const avatar = $('profileAvatar');
  if (currentUser.photo) {
    avatar.innerHTML = `<img src="${window.location.origin}${currentUser.photo}" style="width:80px;height:80px;border-radius:50%;object-fit:cover">`;
  } else {
    avatar.innerHTML = '<i class="fas fa-user-graduate"></i>';
  }

  $('profileQR').innerHTML = '';
  try {
    new QRCode($('profileQR'), {
      text: JSON.stringify({ email: currentUser.email, name: currentUser.name, id: currentUser.id }),
      width: 120, height: 120
    });
  } catch (e) {}

  const adminItem = $('adminPanelItem');
  if (currentUser.is_admin) {
    adminItem.style.display = 'flex';
  } else {
    adminItem.style.display = 'none';
  }
}

async function logout() {
  localStorage.removeItem('cairo_token');
  TOKEN = '';
  currentUser = null;
  mainApp.classList.add('hidden');
  authScreen.classList.remove('hidden');
  showToast('✅ تم تسجيل الخروج');
}

// ===== التنقل =====
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const targetPage = $(`page-${page}`);
  const targetNav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (targetPage) targetPage.classList.add('active-page');
  if (targetNav) targetNav.classList.add('active');
}

// ===== الأخبار =====
async function loadNews() {
  try {
    const news = await api('/news');
    const list = $('newsList');
    list.innerHTML = news.map(n => `
      <div class="news-card">
        ${n.badge ? `<div class="news-badge">${n.badge}</div>` : ''}
        ${n.image ? `<img src="${window.location.origin}${n.image}" class="news-image" onerror="this.style.display='none'">` : ''}
        <h4>${n.title}</h4>
        ${n.content ? `<p>${n.content}</p>` : ''}
        <span class="news-date">${n.date}</span>
      </div>
    `).join('');
  } catch (e) { showToast('⚠️ فشل تحميل الأخبار'); }
}

// ===== الدردشة =====
const chatMessages = $('chatMessages');
const chatInput = $('chatInput');

async function loadMessages() {
  try {
    const msgs = await api('/messages');
    chatMessages.innerHTML = msgs.map(m => `
      <div class="chat-msg ${m.user_id === currentUser?.id ? 'sent' : 'received'}">
        <span class="msg-user">${m.user_name}</span>
        <p>${escapeHtml(m.text)}</p>
        <span class="msg-time">${m.time}</span>
      </div>
    `).join('');
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } catch (e) {}
}

$('chatSendBtn').addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  try {
    await api('/messages', { method: 'POST', body: JSON.stringify({ text }) });
    chatInput.value = '';
    await loadMessages();
  } catch (e) { showToast('⚠️ فشل إرسال الرسالة'); }
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

// ===== الأقسام المهنية =====
const departmentsData = {
  cyber: { name: 'الأمن السيبراني', icon: 'fa-shield-alt', color: '#00bcd4' },
  hardware: { name: 'تجميع الحاسوب', icon: 'fa-desktop', color: '#ff5722' },
  mechanics: { name: 'ميكانيك الأجهزة', icon: 'fa-cogs', color: '#4caf50' },
  mechatronics: { name: 'ميكاترونكس', icon: 'fa-robot', color: '#9c27b0' },
  laser: { name: 'أدوات الليزر', icon: 'fa-light fa-laser', color: '#e91e63' }
};

const dayNames = { sun: 'الأحد', mon: 'الإثنين', tue: 'الثلاثاء', wed: 'الأربعاء', thu: 'الخميس' };
const dayOrder = ['sun', 'mon', 'tue', 'wed', 'thu'];
const stageLabels = { first: 'المرحلة الأولى', second: 'المرحلة الثانية', third: 'المرحلة الثالثة' };
const stageIcons = { first: 'fa-1', second: 'fa-2', third: 'fa-3' };

const deptSubjects = {
  cyber: { first: ['أساسيات الحاسوب','مقدمة في الشبكات','أخلاقيات الإنترنت','لغة إنجليزية','رياضيات'],
    second: ['أمن الشبكات','تشفير البيانات','أنظمة آمنة','قواعد بيانات','برمجة بايثون'],
    third: ['اختبار الاختراق','تحليل برمجيات خبيثة','أمن التطبيقات','إدارة الحوادث','مشروع تخرج'] },
  hardware: { first: ['أساسيات الكهرباء','مكونات الحاسوب','لغة إنجليزية','رياضيات','مقدمة صيانة'],
    second: ['صيانة حاسوب','شبكات حاسوب','تركيب أنظمة','إلكترونيات','صيانة طابعات'],
    third: ['تشخيص أعطال','صيانة لوحات أم','صيانة محمول','إدارة مشاريع','مشروع تخرج'] },
  mechanics: { first: ['أساسيات ميكانيكا','رسم هندسي','رياضيات تطبيقية','لغة إنجليزية','سلامة مهنية'],
    second: ['ميكانيكا عامة','كهرباء أجهزة','تبريد وتكييف','هيدروليك','ورشة ميكانيكا'],
    third: ['صيانة أجهزة','محركات كهربائية','أجهزة قياس','إدارة ورش','مشروع تخرج'] },
  mechatronics: { first: ['أساسيات إلكترونيات','رسم هندسي','رياضيات','فيزياء','لغة إنجليزية'],
    second: ['إلكترونيات','برمجة تحكم','استشعار وتحكم','ميكانيكا دقيقة','دوائر رقمية'],
    third: ['روبوتات','أنظمة مضمنة','ذكاء اصطناعي','أتمتة صناعية','مشروع تخرج'] },
  laser: { first: ['أساسيات بصريات','فيزياء عامة','رياضيات','لغة إنجليزية','سلامة مهنية'],
    second: ['فيزياء الليزر','بصريات','إلكترونيات ليزر','مختبر ليزر','أمن وسلامة'],
    third: ['تطبيقات ليزر','صيانة أجهزة ليزر','ليزر في اتصالات','قياسات بصرية','مشروع تخرج'] }
};

const deptSchedule = {
  cyber: [
    { period: 'الحصة الأولى', time: '٨:٠٠-٨:٤٥', days: { sun:'أمن شبكات',mon:'تشفير',tue:'أمن شبكات',wed:'اختبار اختراق',thu:'قوانين' } },
    { period: 'الحصة الثانية', time: '٨:٤٥-٩:٣٠', days: { sun:'تشفير',mon:'أمن شبكات',tue:'تشفير',wed:'أمن شبكات',thu:'اختبار اختراق' } },
    { period: 'الحصة الثالثة', time: '٩:٤٥-١٠:٣٠', days: { sun:'اختبار اختراق',mon:'أنظمة آمنة',tue:'قوانين',wed:'تشفير',thu:'أمن شبكات' } },
    { period: 'الحصة الرابعة', time: '١٠:٣٠-١١:١٥', days: { sun:'أنظمة آمنة',mon:'اختبار اختراق',tue:'أنظمة آمنة',wed:'قوانين',thu:'تشفير' } },
    { period: 'الحصة الخامسة', time: '١١:٣٠-١٢:١٥', days: { sun:'قوانين',mon:'قوانين',tue:'اختبار اختراق',wed:'أنظمة آمنة',thu:'أنظمة آمنة' } },
    { period: 'الحصة السادسة', time: '١٢:١٥-١:٠٠', days: { sun:'تطبيقات',mon:'تطبيقات',tue:'تطبيقات',wed:'تطبيقات',thu:'تطبيقات' } }
  ],
  hardware: [
    { period: 'الحصة الأولى', time: '٨:٠٠-٨:٤٥', days: { sun:'صيانة',mon:'شبكات',tue:'صيانة',wed:'إلكترونيات',thu:'تشخيص' } },
    { period: 'الحصة الثانية', time: '٨:٤٥-٩:٣٠', days: { sun:'شبكات',mon:'صيانة',tue:'تركيب أنظمة',wed:'صيانة',thu:'إلكترونيات' } },
    { period: 'الحصة الثالثة', time: '٩:٤٥-١٠:٣٠', days: { sun:'تركيب أنظمة',mon:'إلكترونيات',tue:'شبكات',wed:'تشخيص',thu:'صيانة' } },
    { period: 'الحصة الرابعة', time: '١٠:٣٠-١١:١٥', days: { sun:'إلكترونيات',mon:'تركيب أنظمة',tue:'تشخيص',wed:'شبكات',thu:'تركيب أنظمة' } },
    { period: 'الحصة الخامسة', time: '١١:٣٠-١٢:١٥', days: { sun:'تشخيص',mon:'تشخيص',tue:'إلكترونيات',wed:'تركيب أنظمة',thu:'شبكات' } },
    { period: 'الحصة السادسة', time: '١٢:١٥-١:٠٠', days: { sun:'تطبيقات',mon:'تطبيقات',tue:'تطبيقات',wed:'تطبيقات',thu:'تطبيقات' } }
  ],
  mechanics: [
    { period: 'الحصة الأولى', time: '٨:٠٠-٨:٤٥', days: { sun:'ميكانيكا',mon:'كهرباء',tue:'تبريد',wed:'صيانة',thu:'رسم' } },
    { period: 'الحصة الثانية', time: '٨:٤٥-٩:٣٠', days: { sun:'كهرباء',mon:'ميكانيكا',tue:'صيانة',wed:'تبريد',thu:'ميكانيكا' } },
    { period: 'الحصة الثالثة', time: '٩:٤٥-١٠:٣٠', days: { sun:'تبريد',mon:'رسم',tue:'ميكانيكا',wed:'كهرباء',thu:'صيانة' } },
    { period: 'الحصة الرابعة', time: '١٠:٣٠-١١:١٥', days: { sun:'صيانة',mon:'تبريد',tue:'كهرباء',wed:'رسم',thu:'تبريد' } },
    { period: 'الحصة الخامسة', time: '١١:٣٠-١٢:١٥', days: { sun:'رسم',mon:'صيانة',tue:'رسم',wed:'ميكانيكا',thu:'كهرباء' } },
    { period: 'الحصة السادسة', time: '١٢:١٥-١:٠٠', days: { sun:'تطبيقات',mon:'تطبيقات',tue:'تطبيقات',wed:'تطبيقات',thu:'تطبيقات' } }
  ],
  mechatronics: [
    { period: 'الحصة الأولى', time: '٨:٠٠-٨:٤٥', days: { sun:'إلكترونيات',mon:'برمجة',tue:'روبوتات',wed:'استشعار',thu:'ميكانيكا دقيقة' } },
    { period: 'الحصة الثانية', time: '٨:٤٥-٩:٣٠', days: { sun:'برمجة',mon:'إلكترونيات',tue:'استشعار',wed:'روبوتات',thu:'برمجة' } },
    { period: 'الحصة الثالثة', time: '٩:٤٥-١٠:٣٠', days: { sun:'روبوتات',mon:'ميكانيكا دقيقة',tue:'برمجة',wed:'إلكترونيات',thu:'استشعار' } },
    { period: 'الحصة الرابعة', time: '١٠:٣٠-١١:١٥', days: { sun:'استشعار',mon:'روبوتات',tue:'ميكانيكا دقيقة',wed:'برمجة',thu:'روبوتات' } },
    { period: 'الحصة الخامسة', time: '١١:٣٠-١٢:١٥', days: { sun:'ميكانيكا دقيقة',mon:'استشعار',tue:'إلكترونيات',wed:'ميكانيكا دقيقة',thu:'إلكترونيات' } },
    { period: 'الحصة السادسة', time: '١٢:١٥-١:٠٠', days: { sun:'تطبيقات',mon:'تطبيقات',tue:'تطبيقات',wed:'تطبيقات',thu:'تطبيقات' } }
  ],
  laser: [
    { period: 'الحصة الأولى', time: '٨:٠٠-٨:٤٥', days: { sun:'فيزياء',mon:'تطبيقات',tue:'أمن',wed:'بصريات',thu:'صيانة' } },
    { period: 'الحصة الثانية', time: '٨:٤٥-٩:٣٠', days: { sun:'تطبيقات',mon:'فيزياء',tue:'بصريات',wed:'أمن',thu:'تطبيقات' } },
    { period: 'الحصة الثالثة', time: '٩:٤٥-١٠:٣٠', days: { sun:'أمن',mon:'صيانة',tue:'فيزياء',wed:'تطبيقات',thu:'بصريات' } },
    { period: 'الحصة الرابعة', time: '١٠:٣٠-١١:١٥', days: { sun:'بصريات',mon:'أمن',tue:'تطبيقات',wed:'فيزياء',thu:'أمن' } },
    { period: 'الحصة الخامسة', time: '١١:٣٠-١٢:١٥', days: { sun:'صيانة',mon:'بصريات',tue:'صيانة',wed:'صيانة',thu:'فيزياء' } },
    { period: 'الحصة السادسة', time: '١٢:١٥-١:٠٠', days: { sun:'تطبيقات',mon:'تطبيقات',tue:'تطبيقات',wed:'تطبيقات',thu:'تطبيقات' } }
  ]
};

function getSubjectColor(name, def) {
  const colors = {
    'أمن شبكات':'#00bcd4','تشفير':'#9c27b0','اختبار اختراق':'#e91e63','أنظمة آمنة':'#4caf50',
    'قوانين':'#ff9800','تطبيقات':'#607d8b','صيانة':'#ff5722','شبكات':'#2196f3','تركيب أنظمة':'#795548',
    'إلكترونيات':'#3f51b5','تشخيص':'#009688','ميكانيكا':'#4caf50','كهرباء':'#ffc107','تبريد':'#00bcd4',
    'رسم':'#9e9e9e','برمجة':'#673ab7','روبوتات':'#9c27b0','استشعار':'#03a9f4','فيزياء':'#e91e63',
    'بصريات':'#00bcd4','أمن':'#ff9800','ميكانيكا دقيقة':'#795548'
  };
  return colors[name] || def;
}

let currentDeptId = 'cyber';

function openDepartment(id) {
  currentDeptId = id;
  const data = departmentsData[id];
  $('deptDetailIcon').innerHTML = `<i class="fas ${data.icon}"></i>`;
  $('deptDetailName').textContent = data.name;
  $('deptDetailHeader').style.background = `linear-gradient(135deg, ${data.color}dd, ${data.color}88)`;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  $('page-department').classList.add('active-page');

  renderStageTabs();
  renderSubjects();
  renderSchedule();
  loadDeptExams();
  switchDeptTab('subjects');
}

function renderStageTabs() {
  const keys = ['first', 'second', 'third'];
  $('stageTabs').innerHTML = keys.map(k => `
    <button class="stage-tab ${k === 'first' ? 'active' : ''}" onclick="switchStage('${k}')">
      <i class="fas ${stageIcons[k]}"></i> ${stageLabels[k]}
    </button>
  `).join('');
}

function switchStage(key) {
  document.querySelectorAll('.stage-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.stage-tab[onclick*="'${key}'"]`)?.classList.add('active');
  window._stage = key;
  renderSubjects();
}

function renderSubjects() {
  const key = window._stage || 'first';
  const subs = deptSubjects[currentDeptId]?.[key];
  if (!subs) { $('subjectsList').innerHTML = ''; return; }
  const colors = ['#00bcd4','#ff5722','#4caf50','#9c27b0','#e91e63'];
  const icons = ['fa-book','fa-cog','fa-microchip','fa-code','fa-flask'];
  $('subjectsList').innerHTML = subs.map((s, i) => `
    <div class="subject-card" style="--subject-color: ${colors[i % colors.length]}">
      <div class="subject-icon"><i class="fas ${icons[i % icons.length]}"></i></div>
      <div class="subject-info"><h4>${s}</h4><p>مادة دراسية للمرحلة ${stageLabels[key]}</p></div>
      <div class="subject-download"><i class="fas fa-file-pdf"></i></div>
    </div>
  `).join('');
}

function renderSchedule() {
  const schedule = deptSchedule[currentDeptId];
  if (!schedule) { $('scheduleContainer').innerHTML = ''; return; }
  let table = `<table class="schedule-table"><thead><tr><th>الفترة</th>${dayOrder.map(d => `<th>${dayNames[d]}</th>`).join('')}</tr></thead><tbody>`;
  schedule.forEach(row => {
    table += `<tr><td class="period-label">${row.period}<span class="period-time">${row.time}</span></td>`;
    dayOrder.forEach(d => {
      const subj = row.days[d];
      table += `<td><span class="subject-tag" style="--tag-color: ${getSubjectColor(subj, '#607d8b')}">${subj}</span></td>`;
    });
    table += '</tr>';
  });
  table += '</tbody></table>';
  $('scheduleContainer').innerHTML = table;
}

async function loadDeptExams() {
  try {
    const deptMap = { cyber:'cyber', hardware:'hardware', mechanics:'mechanics', mechatronics:'mechatronics', laser:'laser' };
    const exams = await api('/exams?department=' + deptMap[currentDeptId]);
    const stage = window._stage || 'first';
    const filtered = exams.filter(e => !e.stage || e.stage === stage || e.stage === '');

    let html = '';
    if (filtered.length === 0) {
      html = '<div class="empty-state">لا توجد امتحانات متاحة لهذه المرحلة</div>';
    } else {
      html = filtered.map(e => `
        <div class="exam-card" onclick="window.open('${e.pdf_link || '#'}', '_blank')">
          <div class="exam-icon"><i class="fas fa-file-alt"></i></div>
          <div class="exam-info">
            <h4>${e.name}</h4>
            <span class="exam-date">${e.date}</span>
          </div>
          <i class="fas fa-chevron-left exam-arrow"></i>
        </div>
      `).join('');
    }
    $('examsContainer').innerHTML = html;
  } catch (e) {
    $('examsContainer').innerHTML = '<div class="empty-state">فشل تحميل الامتحانات</div>';
  }
}

function switchDeptTab(tab) {
  document.querySelectorAll('.dept-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.dept-tab-panel').forEach(p => p.classList.remove('active-panel'));
  const btn = document.querySelector(`.dept-tab[data-tab="${tab}"]`);
  if (btn) btn.classList.add('active');
  const map = { subjects:'deptSubjects', schedule:'deptSchedule', exams:'deptExams' };
  $(map[tab])?.classList.add('active-panel');
  if (tab === 'exams') loadDeptExams();
}

function closeDepartment() { navigateTo('home'); }

// ===== لوحة التحكم =====
function switchAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active-panel'));
  const btn = document.querySelector(`.admin-tab[data-admin-tab="${tab}"]`);
  if (btn) btn.classList.add('active');
  const map = { news:'adminPanelNews', students:'adminPanelStudents', exams:'adminPanelExams', attendance:'adminPanelAttendance', cards:'adminPanelCards' };
  $(map[tab])?.classList.add('active-panel');
  if (tab === 'news') renderAdminNews();
  if (tab === 'students') renderAdminStudents();
  if (tab === 'exams') renderAdminExams();
  if (tab === 'attendance') renderAdminAttendance();
  if (tab === 'cards') populateCardSelect();
}

function openAdmin() { navigateTo('admin-dashboard'); switchAdminTab('news'); }

// ---- إدارة الأخبار ----
async function renderAdminNews() {
  try {
    const news = await api('/news');
    $('adminNewsList').innerHTML = news.map(n => `
      <div class="news-admin-card">
        ${n.image ? `<div class="news-admin-thumb"><img src="${window.location.origin}${n.image}"></div>` : ''}
        <div class="news-admin-info">
          <span class="news-badge">${n.badge || ''}</span>
          <h4>${n.title}</h4>
          <p>${n.content || ''}</p>
          <span class="news-date">${n.date}</span>
        </div>
        <div class="news-admin-actions">
          <button class="exam-edit-btn" onclick="showEditNewsModal(${n.id})"><i class="fas fa-edit"></i></button>
          <button class="exam-delete-btn" onclick="deleteNews(${n.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  } catch (e) { showToast('⚠️ فشل تحميل الأخبار'); }
}

function showAddNewsModal() {
  showModal(`
    <h3>إضافة خبر جديد</h3>
    <input type="text" id="modalNewsTitle" placeholder="عنوان الخبر">
    <textarea id="modalNewsContent" placeholder="محتوى الخبر"></textarea>
    <input type="text" id="modalNewsBadge" placeholder="الوسم (جديد، مهم، ...)">
    <input type="file" id="modalNewsImage" accept="image/*">
    <div class="modal-actions">
      <button class="modal-btn-primary" onclick="saveNewsModal()">حفظ</button>
      <button class="modal-btn-secondary" onclick="closeModal()">إلغاء</button>
    </div>
  `);
  window._editNewsId = null;
}

function showEditNewsModal(id) {
  showModal(`
    <h3>تعديل الخبر</h3>
    <input type="text" id="modalNewsTitle" placeholder="عنوان الخبر">
    <textarea id="modalNewsContent" placeholder="محتوى الخبر"></textarea>
    <input type="text" id="modalNewsBadge" placeholder="الوسم (جديد، مهم، ...)">
    <input type="file" id="modalNewsImage" accept="image/*">
    <div class="modal-actions">
      <button class="modal-btn-primary" onclick="saveNewsModal()">حفظ</button>
      <button class="modal-btn-secondary" onclick="closeModal()">إلغاء</button>
    </div>
  `);
  window._editNewsId = id;
}

async function saveNewsModal() {
  const title = $('modalNewsTitle').value.trim();
  const content = $('modalNewsContent').value.trim();
  const badge = $('modalNewsBadge').value.trim() || 'خبر';
  const fileInput = $('modalNewsImage');

  if (!title) { showToast('⚠️ أدخل عنوان الخبر'); return; }

  const fd = new FormData();
  fd.append('title', title);
  fd.append('content', content);
  fd.append('badge', badge);
  if (fileInput.files[0]) fd.append('image', fileInput.files[0]);

  try {
    if (window._editNewsId) {
      await api('/news/' + window._editNewsId, { method: 'PUT', body: fd });
    } else {
      await api('/news', { method: 'POST', body: fd });
    }
    closeModal();
    renderAdminNews();
    loadNews();
    showToast('✅ تم حفظ الخبر');
  } catch (e) { showToast('⚠️ ' + e.message); }
}

async function deleteNews(id) {
  if (!confirm('هل تريد حذف هذا الخبر؟')) return;
  try {
    await api('/news/' + id, { method: 'DELETE' });
    renderAdminNews();
    loadNews();
    showToast('✅ تم حذف الخبر');
  } catch (e) { showToast('⚠️ ' + e.message); }
}

// ---- إدارة الطلاب ----
async function renderAdminStudents() {
  try {
    const users = await api('/users');
    const attendance = await api('/attendance');
    $('adminStudentsList').innerHTML = users.map(u => {
      const absences = attendance.filter(a => a.user_id === u.id).length;
      return `<div class="student-item">
        <div class="student-avatar">${u.photo ? `<img src="${window.location.origin}${u.photo}">` : '<i class="fas fa-user-graduate"></i>'}</div>
        <div class="student-info">
          <h4>${u.name}</h4>
          <p>${u.email}</p>
          <span class="student-role ${u.is_admin ? 'admin' : ''}">${u.is_admin ? 'مشرف' : 'طالب'}</span>
          <span>📅 ${absences} يوم حضور</span>
        </div>
      </div>`;
    }).join('');
  } catch (e) { showToast('⚠️ فشل تحميل الطلاب'); }
}

// ---- إدارة الامتحانات ----
async function renderAdminExams() {
  try {
    const exams = await api('/exams');
    $('adminExamsList').innerHTML = exams.map(e => {
      const deptName = departmentsData[e.department]?.name || e.department;
      return `<div class="exam-admin-card">
        <div class="exam-info"><h4>${e.name}</h4><p>${deptName} ${e.stage ? '- ' + (stageLabels[e.stage] || e.stage) : ''}</p><span class="exam-date">${e.date}</span></div>
        <div class="exam-admin-actions">
          ${e.pdf_link ? `<a href="${e.pdf_link}" target="_blank" class="exam-edit-btn"><i class="fas fa-external-link-alt"></i></a>` : ''}
          <button class="exam-edit-btn" onclick="showEditExamModal(${e.id})"><i class="fas fa-edit"></i></button>
          <button class="exam-delete-btn" onclick="deleteExam(${e.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>`;
    }).join('');
  } catch (e) { showToast('⚠️ فشل تحميل الامتحانات'); }
}

function showAddExamModal() {
  const deptOpts = Object.entries(departmentsData).map(([k,v]) => `<option value="${k}">${v.name}</option>`).join('');
  const stageOpts = Object.entries(stageLabels).map(([k,v]) => `<option value="${k}">${v}</option>`).join('');
  showModal(`
    <h3>إضافة امتحان جديد</h3>
    <input type="text" id="modalExamName" placeholder="اسم الامتحان">
    <select id="modalExamDept">${deptOpts}</select>
    <select id="modalExamStage"><option value="">كل المراحل</option>${stageOpts}</select>
    <input type="text" id="modalExamPdf" placeholder="رابط PDF">
    <div class="modal-actions">
      <button class="modal-btn-primary" onclick="saveExamModal()">حفظ</button>
      <button class="modal-btn-secondary" onclick="closeModal()">إلغاء</button>
    </div>
  `);
  window._editExamId = null;
}

function showEditExamModal(id) {
  showAddExamModal();
  window._editExamId = id;
}

async function saveExamModal() {
  const name = $('modalExamName').value.trim();
  const department = $('modalExamDept').value;
  const stage = $('modalExamStage').value;
  const pdf_link = $('modalExamPdf').value.trim();
  if (!name) { showToast('⚠️ أدخل اسم الامتحان'); return; }

  try {
    const body = { name, department, stage, pdf_link };
    if (window._editExamId) {
      await api('/exams/' + window._editExamId, { method: 'PUT', body: JSON.stringify(body) });
    } else {
      await api('/exams', { method: 'POST', body: JSON.stringify(body) });
    }
    closeModal();
    renderAdminExams();
    loadDeptExams();
    showToast('✅ تم حفظ الامتحان');
  } catch (e) { showToast('⚠️ ' + e.message); }
}

async function deleteExam(id) {
  if (!confirm('هل تريد حذف هذا الامتحان؟')) return;
  try {
    await api('/exams/' + id, { method: 'DELETE' });
    renderAdminExams();
    loadDeptExams();
    showToast('✅ تم حذف الامتحان');
  } catch (e) { showToast('⚠️ ' + e.message); }
}

// ---- الحضور ----
async function renderAdminAttendance() {
  try {
    const records = await api('/attendance');
    $('adminAttendanceList').innerHTML = records.map(r => {
      const isPresent = true;
      return `<div class="attendance-item">
        <div class="student-avatar">${r.photo ? `<img src="${window.location.origin}${r.photo}">` : '<i class="fas fa-user"></i>'}</div>
        <div class="attendance-info">
          <h4>${r.user_name}</h4>
          <span class="attendance-status present">✅ حاضر</span>
        </div>
        <span class="exam-date">${r.date}</span>
      </div>`;
    }).join('');
  } catch (e) { showToast('⚠️ فشل تحميل الحضور'); }
}

// ---- بطاقات الطلاب ----
async function populateCardSelect() {
  try {
    const users = await api('/users');
    const nonAdmin = users.filter(u => !u.is_admin);
    $('cardStudentSelect').innerHTML = nonAdmin.map(u =>
      `<option value="${u.id}">${u.name} - ${u.email}</option>`
    ).join('');
    if (nonAdmin.length > 0) generateStudentCard(nonAdmin[0].id);
  } catch (e) {}
}

async function generateStudentCard(userId) {
  try {
    const users = await api('/users');
    const u = users.find(x => x.id == userId);
    if (!u) return;
    const photoUrl = u.photo ? `${window.location.origin}${u.photo}` : '';
    $('cardPreview').innerHTML = `
      <div class="student-card" style="direction:rtl">
        <div class="card-header">
          <h3>إعدادية القاهرة المهنية الرائدة</h3>
          <p>بطاقة تعريف طالب</p>
        </div>
        <div class="card-body">
          <div class="card-photo">${photoUrl ? `<img src="${photoUrl}">` : '<i class="fas fa-user-graduate" style="font-size:48px;color:var(--accent)"></i>'}</div>
          <div class="card-details">
            <h2>${u.name}</h2>
            <p>${u.email}</p>
            <span class="student-role">طالب</span>
          </div>
        </div>
        <div class="card-qr" id="cardQrCode"></div>
        <div class="card-footer">
          <p>${new Date().toLocaleDateString('ar-IQ')}</p>
        </div>
      </div>
    `;
    try {
      new QRCode($('cardQrCode'), {
        text: JSON.stringify({ id: u.id, email: u.email, name: u.name }),
        width: 100, height: 100
      });
    } catch (e) {}
  } catch (e) {}
}

function printStudentCard() {
  const content = $('cardPreview').innerHTML;
  const win = window.open('', '', 'width=400,height=600');
  win.document.write(`<html dir="rtl"><head><link rel="stylesheet" href="style.css"><style>body{padding:20px}</style></head><body>${content}</body></html>`);
  win.document.close();
  win.print();
}

// ===== الماسح الضوئي =====
function openScanner() { navigateTo('scanner'); startScanner(); }

function closeScanner() { stopScanner(); navigateTo('home'); }

async function startScanner() {
  if (typeof Html5Qrcode === 'undefined') {
    $('scannerStatus').textContent = '⚠️ مكتبة المسح غير متوفرة';
    return;
  }
  try {
    const scanner = new Html5Qrcode('scannerReader');
    window._scanner = scanner;
    $('scannerStatus').textContent = '📷 انتظر... يتم تشغيل الكاميرا';
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onScanSuccess,
      () => {}
    );
    $('scannerStatus').textContent = '📷 قم بتوجيه الكاميرا نحو الباركود';
  } catch (e) {
    $('scannerStatus').textContent = '⚠️ تعذر الوصول إلى الكاميرا: ' + e.message;
  }
}

function stopScanner() {
  if (window._scanner) {
    try { window._scanner.stop(); } catch (e) {}
    window._scanner = null;
  }
}

let _scanning = false;

async function onScanSuccess(text) {
  if (_scanning) return;
  _scanning = true;
  try {
    const data = JSON.parse(text);
    const today = new Date().toISOString().split('T')[0];

    await api('/attendance', {
      method: 'POST',
      body: JSON.stringify({ user_id: data.id || data.user_id, date: today })
    });

    $('scannerResult').innerHTML = `<div class="scanner-result success">✅ تم تسجيل حضور ${data.name || data.email || 'الطالب'}</div>`;
    $('scannerStatus').textContent = '✅ تم التسجيل بنجاح';
  } catch (e) {
    $('scannerResult').innerHTML = `<div class="scanner-result error">⚠️ ${e.message}</div>`;
    $('scannerStatus').textContent = '⚠️ ' + e.message;
  }

  setTimeout(() => {
    _scanning = false;
    $('scannerResult').innerHTML = '';
    $('scannerStatus').textContent = '📷 قم بتوجيه الكاميرا نحو الباركود';
  }, 3000);
}

// ===== نوافذ منبثقة =====
function showModal(html) {
  const existing = document.querySelector('.modal-overlay');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.className = 'modal-overlay';
  div.innerHTML = `<div class="modal-content">${html}</div>`;
  document.body.appendChild(div);
}

function closeModal() {
  document.querySelector('.modal-overlay')?.remove();
}

// ===== التهيئة =====
document.addEventListener('DOMContentLoaded', async () => {
  if (TOKEN) {
    try {
      currentUser = await api('/me');
      enterApp();
    } catch (e) {
      localStorage.removeItem('cairo_token');
      TOKEN = '';
    }
  }
});

// Page load hooks
const _origNavigate = navigateTo;
navigateTo = function(page) {
  _origNavigate(page);
  if (page === 'news') loadNews();
  if (page === 'chat') loadMessages();
  if (page === 'account') updateProfileUI();
};
