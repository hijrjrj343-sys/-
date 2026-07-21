const authScreen = document.getElementById('authScreen');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileAvatar = document.getElementById('profileAvatar');
const profileQR = document.getElementById('profileQR');

const USERS_KEY = 'cairo_school_users';
const CURRENT_USER_KEY = 'cairo_school_current';
const NEWS_KEY = 'cairo_school_news';
const EXAMS_KEY = 'cairo_school_exams';
const ATTENDANCE_KEY = 'cairo_school_attendance';

let scannerInstance = null;

function getUsers() { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
function getCurrentUser() { return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null'); }
function saveCurrentUser(user) { localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user)); }
function getNews() { return JSON.parse(localStorage.getItem(NEWS_KEY) || '[]'); }
function saveNews(items) { localStorage.setItem(NEWS_KEY, JSON.stringify(items)); }
function getExams() { return JSON.parse(localStorage.getItem(EXAMS_KEY) || '[]'); }
function saveExams(items) { localStorage.setItem(EXAMS_KEY, JSON.stringify(items)); }
function getAttendance() { return JSON.parse(localStorage.getItem(ATTENDANCE_KEY) || '[]'); }
function saveAttendance(items) { localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(items)); }

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

function previewPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('photoPreview');
    preview.innerHTML = `<img src="${e.target.result}" alt="الصورة">`;
    preview.classList.add('has-image');
    preview.dataset.photo = e.target.result;
  };
  reader.readAsDataURL(file);
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
  const photoPreview = document.getElementById('photoPreview');
  const photo = photoPreview.dataset.photo || '';

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

  const isAdmin = users.length === 0;
  const newUser = { name, email, password, photo, isAdmin };

  users.push(newUser);
  saveUsers(users);
  saveCurrentUser(newUser);

  showToast('✅ تم إنشاء الحساب بنجاح!');
  enterApp(newUser);
  registerForm.reset();
  photoPreview.innerHTML = '<i class="fas fa-camera"></i><span>إضافة صورة شخصية</span>';
  photoPreview.classList.remove('has-image');
  delete photoPreview.dataset.photo;
});

function enterApp(user) {
  authScreen.classList.add('hidden');
  mainApp.classList.remove('hidden');
  updateProfileUI(user);
  initSampleData();
  navigateTo('home');
}

