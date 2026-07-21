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

// ===== بيانات الأقسام المهنية (مراحل + روابط PDF) =====
const departmentsData = {
  cyber: {
    name: 'الأمن السيبراني',
    icon: 'fa-shield-alt',
    color: '#00bcd4',
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
    ],
    grades: [
      { student: 'أحمد محمد', subject: 'أمن الشبكات', score: 92, status: 'passed' },
      { student: 'أحمد محمد', subject: 'تشفير البيانات', score: 88, status: 'passed' },
      { student: 'أحمد محمد', subject: 'اختبار الاختراق', score: 95, status: 'passed' },
      { student: 'سارة خالد', subject: 'أمن الشبكات', score: 78, status: 'passed' },
      { student: 'سارة خالد', subject: 'تشفير البيانات', score: 85, status: 'passed' },
      { student: 'سارة خالد', subject: 'اختبار الاختراق', score: 72, status: 'passed' },
      { student: 'عمر حسن', subject: 'أمن الشبكات', score: 65, status: 'passed' },
      { student: 'عمر حسن', subject: 'تشفير البيانات', score: 58, status: 'failed' },
      { student: 'عمر حسن', subject: 'اختبار الاختراق', score: 70, status: 'passed' },
      { student: 'نورة أحمد', subject: 'أمن الشبكات', score: 97, status: 'passed' },
      { student: 'نورة أحمد', subject: 'تشفير البيانات', score: 91, status: 'passed' },
      { student: 'نورة أحمد', subject: 'اختبار الاختراق', score: 89, status: 'passed' }
    ]
  },
  hardware: {
    name: 'تجميع الحاسوب',
    icon: 'fa-desktop',
    color: '#ff5722',
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
    ],
    grades: [
      { student: 'خالد علي', subject: 'صيانة الحاسوب', score: 90, status: 'passed' },
      { student: 'خالد علي', subject: 'شبكات الحاسوب', score: 85, status: 'passed' },
      { student: 'خالد علي', subject: 'تركيب الأنظمة', score: 78, status: 'passed' },
      { student: 'مريم سامي', subject: 'صيانة الحاسوب', score: 95, status: 'passed' },
      { student: 'مريم سامي', subject: 'شبكات الحاسوب', score: 88, status: 'passed' },
      { student: 'مريم سامي', subject: 'تركيب الأنظمة', score: 92, status: 'passed' },
      { student: 'يوسف عمر', subject: 'صيانة الحاسوب', score: 55, status: 'failed' },
      { student: 'يوسف عمر', subject: 'شبكات الحاسوب', score: 62, status: 'passed' },
      { student: 'يوسف عمر', subject: 'تركيب الأنظمة', score: 48, status: 'failed' },
      { student: 'هدى عادل', subject: 'صيانة الحاسوب', score: 88, status: 'passed' },
      { student: 'هدى عادل', subject: 'شبكات الحاسوب', score: 93, status: 'passed' },
      { student: 'هدى عادل', subject: 'تركيب الأنظمة', score: 87, status: 'passed' }
    ]
  },
  mechanics: {
    name: 'ميكانيك الأجهزة',
    icon: 'fa-cogs',
    color: '#4caf50',
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
    ],
    grades: [
      { student: 'أحمد كريم', subject: 'ميكانيكا عامة', score: 82, status: 'passed' },
      { student: 'أحمد كريم', subject: 'كهرباء الأجهزة', score: 76, status: 'passed' },
      { student: 'أحمد كريم', subject: 'تبريد وتكييف', score: 70, status: 'passed' },
      { student: 'ليلى محمود', subject: 'ميكانيكا عامة', score: 94, status: 'passed' },
      { student: 'ليلى محمود', subject: 'كهرباء الأجهزة', score: 91, status: 'passed' },
      { student: 'ليلى محمود', subject: 'تبريد وتكييف', score: 96, status: 'passed' },
      { student: 'سامي جابر', subject: 'ميكانيكا عامة', score: 60, status: 'passed' },
      { student: 'سامي جابر', subject: 'كهرباء الأجهزة', score: 54, status: 'failed' },
      { student: 'سامي جابر', subject: 'تبريد وتكييف', score: 67, status: 'passed' },
      { student: 'رنا فادي', subject: 'ميكانيكا عامة', score: 87, status: 'passed' },
      { student: 'رنا فادي', subject: 'كهرباء الأجهزة', score: 83, status: 'passed' },
      { student: 'رنا فادي', subject: 'تبريد وتكييف', score: 79, status: 'passed' }
    ]
  },
  mechatronics: {
    name: 'ميكاترونكس',
    icon: 'fa-robot',
    color: '#9c27b0',
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
    ],
    grades: [
      { student: 'زياد أنور', subject: 'إلكترونيات', score: 86, status: 'passed' },
      { student: 'زياد أنور', subject: 'برمجة تحكم', score: 90, status: 'passed' },
      { student: 'زياد أنور', subject: 'روبوتات', score: 94, status: 'passed' },
      { student: 'دينا فؤاد', subject: 'إلكترونيات', score: 73, status: 'passed' },
      { student: 'دينا فؤاد', subject: 'برمجة تحكم', score: 68, status: 'passed' },
      { student: 'دينا فؤاد', subject: 'روبوتات', score: 81, status: 'passed' },
      { student: 'باسل هاني', subject: 'إلكترونيات', score: 49, status: 'failed' },
      { student: 'باسل هاني', subject: 'برمجة تحكم', score: 55, status: 'failed' },
      { student: 'باسل هاني', subject: 'روبوتات', score: 61, status: 'passed' },
      { student: 'سلمى ناصر', subject: 'إلكترونيات', score: 96, status: 'passed' },
      { student: 'سلمى ناصر', subject: 'برمجة تحكم', score: 92, status: 'passed' },
      { student: 'سلمى ناصر', subject: 'روبوتات', score: 98, status: 'passed' }
    ]
  },
  laser: {
    name: 'أدوات الليزر',
    icon: 'fa-light fa-laser',
    color: '#e91e63',
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
    ],
    grades: [
      { student: 'فارس علاء', subject: 'فيزياء الليزر', score: 91, status: 'passed' },
      { student: 'فارس علاء', subject: 'تطبيقات الليزر', score: 95, status: 'passed' },
      { student: 'فارس علاء', subject: 'أمن وسلامة', score: 88, status: 'passed' },
      { student: 'هند رامي', subject: 'فيزياء الليزر', score: 77, status: 'passed' },
      { student: 'هند رامي', subject: 'تطبيقات الليزر', score: 82, status: 'passed' },
      { student: 'هند رامي', subject: 'أمن وسلامة', score: 74, status: 'passed' },
      { student: 'ماجد سامر', subject: 'فيزياء الليزر', score: 52, status: 'failed' },
      { student: 'ماجد سامر', subject: 'تطبيقات الليزر', score: 63, status: 'passed' },
      { student: 'ماجد سامر', subject: 'أمن وسلامة', score: 58, status: 'failed' },
      { student: 'لينا جمال', subject: 'فيزياء الليزر', score: 89, status: 'passed' },
      { student: 'لينا جمال', subject: 'تطبيقات الليزر', score: 93, status: 'passed' },
      { student: 'لينا جمال', subject: 'أمن وسلامة', score: 86, status: 'passed' }
    ]
  }
};

