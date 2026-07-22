const API = window.location.origin + '/api';
let TOKEN = localStorage.getItem('dashboard_token') || '';
let currentUser = null;

function $(id) { return document.getElementById(id); }

function api(path, opts = {}) {
  const headers = { ...(opts.body && !(opts.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}) };
  if (TOKEN) headers['Authorization'] = 'Bearer ' + TOKEN;
  return fetch(API + path, { ...opts, headers }).then(r => {
    if (!r.ok) return r.json().then(e => { throw new Error(e.error || 'خطأ في الطلب'); });
    return r.json();
  });
}

function toast(msg, type = 'info') {
  const c = $('toast');
  const t = document.createElement('div');
  t.className = `toast-item ${type}`;
  const icons = { success:'fa-check-circle', error:'fa-exclamation-circle', info:'fa-info-circle' };
  t.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${msg}`;
  c.appendChild(t);
  setTimeout(() => { if (t.parentNode) t.remove(); }, 3000);
}

function showModal(html) {
  $('modalBody').innerHTML = html;
  $('modal').classList.remove('hidden');
}

function closeModal() { $('modal').classList.add('hidden'); }

// ===== AUTH =====
$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  $('loginError').textContent = '';
  try {
    const data = await api('/login', {
      method: 'POST',
      body: JSON.stringify({ email: $('loginEmail').value.trim(), password: $('loginPassword').value.trim() })
    });
    TOKEN = data.token;
    localStorage.setItem('dashboard_token', TOKEN);
    currentUser = data.user;
    enterDashboard();
  } catch (err) {
    $('loginError').textContent = '⚠️ ' + err.message;
  }
});

async function enterDashboard() {
  $('authScreen').classList.add('hidden');
  $('dashboard').classList.remove('hidden');
  $('adminName').textContent = currentUser.name;
  $('adminRole').textContent = currentUser.is_admin ? 'مسؤول النظام' : 'مشرف';
  await loadAllData();
  navigate('overview');
}

async function logout() {
  localStorage.removeItem('dashboard_token');
  TOKEN = '';
  currentUser = null;
  $('dashboard').classList.add('hidden');
  $('authScreen').classList.remove('hidden');
}

// ===== NAVIGATION =====
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const p = $('page-' + page);
  if (p) p.classList.add('active');
  const nav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (nav) nav.classList.add('active');
  const titles = { overview:'الإحصائيات', students:'الطلاب', news:'الأخبار', exams:'الامتحانات', attendance:'الحضور', cards:'البطاقات' };
  $('pageTitle').textContent = titles[page] || page;
  if (page === 'students') renderStudents();
  if (page === 'news') renderNews();
  if (page === 'exams') renderExams();
  if (page === 'attendance') renderAttendance();
  if (page === 'cards') populateCardSelect();
  if (window.innerWidth <= 768) $('sidebar').classList.remove('open');
}

document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', () => navigate(el.dataset.page));
});

function toggleSidebar() { $('sidebar').classList.toggle('open'); }

// ===== THEME =====
function toggleTheme() {
  document.body.classList.toggle('light');
  const icon = document.querySelector('.theme-btn i');
  icon.className = document.body.classList.contains('light') ? 'fas fa-sun' : 'fas fa-moon';
  localStorage.setItem('dashboard_theme', document.body.classList.contains('light') ? 'light' : 'dark');
}

const savedTheme = localStorage.getItem('dashboard_theme');
if (savedTheme === 'light') { document.body.classList.add('light'); document.querySelector('.theme-btn i').className = 'fas fa-sun'; }

// ===== DATA LOADING =====
let cachedUsers = [], cachedNews = [], cachedExams = [], cachedAttendance = [], cachedMessages = [];

async function loadAllData() {
  try { cachedUsers = await api('/users'); } catch(e) {}
  try { cachedNews = await api('/news'); } catch(e) {}
  try { cachedExams = await api('/exams'); } catch(e) {}
  try { cachedAttendance = await api('/attendance'); } catch(e) {}
  try { cachedMessages = await api('/messages'); } catch(e) {}
  updateStats();
}

function updateStats() {
  $('statStudents').textContent = cachedUsers.filter(u => !u.is_admin).length;
  $('statNews').textContent = cachedNews.length;
  $('statExams').textContent = cachedExams.length;
  $('statAttendance').textContent = cachedAttendance.length;
  $('statCards').textContent = cachedUsers.filter(u => !u.is_admin).length;
  $('statMessages').textContent = cachedMessages.length;
  renderOverview();
}

function renderOverview() {
  const newsHtml = cachedNews.slice(0, 5).map(n =>
    `<div class="overview-item"><span class="title">${n.title}</span><span class="meta">${n.date}</span></div>`
  ).join('') || '<div class="overview-item" style="color:var(--text-muted)">لا توجد أخبار</div>';
  $('overviewNews').innerHTML = newsHtml;

  const attHtml = cachedAttendance.slice(0, 5).map(a =>
    `<div class="overview-item"><span class="title">${a.user_name}</span><span class="meta">${a.date}</span></div>`
  ).join('') || '<div class="overview-item" style="color:var(--text-muted)">لا توجد تسجيلات حضور</div>';
  $('overviewAttendance').innerHTML = attHtml;
}

// ===== STUDENTS =====
function renderStudents() {
  const term = ($('studentSearch')?.value || '').trim().toLowerCase();
  const list = term ? cachedUsers.filter(u => u.name.includes(term) || u.email.includes(term)) : cachedUsers;
  const attendanceCount = {};
  cachedAttendance.forEach(a => { attendanceCount[a.user_id] = (attendanceCount[a.user_id] || 0) + 1; });

  $('studentsTableBody').innerHTML = list.map((u, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><div class="avatar-sm">${u.photo ? `<img src="${window.location.origin}${u.photo}">` : '<i class="fas fa-user-graduate"></i>'}</div></td>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td><span class="badge ${u.is_admin ? 'badge-admin' : 'badge-student'}">${u.is_admin ? 'مشرف' : 'طالب'}</span></td>
      <td>${u.created_at ? u.created_at.split(' ')[0] : '-'}</td>
      <td>${attendanceCount[u.id] || 0}</td>
      <td>
        <button class="action-btn" onclick="viewStudent(${u.id})" title="عرض"><i class="fas fa-eye"></i></button>
        ${!u.is_admin ? `<button class="action-btn danger" onclick="deleteStudent(${u.id})" title="حذف"><i class="fas fa-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');
}