function updateProfileUI(user) {
  profileName.textContent = user.name;
  profileEmail.textContent = user.email;

  if (user.photo) {
    profileAvatar.innerHTML = `<img src="${user.photo}" alt="${user.name}">`;
  } else {
    profileAvatar.innerHTML = '<i class="fas fa-user-graduate"></i>';
  }

  profileQR.innerHTML = '';
  if (typeof QRCode !== 'undefined') {
    try {
      new QRCode(profileQR, {
        text: JSON.stringify({ email: user.email, name: user.name }),
        width: 100,
        height: 100,
        colorDark: '#0d1b2a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    } catch (e) { /* qr library not loaded yet */ }
  }

  const badge = document.getElementById('adminBadge');
  if (badge) {
    badge.textContent = user.isAdmin ? 'مسؤول' : 'طالب';
    badge.style.background = user.isAdmin ? 'var(--accent)' : 'rgba(255,255,255,0.2)';
  }

  const adminLink = document.querySelector('.admin-dashboard-link');
  if (adminLink) {
    adminLink.textContent = user.isAdmin ? 'لوحة التحكم' : 'لوحة التحكم (طلاب)';
  }

  populateAdminSelects();
}

function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  mainApp.classList.add('hidden');
  authScreen.classList.remove('hidden');
  showToast('✅ تم تسجيل الخروج');
}

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const targetPage = document.getElementById(`page-${page}`);
  const targetNav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (targetPage) targetPage.classList.add('active-page');
  if (targetNav) targetNav.classList.add('active');

  if (page === 'news') renderNews();
  if (page === 'account') {
    const user = getCurrentUser();
    if (user) updateProfileUI(user);
  }
  if (page === 'admin-dashboard') {
    switchAdminTab('news');
    populateAdminSelects();
  }
}

function initSampleData() {
  if (!localStorage.getItem(NEWS_KEY)) {
    saveNews([
      { id: 'n1', title: 'افتتاح معمل الأمن السيبراني', content: 'تم افتتاح أحدث معمل للأمن السيبراني برعاية وزارة التربية', image: '', badge: 'جديد', date: '٢٠ يوليو ٢٠٢٦' },
      { id: 'n2', title: 'نتائج الامتحانات النهائية', content: 'يمكنكم الآن الاستعلام عن نتائج الامتحانات عبر المنصة', image: '', badge: 'مهم', date: '١٥ يوليو ٢٠٢٦' },
      { id: 'n3', title: 'مسابقة الروبوتات السنوية', content: 'تعلن المدرسة عن مسابقة الروبوتات لطلاب قسم الميكاترونكس', image: '', badge: 'فعالية', date: '١٠ يوليو ٢٠٢٦' },
      { id: 'n4', title: 'دورة تدريبية في الليزر', content: 'تسجيل الآن في الدورة التدريبية المتقدمة لأدوات الليزر', image: '', badge: 'إعلان', date: '٥ يوليو ٢٠٢٦' }
    ]);
  }
  if (!localStorage.getItem(EXAMS_KEY)) {
    const sampleExams = [
      { id: 'e1', name: 'امتحان أمن الشبكات النهائي', pdfLink: '#', department: 'cyber', stage: 'second', date: '٢٠٢٦/٠٧/٢٠' },
      { id: 'e2', name: 'امتحان تشفير البيانات', pdfLink: '#', department: 'cyber', stage: 'second', date: '٢٠٢٦/٠٧/١٥' },
      { id: 'e3', name: 'اختبار اختراق عملي', pdfLink: '#', department: 'cyber', stage: 'third', date: '٢٠٢٦/٠٧/٢٥' },
      { id: 'e4', name: 'امتحان صيانة الحاسوب', pdfLink: '#', department: 'hardware', stage: 'second', date: '٢٠٢٦/٠٧/٢٠' },
      { id: 'e5', name: 'امتحان ميكانيكا عامة', pdfLink: '#', department: 'mechanics', stage: 'second', date: '٢٠٢٦/٠٧/١٨' },
      { id: 'e6', name: 'امتحان إلكترونيات', pdfLink: '#', department: 'mechatronics', stage: 'second', date: '٢٠٢٦/٠٧/٢٢' },
      { id: 'e7', name: 'امتحان فيزياء الليزر', pdfLink: '#', department: 'laser', stage: 'second', date: '٢٠٢٦/٠٧/١٩' }
    ];
    saveExams(sampleExams);
  }
}

function renderNews() {
  const container = document.getElementById('newsList');
  const items = getNews();
  if (items.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:40px;">لا توجد أخبار حالياً</p>';
    return;
  }
  container.innerHTML = items.map(n => `
    <div class="news-card ${n.image ? 'has-image' : ''}">
      ${n.image ? `<img class="news-card-img" src="${n.image}" alt="${n.title}">` : ''}
      <div class="${n.image ? 'news-card-body' : ''}">
        <div class="news-badge">${n.badge || 'خبر'}</div>
        <h4>${n.title}</h4>
        <p>${n.content}</p>
        <span class="news-date">${n.date}</span>
      </div>
    </div>
  `).join('');
}

// ===== التنقل في الأقسام =====
const departmentsData = {
  cyber: {
    name: 'الأمن السيبراني', icon: 'fa-shield-alt', color: '#00bcd4',
    stages: {
      first: [
        { name: 'أساسيات الحاسوب', desc: 'مبادئ الحاسوب ونظام التشغيل', icon: 'fa-laptop', pdf: '#' },
        { name: 'مقدمة في الشبكات', desc: 'أساسيات الشبكات والمفاهيم الأولية', icon: 'fa-project-diagram', pdf: '#' },
        { name: 'أخلاقيات الإنترنت', desc: 'القيم والسلوكيات في الفضاء الرقمي', icon: 'fa-gavel', pdf: '#' },
        { name: 'اللغة الإنجليزية', desc: 'مصطلحات تقنية باللغة الإنجليزية', icon: 'fa-language', pdf: '#' },
        { name: 'الرياضيات', desc: 'أساسيات الرياضيات للحاسوب', icon: 'fa-calculator', pdf: '#' }
      ],
      second: [
        { name: 'أمن الشبكات', desc: 'حماية البنية التحتية للشبكات من الهجمات', icon: 'fa-network-wired', pdf: '#' },
        { name: 'تشفير البيانات', desc: 'تقنيات التشفير لحماية المعلومات', icon: 'fa-key', pdf: '#' },
        { name: 'أنظمة التشغيل الآمنة', desc: 'إعداد وتأمين أنظمة التشغيل', icon: 'fa-terminal', pdf: '#' },
        { name: 'قواعد البيانات', desc: 'إدارة وحماية قواعد البيانات', icon: 'fa-database', pdf: '#' },
        { name: 'برمجة بايثون', desc: 'أساسيات البرمجة بلغة بايثون', icon: 'fa-code', pdf: '#' }
      ],
      third: [
        { name: 'اختبار الاختراق', desc: 'تحليل الثغرات واختبار أمان الأنظمة', icon: 'fa-bug', pdf: '#' },
        { name: 'تحليل البرمجيات الخبيثة', desc: 'كشف وتحليل البرمجيات الضارة', icon: 'fa-skull', pdf: '#' },
        { name: 'أمن التطبيقات', desc: 'تأمين تطبيقات الويب والموبايل', icon: 'fa-shield-halved', pdf: '#' },
        { name: 'إدارة الحوادث', desc: 'التعامل مع الاختراقات والاستجابة لها', icon: 'fa-bell-exclamation', pdf: '#' },
        { name: 'مشروع التخرج', desc: 'تطبيق عملي شامل في الأمن السيبراني', icon: 'fa-certificate', pdf: '#' }
      ]
    },
    schedule: [
      { period: 'الحصة الأولى', time: '٨:٠٠ - ٨:٤٥', days: { sun: 'أمن الشبكات', mon: 'تشفير', tue: 'أمن الشبكات', wed: 'اختبار اختراق', thu: 'قوانين' } },
      { period: 'الحصة الثانية', time: '٨:٤٥ - ٩:٣٠', days: { sun: 'تشفير', mon: 'أمن الشبكات', tue: 'تشفير', wed: 'أمن الشبكات', thu: 'اختبار اختراق' } },
      { period: 'الحصة الثالثة', time: '٩:٤٥ - ١٠:٣٠', days: { sun: 'اختبار اختراق', mon: 'أنظمة آمنة', tue: 'قوانين', wed: 'تشفير', thu: 'أمن الشبكات' } },
      { period: 'الحصة الرابعة', time: '١٠:٣٠ - ١١:١٥', days: { sun: 'أنظمة آمنة', mon: 'اختبار اختراق', tue: 'أنظمة آمنة', wed: 'قوانين', thu: 'تشفير' } },
      { period: 'الحصة الخامسة', time: '١١:٣٠ - ١٢:١٥', days: { sun: 'قوانين', mon: 'قوانين', tue: 'اختبار اختراق', wed: 'أنظمة آمنة', thu: 'أنظمة آمنة' } },
      { period: 'الحصة السادسة', time: '١٢:١٥ - ١:٠٠', days: { sun: 'تطبيقات', mon: 'تطبيقات', tue: 'تطبيقات', wed: 'تطبيقات', thu: 'تطبيقات' } }
    ]
  },
  hardware: {
    name: 'تجميع الحاسوب', icon: 'fa-desktop', color: '#ff5722',
    stages: {
      first: [
        { name: 'أساسيات الكهرباء', desc: 'مبادئ الكهرباء والتيار المستمر', icon: 'fa-bolt', pdf: '#' },
        { name: 'مكونات الحاسوب', desc: 'التعرف على مكونات الحاسوب الأساسية', icon: 'fa-microchip', pdf: '#' },
        { name: 'اللغة الإنجليزية', desc: 'مصطلحات تقنية باللغة الإنجليزية', icon: 'fa-language', pdf: '#' },
        { name: 'الرياضيات', desc: 'أساسيات الرياضيات للحاسوب', icon: 'fa-calculator', pdf: '#' },
        { name: 'مقدمة في الصيانة', desc: 'أساسيات الصيانة الوقائية', icon: 'fa-wrench', pdf: '#' }
      ],
      second: [
        { name: 'صيانة الحاسوب', desc: 'تشخيص وإصلاح أعطال الحاسوب', icon: 'fa-tools', pdf: '#' },
        { name: 'شبكات الحاسوب', desc: 'ربط وتكوين الشبكات المحلية', icon: 'fa-project-diagram', pdf: '#' },
        { name: 'تركيب الأنظمة', desc: 'تنصيب وتكوين أنظمة التشغيل', icon: 'fa-download', pdf: '#' },
        { name: 'إلكترونيات الحاسوب', desc: 'أساسيات الدوائر الإلكترونية', icon: 'fa-microchip', pdf: '#' },
        { name: 'صيانة الطابعات', desc: 'إصلاح وصيانة الطابعات والماسحات', icon: 'fa-print', pdf: '#' }
      ],
      third: [
        { name: 'تشخيص الأعطال', desc: 'استخدام أدوات التشخيص المتقدمة', icon: 'fa-stethoscope', pdf: '#' },
        { name: 'صيانة اللوحات الأم', desc: 'إصلاح اللوحات الأم ومعالجة الأعطال', icon: 'fa-server', pdf: '#' },
        { name: 'صيانة أجهزة المحمول', desc: 'إصلاح وصيانة أجهزة اللابتوب', icon: 'fa-laptop', pdf: '#' },
        { name: 'إدارة المشاريع', desc: 'إدارة مشاريع الصيانة وخدمة العملاء', icon: 'fa-chart-line', pdf: '#' },
        { name: 'مشروع التخرج', desc: 'مشروع شامل في تجميع وصيانة الحاسوب', icon: 'fa-certificate', pdf: '#' }
      ]
    },
    schedule: [
      { period: 'الحصة الأولى', time: '٨:٠٠ - ٨:٤٥', days: { sun: 'صيانة', mon: 'شبكات', tue: 'صيانة', wed: 'إلكترونيات', thu: 'تشخيص' } },
      { period: 'الحصة الثانية', time: '٨:٤٥ - ٩:٣٠', days: { sun: 'شبكات', mon: 'صيانة', tue: 'تركيب أنظمة', wed: 'صيانة', thu: 'إلكترونيات' } },
      { period: 'الحصة الثالثة', time: '٩:٤٥ - ١٠:٣٠', days: { sun: 'تركيب أنظمة', mon: 'إلكترونيات', tue: 'شبكات', wed: 'تشخيص', thu: 'صيانة' } },
      { period: 'الحصة الرابعة', time: '١٠:٣٠ - ١١:١٥', days: { sun: 'إلكترونيات', mon: 'تركيب أنظمة', tue: 'تشخيص', wed: 'شبكات', thu: 'تركيب أنظمة' } },
      { period: 'الحصة الخامسة', time: '١١:٣٠ - ١٢:١٥', days: { sun: 'تشخيص', mon: 'تشخيص', tue: 'إلكترونيات', wed: 'تركيب أنظمة', thu: 'شبكات' } },
      { period: 'الحصة السادسة', time: '١٢:١٥ - ١:٠٠', days: { sun: 'تطبيقات', mon: 'تطبيقات', tue: 'تطبيقات', wed: 'تطبيقات', thu: 'تطبيقات' } }
    ]
  },
  mechanics: {
    name: 'ميكانيك الأجهزة', icon: 'fa-cogs', color: '#4caf50',
    stages: {
      first: [
        { name: 'أساسيات الميكانيكا', desc: 'مبادئ الميكانيكا والقوى الحركية', icon: 'fa-wrench', pdf: '#' },
        { name: 'الرسم الهندسي', desc: 'أساسيات الرسم الفني الهندسي', icon: 'fa-drafting-compass', pdf: '#' },
        { name: 'الرياضيات التطبيقية', desc: 'تطبيقات الرياضيات في الميكانيكا', icon: 'fa-calculator', pdf: '#' },
        { name: 'اللغة الإنجليزية', desc: 'مصطلحات هندسية باللغة الإنجليزية', icon: 'fa-language', pdf: '#' },
        { name: 'سلامة مهنية', desc: 'إجراءات السلامة في ورش العمل', icon: 'fa-hard-hat', pdf: '#' }
      ],
      second: [
        { name: 'ميكانيكا عامة', desc: 'دراسة متقدمة في الميكانيكا', icon: 'fa-cog', pdf: '#' },
        { name: 'كهرباء الأجهزة', desc: 'الدوائر الكهربائية في الأجهزة المنزلية', icon: 'fa-bolt', pdf: '#' },
        { name: 'تبريد وتكييف', desc: 'أنظمة التبريد وتكييف الهواء', icon: 'fa-snowflake', pdf: '#' },
        { name: 'هيدروليك ونيوماتيك', desc: 'أنظمة الهيدروليك والضغط', icon: 'fa-water', pdf: '#' },
        { name: 'ورشة ميكانيكا', desc: 'تطبيقات عملية في الميكانيكا', icon: 'fa-industry', pdf: '#' }
      ],
      third: [
        { name: 'صيانة الأجهزة', desc: 'إصلاح وصيانة الأجهزة الكهربائية', icon: 'fa-tools', pdf: '#' },
        { name: 'محركات كهربائية', desc: 'صيانة وإصلاح المحركات الكهربائية', icon: 'fa-motor', pdf: '#' },
        { name: 'أجهزة قياس', desc: 'استخدام أجهزة القياس في التشخيص', icon: 'fa-ruler', pdf: '#' },
        { name: 'إدارة ورش', desc: 'إدارة وتنظيم ورش الصيانة', icon: 'fa-clipboard-list', pdf: '#' },
        { name: 'مشروع التخرج', desc: 'مشروع شامل في ميكانيك الأجهزة', icon: 'fa-certificate', pdf: '#' }
      ]
    },
    schedule: [
      { period: 'الحصة الأولى', time: '٨:٠٠ - ٨:٤٥', days: { sun: 'ميكانيكا', mon: 'كهرباء', tue: 'تبريد', wed: 'صيانة', thu: 'رسم' } },
      { period: 'الحصة الثانية', time: '٨:٤٥ - ٩:٣٠', days: { sun: 'كهرباء', mon: 'ميكانيكا', tue: 'صيانة', wed: 'تبريد', thu: 'ميكانيكا' } },
      { period: 'الحصة الثالثة', time: '٩:٤٥ - ١٠:٣٠', days: { sun: 'تبريد', mon: 'رسم', tue: 'ميكانيكا', wed: 'كهرباء', thu: 'صيانة' } },
      { period: 'الحصة الرابعة', time: '١٠:٣٠ - ١١:١٥', days: { sun: 'صيانة', mon: 'تبريد', tue: 'كهرباء', wed: 'رسم', thu: 'تبريد' } },
      { period: 'الحصة الخامسة', time: '١١:٣٠ - ١٢:١٥', days: { sun: 'رسم', mon: 'صيانة', tue: 'رسم', wed: 'ميكانيكا', thu: 'كهرباء' } },
      { period: 'الحصة السادسة', time: '١٢:١٥ - ١:٠٠', days: { sun: 'تطبيقات', mon: 'تطبيقات', tue: 'تطبيقات', wed: 'تطبيقات', thu: 'تطبيقات' } }
    ]
  },
  mechatronics: {
    name: 'ميكاترونكس', icon: 'fa-robot', color: '#9c27b0',
    stages: {
      first: [
        { name: 'أساسيات الإلكترونيات', desc: 'مبادئ الإلكترونيات والدوائر', icon: 'fa-microchip', pdf: '#' },
        { name: 'الرسم الهندسي', desc: 'الرسم الفني والمخططات الكهربائية', icon: 'fa-drafting-compass', pdf: '#' },
        { name: 'الرياضيات', desc: 'الرياضيات للمهندسين', icon: 'fa-calculator', pdf: '#' },
        { name: 'الفيزياء', desc: 'مبادئ الفيزياء التطبيقية', icon: 'fa-atom', pdf: '#' },
        { name: 'اللغة الإنجليزية', desc: 'مصطلحات هندسية بالإنجليزية', icon: 'fa-language', pdf: '#' }
      ],
      second: [
        { name: 'إلكترونيات', desc: 'الدوائر الإلكترونية المتكاملة', icon: 'fa-microchip', pdf: '#' },
        { name: 'برمجة تحكم', desc: 'برمجة وحدات التحكم المنطقي PLC', icon: 'fa-code', pdf: '#' },
        { name: 'استشعار وتحكم', desc: 'أنظمة الاستشعار والتحكم الآلي', icon: 'fa-sliders-h', pdf: '#' },
        { name: 'ميكانيكا دقيقة', desc: 'الميكانيكا الدقيقة والأنظمة المدمجة', icon: 'fa-cog', pdf: '#' },
        { name: 'دوائر رقمية', desc: 'تصميم الدوائر الرقمية', icon: 'fa-circle-nodes', pdf: '#' }
      ],
      third: [
        { name: 'روبوتات', desc: 'تصميم وبرمجة الروبوتات الذكية', icon: 'fa-robot', pdf: '#' },
        { name: 'أنظمة مضمنة', desc: 'تصميم الأنظمة المضمنة والمتحكمات', icon: 'fa-chip', pdf: '#' },
        { name: 'ذكاء اصطناعي', desc: 'تطبيقات الذكاء الاصطناعي في الميكاترونكس', icon: 'fa-brain', pdf: '#' },
        { name: 'أتمتة صناعية', desc: 'أنظمة الأتمتة والتحكم الصناعي', icon: 'fa-industry', pdf: '#' },
        { name: 'مشروع التخرج', desc: 'مشروع شامل في الميكاترونكس والروبوتات', icon: 'fa-certificate', pdf: '#' }
      ]
    },
    schedule: [
      { period: 'الحصة الأولى', time: '٨:٠٠ - ٨:٤٥', days: { sun: 'إلكترونيات', mon: 'برمجة', tue: 'روبوتات', wed: 'استشعار', thu: 'ميكانيكا' } },
      { period: 'الحصة الثانية', time: '٨:٤٥ - ٩:٣٠', days: { sun: 'برمجة', mon: 'إلكترونيات', tue: 'استشعار', wed: 'روبوتات', thu: 'برمجة' } },
      { period: 'الحصة الثالثة', time: '٩:٤٥ - ١٠:٣٠', days: { sun: 'روبوتات', mon: 'ميكانيكا', tue: 'برمجة', wed: 'إلكترونيات', thu: 'استشعار' } },
      { period: 'الحصة الرابعة', time: '١٠:٣٠ - ١١:١٥', days: { sun: 'استشعار', mon: 'روبوتات', tue: 'ميكانيكا', wed: 'برمجة', thu: 'روبوتات' } },
      { period: 'الحصة الخامسة', time: '١١:٣٠ - ١٢:١٥', days: { sun: 'ميكانيكا', mon: 'استشعار', tue: 'إلكترونيات', wed: 'ميكانيكا', thu: 'إلكترونيات' } },
      { period: 'الحصة السادسة', time: '١٢:١٥ - ١:٠٠', days: { sun: 'تطبيقات', mon: 'تطبيقات', tue: 'تطبيقات', wed: 'تطبيقات', thu: 'تطبيقات' } }
    ]
  },
  laser: {
    name: 'أدوات الليزر', icon: 'fa-light fa-laser', color: '#e91e63',
    stages: {
      first: [
        { name: 'أساسيات البصريات', desc: 'مبادئ الضوء والبصريات', icon: 'fa-eye', pdf: '#' },
        { name: 'الفيزياء العامة', desc: 'أساسيات الفيزياء التطبيقية', icon: 'fa-atom', pdf: '#' },
        { name: 'الرياضيات', desc: 'الرياضيات للتخصصات التقنية', icon: 'fa-calculator', pdf: '#' },
        { name: 'اللغة الإنجليزية', desc: 'مصطلحات علمية بالإنجليزية', icon: 'fa-language', pdf: '#' },
        { name: 'سلامة مهنية', desc: 'إجراءات السلامة في مختبرات الليزر', icon: 'fa-hard-hat', pdf: '#' }
      ],
      second: [
        { name: 'فيزياء الليزر', desc: 'أساسيات فيزياء الليزر والضوء', icon: 'fa-lightbulb', pdf: '#' },
        { name: 'بصريات', desc: 'المبادئ البصرية في أنظمة الليزر', icon: 'fa-eye', pdf: '#' },
        { name: 'إلكترونيات الليزر', desc: 'الدوائر الإلكترونية في أجهزة الليزر', icon: 'fa-microchip', pdf: '#' },
        { name: 'مختبر الليزر', desc: 'تطبيقات عملية في مختبر الليزر', icon: 'fa-flask', pdf: '#' },
        { name: 'أمن وسلامة الليزر', desc: 'إجراءات السلامة عند التعامل مع الليزر', icon: 'fa-shield-halved', pdf: '#' }
      ],
      third: [
        { name: 'تطبيقات الليزر', desc: 'استخدامات الليزر في الصناعة والطب', icon: 'fa-industry', pdf: '#' },
        { name: 'صيانة أجهزة الليزر', desc: 'تشخيص وإصلاح أعطال أجهزة الليزر', icon: 'fa-screwdriver', pdf: '#' },
        { name: 'ليزر في الاتصالات', desc: 'تطبيقات الليزر في الاتصالات البصرية', icon: 'fa-satellite-dish', pdf: '#' },
        { name: 'قياسات بصرية', desc: 'تقنيات القياس باستخدام الليزر', icon: 'fa-ruler-combined', pdf: '#' },
        { name: 'مشروع التخرج', desc: 'مشروع شامل في تطبيقات الليزر', icon: 'fa-certificate', pdf: '#' }
      ]
    },
    schedule: [
      { period: 'الحصة الأولى', time: '٨:٠٠ - ٨:٤٥', days: { sun: 'فيزياء', mon: 'تطبيقات', tue: 'أمن', wed: 'بصريات', thu: 'صيانة' } },
      { period: 'الحصة الثانية', time: '٨:٤٥ - ٩:٣٠', days: { sun: 'تطبيقات', mon: 'فيزياء', tue: 'بصريات', wed: 'أمن', thu: 'تطبيقات' } },
      { period: 'الحصة الثالثة', time: '٩:٤٥ - ١٠:٣٠', days: { sun: 'أمن', mon: 'صيانة', tue: 'فيزياء', wed: 'تطبيقات', thu: 'بصريات' } },
      { period: 'الحصة الرابعة', time: '١٠:٣٠ - ١١:١٥', days: { sun: 'بصريات', mon: 'أمن', tue: 'تطبيقات', wed: 'فيزياء', thu: 'أمن' } },
      { period: 'الحصة الخامسة', time: '١١:٣٠ - ١٢:١٥', days: { sun: 'صيانة', mon: 'بصريات', tue: 'صيانة', wed: 'صيانة', thu: 'فيزياء' } },
      { period: 'الحصة السادسة', time: '١٢:١٥ - ١:٠٠', days: { sun: 'تطبيقات', mon: 'تطبيقات', tue: 'تطبيقات', wed: 'تطبيقات', thu: 'تطبيقات' } }
    ]
  }
};

const dayNames = { sun: 'الأحد', mon: 'الإثنين', tue: 'الثلاثاء', wed: 'الأربعاء', thu: 'الخميس' };
const dayOrder = ['sun', 'mon', 'tue', 'wed', 'thu'];
const stageLabels = { first: 'المرحلة الأولى', second: 'المرحلة الثانية', third: 'المرحلة الثالثة' };
const stageIcons = { first: 'fa-1', second: 'fa-2', third: 'fa-3' };

const deptKeys = { cyber: 'cyber', hardware: 'hardware', mechanics: 'mechanics', mechatronics: 'mechatronics', laser: 'laser' };
let currentStage = 'first';

function openDepartment(id) {
  const data = departmentsData[id];
  if (!data) return;
  const headerIcon = document.getElementById('deptDetailIcon');
  const headerName = document.getElementById('deptDetailName');
  headerIcon.innerHTML = `<i class="fas ${data.icon}"></i>`;
  headerName.textContent = data.name;
  headerName.dataset.deptKey = id;
  document.getElementById('deptDetailHeader').style.background = `linear-gradient(135deg, ${data.color}dd, ${data.color}88)`;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  document.getElementById('page-department').classList.add('active-page');
  currentStage = 'first';
  renderStageTabs(data);
  renderSubjects(data);
  renderSchedule(data);
  renderDeptExams(id);
  switchDeptTab('subjects');
}

function renderStageTabs(data) {
  const container = document.getElementById('stageTabs');
  container.innerHTML = ['first', 'second', 'third'].map(key => `
    <button class="stage-tab ${key === currentStage ? 'active' : ''}" onclick="switchStage('${key}')">
      <i class="fas ${stageIcons[key]}"></i> ${stageLabels[key]}
    </button>
  `).join('');
}

function switchStage(key) {
  currentStage = key;
  const data = getCurrentDepartmentData();
  if (!data) return;
  renderStageTabs(data);
  renderSubjects(data);
}

function getCurrentDepartmentData() {
  const name = document.getElementById('deptDetailName').textContent;
  return Object.values(departmentsData).find(d => d.name === name);
}

function getCurrentDeptKey() {
  return document.getElementById('deptDetailName').dataset.deptKey || '';
}

function getDeptKeyByName(name) {
  for (const [key, val] of Object.entries(departmentsData)) {
    if (val.name === name) return key;
  }
  return '';
}

function renderSubjects(data) {
  const list = document.getElementById('subjectsList');
  const subjects = data.stages[currentStage];
  if (!subjects) { list.innerHTML = ''; return; }
  const colors = ['#00bcd4', '#ff5722', '#4caf50', '#9c27b0', '#e91e63'];
  list.innerHTML = subjects.map((s, i) => `
    <div class="subject-card" style="--subject-color: ${colors[i % colors.length]}" onclick="openPDF('${encodeURIComponent(s.pdf)}')">
      <div class="subject-icon"><i class="fas ${s.icon}"></i></div>
      <div class="subject-info"><h4>${s.name}</h4><p>${s.desc}</p></div>
      <div class="subject-download"><i class="fas fa-file-pdf"></i></div>
    </div>
  `).join('');
}

function openPDF(url) {
  if (url === '#' || !url) {
    showToast('📚 سيتم إضافة رابط تحميل PDF قريباً');
    return;
  }
  window.open(decodeURIComponent(url), '_blank');
}

function renderSchedule(data) {
  const container = document.getElementById('scheduleContainer');
  let table = `<table class="schedule-table"><thead><tr><th>الفترة</th>${dayOrder.map(d => `<th>${dayNames[d]}</th>`).join('')}</tr></thead><tbody>`;
  data.schedule.forEach(row => {
    table += `<tr><td class="period-label">${row.period}<span class="period-time">${row.time}</span></td>`;
    dayOrder.forEach(d => {
      const subj = row.days[d];
      const color = getSubjectColor(subj, data.color);
      table += `<td><span class="subject-tag" style="--tag-color: ${color}">${subj}</span></td>`;
    });
    table += '</tr>';
  });
  table += '</tbody></table>';
  container.innerHTML = table;
}

function getSubjectColor(name, defaultColor) {
  const colors = {
    'أمن الشبكات': '#00bcd4', 'تشفير': '#9c27b0', 'اختبار اختراق': '#e91e63',
    'أنظمة آمنة': '#4caf50', 'قوانين': '#ff9800', 'تطبيقات': '#607d8b',
    'صيانة': '#ff5722', 'شبكات': '#2196f3', 'تركيب أنظمة': '#795548',
    'إلكترونيات': '#3f51b5', 'تشخيص': '#009688', 'ميكانيكا': '#4caf50',
    'كهرباء': '#ffc107', 'تبريد': '#00bcd4', 'رسم': '#9e9e9e',
    'برمجة': '#673ab7', 'روبوتات': '#9c27b0', 'استشعار': '#03a9f4',
    'فيزياء': '#e91e63', 'بصريات': '#00bcd4', 'أمن': '#ff9800'
  };
  return colors[name] || defaultColor;
}

function renderDeptExams(deptKey) {
  const container = document.getElementById('examsContainer');
  const allExams = getExams();
  const deptExams = allExams.filter(e => e.department === deptKey);
  const currentUser = getCurrentUser();
  const isAdmin = currentUser && currentUser.isAdmin;

  if (deptExams.length === 0) {
    container.innerHTML = '<div class="no-exams">لا توجد امتحانات لهذا القسم حالياً</div>';
    return;
  }

  container.innerHTML = deptExams.map(exam => `
    <div class="exam-card">
      <div class="exam-icon"><i class="fas fa-file-alt"></i></div>
      <div class="exam-info">
        <h4>${exam.name}</h4>
        <p>${exam.date} · ${stageLabels[exam.stage] || exam.stage}</p>
        <div class="exam-stage">${exam.pdfLink && exam.pdfLink !== '#' ? '📄 رابط PDF متوفر' : '📄 رابط PDF قريباً'}</div>
      </div>
      ${exam.pdfLink && exam.pdfLink !== '#' ? `<div class="exam-link" onclick="openPDF('${encodeURIComponent(exam.pdfLink)}')"><i class="fas fa-file-pdf"></i></div>` : ''}
      ${isAdmin ? `
      <div class="exam-admin-actions">
        <button class="exam-edit-btn" onclick="showEditExamModal('${exam.id}')" title="تعديل"><i class="fas fa-edit"></i></button>
        <button class="exam-delete-btn" onclick="deleteExam('${exam.id}')" title="حذف"><i class="fas fa-trash"></i></button>
      </div>` : ''}
    </div>
  `).join('');
}

function switchDeptTab(tab) {
  document.querySelectorAll('.dept-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.dept-tab-panel').forEach(p => p.classList.remove('active-panel'));
  const tabBtn = document.querySelector(`.dept-tab[data-tab="${tab}"]`);
  if (tabBtn) tabBtn.classList.add('active');
  const tabMap = { subjects: 'deptSubjects', schedule: 'deptSchedule', exams: 'deptExams' };
  const panel = document.getElementById(tabMap[tab]);
  if (panel) panel.classList.add('active-panel');
}

function closeDepartment() { navigateTo('home'); }

// ===== الدردشة =====
chatSendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

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

// ===== لوحة التحكم =====
function switchAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active-panel'));
  const tabBtn = document.querySelector(`.admin-tab[data-admin-tab="${tab}"]`);
  if (tabBtn) tabBtn.classList.add('active');
  const panel = document.getElementById(`adminPanel${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
  if (panel) panel.classList.add('active-panel');
  if (tab === 'news') renderAdminNews();
  if (tab === 'students') renderAdminStudents();
  if (tab === 'exams') renderAdminExams();
  if (tab === 'attendance') renderAdminAttendance();
  if (tab === 'cards') populateCardSelect();
}

function populateAdminSelects() {
  const users = getUsers();
  const filter = document.getElementById('attendanceFilter');
  const cardSelect = document.getElementById('cardStudentSelect');
  if (filter) {
    const curVal = filter.value;
    filter.innerHTML = '<option value="all">كل الطلاب</option>' + users.map(u => `<option value="${u.email}" ${u.email === curVal ? 'selected' : ''}>${u.name}</option>`).join('');
  }
  if (cardSelect) {
    const curVal2 = cardSelect.value;
    cardSelect.innerHTML = '<option value="">اختر طالباً</option>' + users.map(u => `<option value="${u.email}" ${u.email === curVal2 ? 'selected' : ''}>${u.name}</option>`).join('');
  }
}

// ===== إدارة الأخبار =====
function renderAdminNews() {
  const container = document.getElementById('adminNewsList');
  const items = getNews();
  if (items.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:30px;">لا توجد أخبار. أضف أول خبر الآن!</p>';
    return;
  }
  container.innerHTML = items.map(n => `
    <div class="news-admin-card">
      <div class="news-admin-thumb">${n.image ? `<img src="${n.image}" alt="">` : '<i class="fas fa-newspaper"></i>'}</div>
      <div class="news-admin-info">
        <h4>${n.title}</h4>
        <p>${n.content}</p>
        <span style="font-size:10px;color:var(--text-light);">${n.date} · ${n.badge || 'خبر'}</span>
      </div>
      <div class="news-admin-actions">
        <button class="exam-edit-btn" onclick="showEditNewsModal('${n.id}')" title="تعديل"><i class="fas fa-edit"></i></button>
        <button class="exam-delete-btn" onclick="deleteNews('${n.id}')" title="حذف"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function showAddNewsModal() { showNewsModal(null); }
function showEditNewsModal(id) { showNewsModal(id); }

function showNewsModal(editId) {
  let item = null;
  if (editId) {
    const items = getNews();
    item = items.find(n => n.id === editId);
  }
  const isEdit = !!item;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content">
      <h3>${isEdit ? 'تعديل الخبر' : 'إضافة خبر جديد'}</h3>
      <div class="input-group"><input type="text" id="modalNewsTitle" placeholder="عنوان الخبر" value="${isEdit ? escapeHtml(item.title) : ''}"></div>
      <div class="input-group"><textarea id="modalNewsContent" placeholder="محتوى الخبر">${isEdit ? escapeHtml(item.content) : ''}</textarea></div>
      <div class="input-group"><input type="text" id="modalNewsBadge" placeholder="الوسم (مثل: جديد، مهم)" value="${isEdit ? escapeHtml(item.badge) : ''}"></div>
      <div class="input-group">
        <label style="display:block;font-size:12px;color:var(--text-light);margin-bottom:6px;">صورة الخبر (اختياري)</label>
        <input type="file" id="modalNewsImage" accept="image/*">
        ${isEdit && item.image ? `<div style="margin-top:8px;"><img src="${item.image}" style="max-width:100px;border-radius:8px;"></div>` : ''}
      </div>
      <div class="modal-actions">
        <button class="modal-btn-primary" onclick="saveNewsModal('${editId || ''}')">${isEdit ? 'حفظ التعديلات' : 'إضافة'}</button>
        <button class="modal-btn-secondary" onclick="closeModal(this)">إلغاء</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function saveNewsModal(editId) {
  const title = document.getElementById('modalNewsTitle').value.trim();
  const content = document.getElementById('modalNewsContent').value.trim();
  const badge = document.getElementById('modalNewsBadge').value.trim() || 'خبر';
  const fileInput = document.getElementById('modalNewsImage');
  const items = getNews();

  if (!title || !content) { showToast('⚠️ يرجى ملء عنوان الخبر ومحتواه'); return; }

  const process = (image) => {
    if (editId) {
      const idx = items.findIndex(n => n.id === editId);
      if (idx !== -1) {
        items[idx] = { ...items[idx], title, content, badge, image: image || items[idx].image };
        saveNews(items);
        showToast('✅ تم تحديث الخبر');
      }
    } else {
      const newItem = { id: 'n' + Date.now(), title, content, badge, image: image || '', date: new Date().toLocaleDateString('ar-EG') };
      items.push(newItem);
      saveNews(items);
      showToast('✅ تم إضافة الخبر');
    }
    closeModal(document.querySelector('.modal-overlay'));
    renderAdminNews();
    renderNews();
  };

  if (fileInput && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) { process(e.target.result); };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    process('');
  }
}

function deleteNews(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;
  let items = getNews();
  items = items.filter(n => n.id !== id);
  saveNews(items);
  showToast('🗑️ تم حذف الخبر');
  renderAdminNews();
  renderNews();
}

// ===== إدارة الطلاب =====
function renderAdminStudents() {
  const container = document.getElementById('adminStudentsList');
  const query = (document.getElementById('studentSearch').value || '').trim().toLowerCase();
  let users = getUsers();
  if (query) {
    users = users.filter(u => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query));
  }
  if (users.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:30px;">' + (query ? 'لا توجد نتائج بحث' : 'لا يوجد طلاب مسجلون') + '</p>';
    return;
  }
  container.innerHTML = users.map(u => `
    <div class="student-item">
      <div class="student-avatar">${u.photo ? `<img src="${u.photo}" alt="">` : '<i class="fas fa-user-graduate"></i>'}</div>
      <div class="student-info">
        <h4>${u.name}</h4>
        <p>${u.email}</p>
      </div>
      <span class="student-role ${u.isAdmin ? 'admin-role' : ''}">${u.isAdmin ? 'مسؤول' : 'طالب'}</span>
    </div>
  `).join('');
}

// ===== إدارة الامتحانات =====
function renderAdminExams() {
  const container = document.getElementById('adminExamsList');
  const allExams = getExams();
  if (allExams.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:30px;">لا توجد امتحانات. أضف أول امتحان الآن!</p>';
    return;
  }
  container.innerHTML = allExams.map(exam => {
    const deptName = departmentsData[exam.department] ? departmentsData[exam.department].name : exam.department;
    return `
    <div class="exam-admin-card">
      <div class="exam-admin-info">
        <h4>${exam.name}</h4>
        <p>${deptName} · ${stageLabels[exam.stage] || exam.stage} · ${exam.date}</p>
        <span style="font-size:10px;color:var(--accent);">${exam.pdfLink && exam.pdfLink !== '#' ? '📄 رابط PDF متوفر' : '📄 بدون رابط PDF'}</span>
      </div>
      <div class="exam-admin-actions">
        <button class="exam-edit-btn" onclick="showEditExamModal('${exam.id}')" title="تعديل"><i class="fas fa-edit"></i></button>
        <button class="exam-delete-btn" onclick="deleteExam('${exam.id}')" title="حذف"><i class="fas fa-trash"></i></button>
      </div>
    </div>`;
  }).join('');
}

function showAddExamModal() { showExamModal(null); }
function showEditExamModal(id) { showExamModal(id); }

function showExamModal(editId) {
  let item = null;
  if (editId) {
    const items = getExams();
    item = items.find(e => e.id === editId);
  }
  const isEdit = !!item;
  const deptOptions = Object.entries(departmentsData).map(([key, val]) =>
    `<option value="${key}" ${isEdit && item.department === key ? 'selected' : ''}>${val.name}</option>`
  ).join('');
  const stageOpts = Object.entries(stageLabels).map(([key, val]) =>
    `<option value="${key}" ${isEdit && item.stage === key ? 'selected' : ''}>${val}</option>`
  ).join('');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content">
      <h3>${isEdit ? 'تعديل الامتحان' : 'إضافة امتحان جديد'}</h3>
      <div class="input-group"><input type="text" id="modalExamName" placeholder="اسم الامتحان" value="${isEdit ? escapeHtml(item.name) : ''}"></div>
      <div class="input-group">
        <select id="modalExamDept">${deptOptions}</select>
      </div>
      <div class="input-group">
        <select id="modalExamStage">${stageOpts}</select>
      </div>
      <div class="input-group"><input type="text" id="modalExamPdf" placeholder="رابط PDF (أو # إن لم يتوفر)" value="${isEdit ? escapeHtml(item.pdfLink) : ''}"></div>
      <div class="input-group"><input type="text" id="modalExamDate" placeholder="التاريخ" value="${isEdit ? escapeHtml(item.date) : new Date().toLocaleDateString('ar-EG')}"></div>
      <div class="modal-actions">
        <button class="modal-btn-primary" onclick="saveExamModal('${editId || ''}')">${isEdit ? 'حفظ التعديلات' : 'إضافة'}</button>
        <button class="modal-btn-secondary" onclick="closeModal(this)">إلغاء</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function saveExamModal(editId) {
  const name = document.getElementById('modalExamName').value.trim();
  const department = document.getElementById('modalExamDept').value;
  const stage = document.getElementById('modalExamStage').value;
  const pdfLink = document.getElementById('modalExamPdf').value.trim() || '#';
  const date = document.getElementById('modalExamDate').value.trim();
  if (!name) { showToast('⚠️ يرجى إدخال اسم الامتحان'); return; }
  const items = getExams();
  if (editId) {
    const idx = items.findIndex(e => e.id === editId);
    if (idx !== -1) {
      items[idx] = { ...items[idx], name, department, stage, pdfLink, date };
      saveExams(items);
      showToast('✅ تم تحديث الامتحان');
    }
  } else {
    const newItem = { id: 'e' + Date.now(), name, department, stage, pdfLink, date };
    items.push(newItem);
    saveExams(items);
    showToast('✅ تم إضافة الامتحان');
  }
  closeModal(document.querySelector('.modal-overlay'));
  renderAdminExams();
  renderDeptExams(getCurrentDeptKey());
}

function deleteExam(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الامتحان؟')) return;
  let items = getExams();
  items = items.filter(e => e.id !== id);
  saveExams(items);
  showToast('🗑️ تم حذف الامتحان');
  renderAdminExams();
  renderDeptExams(getCurrentDeptKey());
}

// ===== نظام الحضور =====
function renderAdminAttendance() {
  const container = document.getElementById('adminAttendanceList');
  const filter = document.getElementById('attendanceFilter');
  const filterVal = filter ? filter.value : 'all';
  let records = getAttendance();
  if (filterVal !== 'all') {
    records = records.filter(r => r.studentEmail === filterVal);
  }
  if (records.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:30px;">لا توجد سجلات حضور. استخدم الماسح الضوئي لتسجيل الحضور!</p>';
    return;
  }
  records.reverse();
  container.innerHTML = records.map(r => `
    <div class="attendance-item">
      <div class="student-avatar"><i class="fas fa-user-graduate"></i></div>
      <div class="student-info">
        <h4>${r.studentName}</h4>
        <p>${r.date} · <span class="attendance-time">${r.time}</span></p>
      </div>
      <span class="attendance-status present">✅ حاضر</span>
    </div>
  `).join('');
}

// ===== الماسح الضوئي =====
function openScanner() {
  navigateTo('scanner');
  document.getElementById('scannerStatus').textContent = 'جاري تشغيل الكاميرا...';
  document.getElementById('scannerResult').className = 'scanner-result';
  document.getElementById('scannerResult').textContent = '';
  startScanner();
}

function startScanner() {
  const readerEl = document.getElementById('scannerReader');
  readerEl.innerHTML = '';
  if (typeof Html5Qrcode === 'undefined') {
    document.getElementById('scannerStatus').textContent = '⚠️ مكتبة المسح غير متوفرة';
    return;
  }
  try {
    scannerInstance = new Html5Qrcode("scannerReader");
    scannerInstance.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onScanSuccess,
      () => {}
    ).then(() => {
      document.getElementById('scannerStatus').textContent = '📷 الكاميرا تعمل. وجه QR نحو الكاميرا';
    }).catch((err) => {
      document.getElementById('scannerStatus').textContent = '⚠️ لا يمكن الوصول إلى الكاميرا: ' + err;
    });
  } catch (e) {
    document.getElementById('scannerStatus').textContent = '⚠️ خطأ: ' + e.message;
  }
}

function stopScanner() {
  if (scannerInstance) {
    try {
      scannerInstance.stop().then(() => {
        scannerInstance.clear();
        scannerInstance = null;
      }).catch(() => {});
    } catch (e) { /* ignore */ }
  }
}

function onScanSuccess(decodedText) {
  stopScanner();
  const resultDiv = document.getElementById('scannerResult');
  try {
    const data = JSON.parse(decodedText);
    if (data.email && data.name) {
      const users = getUsers();
      const student = users.find(u => u.email === data.email);
      if (student) {
        const records = getAttendance();
        const today = new Date().toLocaleDateString('ar-EG');
        const alreadyRecorded = records.some(r => r.studentEmail === data.email && r.date === today);
        if (alreadyRecorded) {
          resultDiv.className = 'scanner-result info';
          resultDiv.textContent = `ℹ️ ${data.name} مسجل حضوره اليوم بالفعل`;
        } else {
          const now = new Date();
          const record = {
            id: 'a' + Date.now(),
            studentEmail: data.email,
            studentName: data.name,
            date: today,
            time: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            status: 'present'
          };
          records.push(record);
          saveAttendance(records);
          resultDiv.className = 'scanner-result success';
          resultDiv.textContent = `✅ تم تسجيل حضور ${data.name}`;
        }
      } else {
        resultDiv.className = 'scanner-result error';
        resultDiv.textContent = '⚠️ هذا الطالب غير مسجل في النظام';
      }
    } else {
      resultDiv.className = 'scanner-result error';
      resultDiv.textContent = '⚠️ رمز QR غير صالح';
    }
  } catch (e) {
    resultDiv.className = 'scanner-result error';
    resultDiv.textContent = '⚠️ رمز QR غير صالح';
  }
  document.getElementById('scannerStatus').textContent = '📷 يمكنك إعادة المحاولة بتوجيه QR نحو الكاميرا';
  setTimeout(() => {
    startScanner();
  }, 3000);
}

// ===== بطاقات الطلاب =====
function populateCardSelect() {
  const select = document.getElementById('cardStudentSelect');
  if (!select) return;
  const users = getUsers();
  const curVal = select.value;
  select.innerHTML = '<option value="">اختر طالباً</option>' + users.map(u => `<option value="${u.email}" ${u.email === curVal ? 'selected' : ''}>${u.name}</option>`).join('');
  if (curVal) generateStudentCard();
}

function generateStudentCard() {
  const container = document.getElementById('studentCardDisplay');
  const email = document.getElementById('cardStudentSelect').value;
  if (!email) { container.innerHTML = ''; return; }
  const users = getUsers();
  const student = users.find(u => u.email === email);
  if (!student) { container.innerHTML = ''; return; }

  const qrContainerId = 'cardQR_' + Date.now();

  container.innerHTML = `
    <div class="student-card" id="studentCard">
      <div class="card-header">
        ${student.photo
          ? `<img src="${student.photo}" alt="${student.name}">`
          : `<div class="no-photo"><i class="fas fa-user-graduate"></i></div>`}
        <h3>${student.name}</h3>
        <p>${student.email}</p>
        <p style="font-size:11px;opacity:0.7;margin-top:4px;">${student.isAdmin ? 'مسؤول' : 'طالب'}</p>
      </div>
      <div class="card-qr"><div id="${qrContainerId}"></div></div>
      <div class="card-footer">إعدادية القاهرة المهنية الرائدة</div>
    </div>
    <button class="admin-add-btn" style="margin-top:16px;" onclick="printStudentCard()"><i class="fas fa-print"></i> طباعة البطاقة</button>
  `;

  if (typeof QRCode !== 'undefined') {
    try {
      new QRCode(document.getElementById(qrContainerId), {
        text: JSON.stringify({ email: student.email, name: student.name }),
        width: 100,
        height: 100,
        colorDark: '#0d1b2a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    } catch (e) { /* ignore */ }
  }
}

function printStudentCard() {
  const card = document.getElementById('studentCard');
  if (!card) return;
  const w = window.open('', '', 'width=400,height=600');
  w.document.write('<html dir="rtl"><head><style>');
  w.document.write(document.querySelector('style').textContent);
  w.document.write('body{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;}');
  w.document.write('.student-card{max-width:340px;}</style></head><body>');
  w.document.write(card.outerHTML);
  w.document.write('</body></html>');
  w.document.close();
  w.print();
}

// ===== أدوات =====
function closeModal(btn) {
  const overlay = btn.closest('.modal-overlay');
  if (overlay) overlay.remove();
}

// ===== التحقق من الجلسة عند التحميل =====
document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  initSampleData();
  if (user) {
    enterApp(user);
  }
});