const dayNames = {
  sun: 'الأحد',
  mon: 'الإثنين',
  tue: 'الثلاثاء',
  wed: 'الأربعاء',
  thu: 'الخميس'
};

const dayOrder = ['sun', 'mon', 'tue', 'wed', 'thu'];

const stageLabels = {
  first: 'المرحلة الأولى',
  second: 'المرحلة الثانية',
  third: 'المرحلة الثالثة'
};

const stageIcons = {
  first: 'fa-1',
  second: 'fa-2',
  third: 'fa-3'
};

let currentStage = 'first';

function openDepartment(id) {
  const data = departmentsData[id];
  if (!data) return;

  const headerIcon = document.getElementById('deptDetailIcon');
  const headerName = document.getElementById('deptDetailName');

  headerIcon.innerHTML = `<i class="fas ${data.icon}"></i>`;
  headerName.textContent = data.name;
  document.getElementById('deptDetailHeader').style.background =
    `linear-gradient(135deg, ${data.color}dd, ${data.color}88)`;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  document.getElementById('page-department').classList.add('active-page');

  currentStage = 'first';
  renderStageTabs(data);
  renderSubjects(data);
  renderSchedule(data);
  renderGrades(data);

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

function renderSubjects(data) {
  const list = document.getElementById('subjectsList');
  const subjects = data.stages[currentStage];
  if (!subjects) { list.innerHTML = ''; return; }

  const colors = ['#00bcd4', '#ff5722', '#4caf50', '#9c27b0', '#e91e63'];

  list.innerHTML = subjects.map((s, i) => `
    <div class="subject-card" style="--subject-color: ${colors[i % colors.length]}" onclick="openPDF('${encodeURIComponent(s.pdf)}')">
      <div class="subject-icon"><i class="fas ${s.icon}"></i></div>
      <div class="subject-info">
        <h4>${s.name}</h4>
        <p>${s.desc}</p>
      </div>
      <div class="subject-download"><i class="fas fa-file-pdf"></i></div>
    </div>
  `).join('');
}

function openPDF(url) {
  if (url === '#' || !url) {
    showToast('📚 سيتم إضافة رابط تحميل PDF قريباً');
    return;
  }
  window.open(url, '_blank');
}

function renderSchedule(data) {
  const container = document.getElementById('scheduleContainer');

  let table = `
    <table class="schedule-table">
      <thead>
        <tr>
          <th>الفترة</th>
          ${dayOrder.map(d => `<th>${dayNames[d]}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
  `;

  data.schedule.forEach(row => {
    table += `<tr>
      <td class="period-label">${row.period}<span class="period-time">${row.time}</span></td>
      ${dayOrder.map(d => {
        const subj = row.days[d];
        const color = getSubjectColor(subj, data.color);
        return `<td><span class="subject-tag" style="--tag-color: ${color}">${subj}</span></td>`;
      }).join('')}
    </tr>`;
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

function renderGrades(data) {
  const container = document.getElementById('gradesContainer');

  let table = `
    <table class="grades-table">
      <thead>
        <tr>
          <th>الطالب</th>
          <th>المادة</th>
          <th>الدرجة</th>
          <th>الحالة</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.grades.forEach(g => {
    const scoreClass = g.score >= 85 ? 'high' : g.score >= 60 ? 'mid' : 'low';
    const statusText = g.status === 'passed' ? 'ناجح' : 'راسب';
    table += `<tr>
      <td>${g.student}</td>
      <td>${g.subject}</td>
      <td class="grade-score ${scoreClass}">${g.score}</td>
      <td><span class="grade-status ${g.status}">${statusText}</span></td>
    </tr>`;
  });

  table += '</tbody></table>';
  container.innerHTML = table;
}

function switchDeptTab(tab) {
  document.querySelectorAll('.dept-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.dept-tab-panel').forEach(p => p.classList.remove('active-panel'));

  const tabBtn = document.querySelector(`.dept-tab[data-tab="${tab}"]`);
  if (tabBtn) tabBtn.classList.add('active');

  const tabMap = { subjects: 'deptSubjects', schedule: 'deptSchedule', grades: 'deptGrades' };
  const panel = document.getElementById(tabMap[tab]);
  if (panel) panel.classList.add('active-panel');
}

function closeDepartment() {
  navigateTo('home');
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