function viewStudent(id) {
  const u = cachedUsers.find(x => x.id === id);
  if (!u) return;
  const days = cachedAttendance.filter(a => a.user_id === id).length;
  showModal(`
    <label>الاسم</label><input type="text" value="${u.name}" readonly>
    <label>البريد</label><input type="text" value="${u.email}" readonly>
    <label>الدور</label><input type="text" value="${u.is_admin ? 'مشرف' : 'طالب'}" readonly>
    <label>تاريخ التسجيل</label><input type="text" value="${u.created_at ? u.created_at.split(' ')[0] : '-'}" readonly>
    <label>أيام الحضور</label><input type="text" value="${days} يوم" readonly>
    <div class="modal-actions"><button class="btn-cancel" onclick="closeModal()">إغلاق</button></div>
  `);
}

async function deleteStudent(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
  toast('لا يمكن حذف المستخدمين من لوحة التحكم حالياً', 'error');
}

function exportStudents() {
  const csv = [['#','الاسم','البريد','الدور','تاريخ التسجيل','أيام الحضور']];
  const attendanceCount = {};
  cachedAttendance.forEach(a => { attendanceCount[a.user_id] = (attendanceCount[a.user_id] || 0) + 1; });
  cachedUsers.forEach((u,i) => {
    csv.push([i+1, u.name, u.email, u.is_admin ? 'مشرف' : 'طالب', u.created_at ? u.created_at.split(' ')[0] : '', attendanceCount[u.id] || 0]);
  });
  downloadCSV(csv, 'الطلاب.csv');
}

function downloadCSV(rows, filename) {
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ===== NEWS =====
function renderNews() {
  $('newsList').innerHTML = cachedNews.map(n => `
    <div class="data-card">
      ${n.image ? `<div class="data-card-thumb"><img src="${window.location.origin}${n.image}"></div>` : ''}
      <div class="data-card-body">
        <h4>${n.title}</h4>
        ${n.content ? `<p>${n.content}</p>` : ''}
        <div class="meta"><span>${n.badge || ''}</span><span>${n.date}</span></div>
      </div>
      <div class="data-card-actions">
        <button class="edit" onclick="editNews(${n.id})"><i class="fas fa-edit"></i></button>
        <button class="delete" onclick="deleteNews(${n.id})"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function showNewsModal() {
  window._editNewsId = null;
  showModal(`
    <label>عنوان الخبر</label><input type="text" id="newsTitle" placeholder="عنوان الخبر">
    <label>محتوى الخبر</label><textarea id="newsContent" placeholder="محتوى الخبر"></textarea>
    <label>الوسم</label><input type="text" id="newsBadge" placeholder="مثلاً: جديد، مهم، إعلان">
    <label>صورة (اختياري)</label><input type="file" id="newsImage" accept="image/*">
    <div class="modal-actions">
      <button class="btn-primary" onclick="saveNews()">حفظ</button>
      <button class="btn-cancel" onclick="closeModal()">إلغاء</button>
    </div>
  `);
}

function editNews(id) {
  const n = cachedNews.find(x => x.id === id);
  if (!n) return;
  window._editNewsId = id;
  showModal(`
    <label>عنوان الخبر</label><input type="text" id="newsTitle" value="${n.title}">
    <label>محتوى الخبر</label><textarea id="newsContent">${n.content || ''}</textarea>
    <label>الوسم</label><input type="text" id="newsBadge" value="${n.badge || ''}">
    <label>صورة (اختياري)</label><input type="file" id="newsImage" accept="image/*">
    <div class="modal-actions">
      <button class="btn-primary" onclick="saveNews()">حفظ</button>
      <button class="btn-cancel" onclick="closeModal()">إلغاء</button>
    </div>
  `);
}

async function saveNews() {
  const title = $('newsTitle').value.trim();
  const content = $('newsContent').value.trim();
  const badge = $('newsBadge').value.trim() || 'خبر';
  const fileInput = $('newsImage');
  if (!title) { toast('يرجى إدخال عنوان الخبر', 'error'); return; }

  const fd = new FormData();
  fd.append('title', title);
  fd.append('content', content);
  fd.append('badge', badge);
  if (fileInput.files[0]) fd.append('image', fileInput.files[0]);

  try {
    if (window._editNewsId) {
      cachedNews = await api('/news/' + window._editNewsId, { method: 'PUT', body: fd });
    } else {
      cachedNews = await api('/news', { method: 'POST', body: fd });
    }
    closeModal();
    renderNews();
    updateStats();
    toast(window._editNewsId ? '✅ تم تحديث الخبر' : '✅ تم إضافة الخبر', 'success');
  } catch (e) { toast('⚠️ ' + e.message, 'error'); }
}

async function deleteNews(id) {
  if (!confirm('هل تريد حذف هذا الخبر؟')) return;
  try {
    cachedNews = await api('/news/' + id, { method: 'DELETE' });
    renderNews();
    updateStats();
    toast('✅ تم حذف الخبر', 'success');
  } catch (e) { toast('⚠️ ' + e.message, 'error'); }
}

// ===== EXAMS =====
const DEPARTMENTS = {
  cyber:'الأمن السيبراني', hardware:'تجميع الحاسوب',
  mechanics:'ميكانيك الأجهزة', mechatronics:'ميكاترونكس', laser:'أدوات الليزر'
};
const STAGES = { first:'المرحلة الأولى', second:'المرحلة الثانية', third:'المرحلة الثالثة' };

function renderExams() {
  const dept = $('examDeptFilter').value;
  const stage = $('examStageFilter').value;
  let list = cachedExams;
  if (dept) list = list.filter(e => e.department === dept);
  if (stage) list = list.filter(e => e.stage === stage);

  $('examsList').innerHTML = (list.length ? list : []).map(e => `
    <div class="data-card">
      <div class="data-card-body">
        <h4>${e.name}</h4>
        <div class="meta"><span>${DEPARTMENTS[e.department] || e.department}</span><span>${STAGES[e.stage] || e.stage || 'عام'}</span><span>${e.date}</span></div>
      </div>
      <div class="data-card-actions">
        ${e.pdf_link ? `<a href="${e.pdf_link}" target="_blank" class="action-btn"><i class="fas fa-external-link-alt"></i></a>` : ''}
        <button class="edit" onclick="editExam(${e.id})"><i class="fas fa-edit"></i></button>
        <button class="delete" onclick="deleteExam(${e.id})"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function showExamModal() {
  window._editExamId = null;
  const deptOpts = Object.entries(DEPARTMENTS).map(([k,v]) => `<option value="${k}">${v}</option>`).join('');
  const stageOpts = Object.entries(STAGES).map(([k,v]) => `<option value="${k}">${v}</option>`).join('');
  showModal(`
    <label>اسم الامتحان</label><input type="text" id="examName" placeholder="اسم الامتحان">
    <label>القسم</label><select id="examDept">${deptOpts}</select>
    <label>المرحلة</label><select id="examStage"><option value="">كل المراحل</option>${stageOpts}</select>
    <label>رابط PDF (اختياري)</label><input type="text" id="examPdf" placeholder="https://...">
    <div class="modal-actions">
      <button class="btn-primary" onclick="saveExam()">حفظ</button>
      <button class="btn-cancel" onclick="closeModal()">إلغاء</button>
    </div>
  `);
}

function editExam(id) {
  const e = cachedExams.find(x => x.id === id);
  if (!e) return;
  window._editExamId = id;
  const deptOpts = Object.entries(DEPARTMENTS).map(([k,v]) => `<option value="${k}" ${k === e.department ? 'selected' : ''}>${v}</option>`).join('');
  const stageOpts = Object.entries(STAGES).map(([k,v]) => `<option value="${k}" ${k === e.stage ? 'selected' : ''}>${v}</option>`).join('');
  showModal(`
    <label>اسم الامتحان</label><input type="text" id="examName" value="${e.name}">
    <label>القسم</label><select id="examDept">${deptOpts}</select>
    <label>المرحلة</label><select id="examStage"><option value="">كل المراحل</option>${stageOpts}</select>
    <label>رابط PDF (اختياري)</label><input type="text" id="examPdf" value="${e.pdf_link || ''}">
    <div class="modal-actions">
      <button class="btn-primary" onclick="saveExam()">حفظ</button>
      <button class="btn-cancel" onclick="closeModal()">إلغاء</button>
    </div>
  `);
}

async function saveExam() {
  const name = $('examName').value.trim();
  const department = $('examDept').value;
  const stage = $('examStage').value;
  const pdf_link = $('examPdf').value.trim();
  if (!name) { toast('يرجى إدخال اسم الامتحان', 'error'); return; }

  const body = { name, department, stage, pdf_link };
  try {
    if (window._editExamId) {
      cachedExams = await api('/exams/' + window._editExamId, { method: 'PUT', body: JSON.stringify(body) });
    } else {
      cachedExams = await api('/exams', { method: 'POST', body: JSON.stringify(body) });
    }
    closeModal();
    renderExams();
    updateStats();
    toast(window._editExamId ? '✅ تم تحديث الامتحان' : '✅ تم إضافة الامتحان', 'success');
  } catch (e) { toast('⚠️ ' + e.message, 'error'); }
}

async function deleteExam(id) {
  if (!confirm('هل تريد حذف هذا الامتحان؟')) return;
  try {
    cachedExams = await api('/exams/' + id, { method: 'DELETE' });
    renderExams();
    updateStats();
    toast('✅ تم حذف الامتحان', 'success');
  } catch (e) { toast('⚠️ ' + e.message, 'error'); }
}

// ===== ATTENDANCE =====
function renderAttendance() {
  const date = $('attendanceDate').value;
  let list = cachedAttendance;
  if (date) list = list.filter(a => a.date === date);

  if (list.length === 0) {
    $('attendanceTableBody').innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem">لا توجد سجلات حضور</td></tr>';
    return;
  }

  $('attendanceTableBody').innerHTML = list.map((a, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><div style="display:flex;align-items:center;gap:0.5rem"><div class="avatar-sm" style="width:28px;height:28px">${a.photo ? `<img src="${window.location.origin}${a.photo}">` : '<i class="fas fa-user"></i>'}</div>${a.user_name}</div></td>
      <td>${a.email || '-'}</td>
      <td>${a.date}</td>
      <td>${a.created_at ? a.created_at.split(' ')[1]?.slice(0,5) || '-' : '-'}</td>
      <td><span class="badge badge-present">✅ حاضر</span></td>
    </tr>
  `).join('');
}

function exportAttendance() {
  const csv = [['#','الطالب','البريد','التاريخ','الوقت','الحالة']];
  cachedAttendance.forEach((a,i) => {
    csv.push([i+1, a.user_name, a.email || '', a.date, a.created_at?.split(' ')[1]?.slice(0,5) || '', 'حاضر']);
  });
  downloadCSV(csv, 'الحضور.csv');
}

// ===== CARDS =====
async function populateCardSelect() {
  try {
    const users = await api('/users');
    const nonAdmin = users.filter(u => !u.is_admin);
    $('cardStudentSelect').innerHTML = '<option value="">اختر طالباً</option>' +
      nonAdmin.map(u => `<option value="${u.id}">${u.name} - ${u.email}</option>`).join('');
  } catch(e) {}
}

async function generateCard() {
  const userId = $('cardStudentSelect').value;
  if (!userId) { $('cardPreview').innerHTML = ''; return; }
  try {
    const users = await api('/users');
    const u = users.find(x => x.id == userId);
    if (!u) return;
    const photoUrl = u.photo ? `${window.location.origin}${u.photo}` : '';
    $('cardPreview').innerHTML = `
      <div class="student-card">
        <div class="card-school">إعدادية القاهرة المهنية الرائدة</div>
        <div class="card-type">بطاقة تعريف طالب</div>
        <div class="card-photo">${photoUrl ? `<img src="${photoUrl}">` : '<i class="fas fa-user-graduate"></i>'}</div>
        <div class="card-name">${u.name}</div>
        <div class="card-email">${u.email}</div>
        <div class="card-role">طالب</div>
        <div class="card-qr" id="cardQr"></div>
        <div class="card-footer">${new Date().toLocaleDateString('ar-SA')}</div>
      </div>
    `;
    new QRCode($('cardQr'), { text: JSON.stringify({ id:u.id, email:u.email, name:u.name }), width:100, height:100 });
  } catch(e) { toast('⚠️ ' + e.message, 'error'); }
}

function printCard() {
  const html = $('cardPreview').innerHTML;
  if (!html) { toast('يرجى اختيار طالب أولاً', 'info'); return; }
  const w = window.open('', '', 'width=400,height=600');
  w.document.write(`<html dir="rtl"><head><style>
    body{margin:0;padding:20px;font-family:sans-serif;background:#fff}
    .student-card{background:linear-gradient(135deg,#0d1117,#1a2038);border:2px solid #d4a843;border-radius:16px;padding:2rem;max-width:360px;margin:0 auto;text-align:center;color:white}
    .card-school{font-size:1rem;font-weight:700;color:#d4a843;margin-bottom:0.25rem}
    .card-type{font-size:0.8rem;color:rgba(255,255,255,0.6);margin-bottom:1.5rem}
    .card-photo{width:80px;height:80px;border-radius:50%;border:3px solid #d4a843;margin:0 auto 1rem;overflow:hidden;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.05)}
    .card-photo img{width:100%;height:100%;object-fit:cover}
    .card-photo i{font-size:2rem;color:#d4a843}
    .card-name{font-size:1.3rem;font-weight:700;margin-bottom:0.25rem}
    .card-email{font-size:0.8rem;color:rgba(255,255,255,0.6);margin-bottom:1rem}
    .card-role{display:inline-block;background:rgba(212,168,67,0.12);color:#d4a843;font-size:0.75rem;padding:0.2rem 1rem;border-radius:20px;margin-bottom:1rem}
    .card-qr{margin-bottom:1rem}
    .card-footer{font-size:0.7rem;color:rgba(255,255,255,0.4)}
  </style></head><body>${html}</body></html>`);
  w.document.close();
  setTimeout(() => { w.print(); }, 500);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  if (TOKEN) {
    try {
      currentUser = await api('/me');
      if (!currentUser.is_admin) {
        toast('⚠️ يجب أن تكون مشرفاً للدخول إلى لوحة التحكم', 'error');
        localStorage.removeItem('dashboard_token');
        TOKEN = '';
        return;
      }
      enterDashboard();
    } catch (e) {
      localStorage.removeItem('dashboard_token');
      TOKEN = '';
    }
  }

  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && !e.target.closest('.sidebar') && !e.target.closest('.menu-toggle')) {
      $('sidebar').classList.remove('open');
    }
  });
});
