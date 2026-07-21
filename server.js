const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'cairo_school_secret_2026';

const db = new Database(path.join(__dirname, 'school.db'));
db.pragma('journal_mode = WAL');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname)));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ===== إنشاء الجداول =====
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    photo TEXT DEFAULT '',
    is_admin INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    badge TEXT DEFAULT 'خبر',
    image TEXT DEFAULT '',
    date TEXT DEFAULT (date('now')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    stage TEXT DEFAULT '',
    pdf_link TEXT DEFAULT '',
    date TEXT DEFAULT (date('now')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_name TEXT NOT NULL,
    text TEXT NOT NULL,
    time TEXT DEFAULT (time('now')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );
`);

// ===== Middleware المصادقة =====
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'غير مصرح' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'توكن غير صالح' });
  }
}

function adminAuth(req, res, next) {
  auth(req, res, () => {
    if (!req.user.is_admin) return res.status(403).json({ error: 'يجب أن تكون مشرفاً' });
    next();
  });
}

// ===== التأكد من وجود مشرف أول =====
const adminCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE is_admin = 1').get();
if (adminCount.c === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT OR IGNORE INTO users (name, email, password, is_admin) VALUES (?, ?, ?, 1)')
    .run('مشرف النظام', 'admin@school.com', hash);
  console.log('✅ تم إنشاء حساب المشرف: admin@school.com / admin123');
}

// ============================================================
// ======================= API ROUTES =========================
// ============================================================

// ---- المصادقة ----
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(400).json({ error: 'البريد أو كلمة المرور غير صحيحة' });

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, is_admin: user.is_admin },
    JWT_SECRET, { expiresIn: '7d' }
  );
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, photo: user.photo, is_admin: user.is_admin } });
});

app.post('/api/register', upload.single('photo'), (req, res) => {
  const { name, email, password } = req.body;
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });

  const hash = bcrypt.hashSync(password, 10);
  const photo = req.file ? '/uploads/' + req.file.filename : '';

  const result = db.prepare('INSERT INTO users (name, email, password, photo) VALUES (?, ?, ?, ?)')
    .run(name, email, hash, photo);

  const user = db.prepare('SELECT id, name, email, photo, is_admin FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, is_admin: user.is_admin },
    JWT_SECRET, { expiresIn: '7d' }
  );
  res.json({ token, user });
});

app.get('/api/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, photo, is_admin FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
  res.json(user);
});

// ---- المستخدمين (للمشرف) ----
app.get('/api/users', adminAuth, (req, res) => {
  const users = db.prepare('SELECT id, name, email, photo, is_admin, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

// ---- الأخبار ----
app.get('/api/news', (req, res) => {
  const news = db.prepare('SELECT * FROM news ORDER BY created_at DESC').all();
  res.json(news);
});

app.post('/api/news', adminAuth, upload.single('image'), (req, res) => {
  const { title, content, badge } = req.body;
  const image = req.file ? '/uploads/' + req.file.filename : '';
  db.prepare('INSERT INTO news (title, content, badge, image) VALUES (?, ?, ?, ?)')
    .run(title, content || '', badge || 'خبر', image);
  const news = db.prepare('SELECT * FROM news ORDER BY created_at DESC').all();
  res.json(news);
});

app.put('/api/news/:id', adminAuth, upload.single('image'), (req, res) => {
  const { title, content, badge } = req.body;
  let image = req.body.existing_image || '';
  if (req.file) image = '/uploads/' + req.file.filename;
  db.prepare('UPDATE news SET title=?, content=?, badge=?, image=? WHERE id=?')
    .run(title, content || '', badge || 'خبر', image, req.params.id);
  const news = db.prepare('SELECT * FROM news ORDER BY created_at DESC').all();
  res.json(news);
});

app.delete('/api/news/:id', adminAuth, (req, res) => {
  db.prepare('DELETE FROM news WHERE id=?').run(req.params.id);
  const news = db.prepare('SELECT * FROM news ORDER BY created_at DESC').all();
  res.json(news);
});

// ---- الامتحانات ----
app.get('/api/exams', (req, res) => {
  const { department } = req.query;
  let exams;
  if (department) {
    exams = db.prepare('SELECT * FROM exams WHERE department = ? ORDER BY created_at DESC').all(department);
  } else {
    exams = db.prepare('SELECT * FROM exams ORDER BY created_at DESC').all();
  }
  res.json(exams);
});

app.post('/api/exams', adminAuth, (req, res) => {
  const { name, department, stage, pdf_link } = req.body;
  db.prepare('INSERT INTO exams (name, department, stage, pdf_link) VALUES (?, ?, ?, ?)')
    .run(name, department, stage || '', pdf_link || '');
  const exams = db.prepare('SELECT * FROM exams ORDER BY created_at DESC').all();
  res.json(exams);
});

app.put('/api/exams/:id', adminAuth, (req, res) => {
  const { name, department, stage, pdf_link } = req.body;
  db.prepare('UPDATE exams SET name=?, department=?, stage=?, pdf_link=? WHERE id=?')
    .run(name, department, stage || '', pdf_link || '', req.params.id);
  const exams = db.prepare('SELECT * FROM exams ORDER BY created_at DESC').all();
  res.json(exams);
});

app.delete('/api/exams/:id', adminAuth, (req, res) => {
  db.prepare('DELETE FROM exams WHERE id=?').run(req.params.id);
  const exams = db.prepare('SELECT * FROM exams ORDER BY created_at DESC').all();
  res.json(exams);
});

// ---- الحضور ----
app.post('/api/attendance', auth, (req, res) => {
  const { user_id, date } = req.body;
  const existing = db.prepare('SELECT id FROM attendance WHERE user_id = ? AND date = ?').get(user_id, date);
  if (existing) return res.status(400).json({ error: 'تم تسجيل الحضور مسبقاً لهذا اليوم' });
  db.prepare('INSERT INTO attendance (user_id, date) VALUES (?, ?)').run(user_id, date);
  res.json({ success: true });
});

app.get('/api/attendance', auth, (req, res) => {
  let records;
  if (req.user.is_admin) {
    records = db.prepare(`
      SELECT a.*, u.name as user_name, u.email, u.photo
      FROM attendance a JOIN users u ON a.user_id = u.id
      ORDER BY a.date DESC, a.created_at DESC
    `).all();
  } else {
    records = db.prepare(`
      SELECT a.*, u.name as user_name
      FROM attendance a JOIN users u ON a.user_id = u.id
      WHERE a.user_id = ?
      ORDER BY a.date DESC
    `).all(req.user.id);
  }
  res.json(records);
});

// ---- الدردشة ----
app.get('/api/messages', (req, res) => {
  const msgs = db.prepare('SELECT * FROM messages ORDER BY created_at ASC').all();
  res.json(msgs);
});

app.post('/api/messages', auth, (req, res) => {
  const { text } = req.body;
  db.prepare('INSERT INTO messages (user_id, user_name, text) VALUES (?, ?, ?)')
    .run(req.user.id, req.user.name, text);
  const msgs = db.prepare('SELECT * FROM messages ORDER BY created_at ASC').all();
  res.json(msgs);
});

// ---- بيانات أولية ----
app.post('/api/seed', adminAuth, (req, res) => {
  const newsCount = db.prepare('SELECT COUNT(*) as c FROM news').get().c;
  if (newsCount > 0) return res.json({ message: 'البيانات موجودة مسبقاً' });

  const sampleNews = [
    { title: 'افتتاح معمل الأمن السيبراني', content: 'تم افتتاح أحدث معمل للأمن السيبراني برعاية وزارة التربية', badge: 'جديد' },
    { title: 'نتائج الامتحانات النهائية', content: 'يمكنكم الآن الاستعلام عن نتائج الامتحانات عبر المنصة', badge: 'مهم' },
    { title: 'مسابقة الروبوتات السنوية', content: 'تعلن المدرسة عن مسابقة الروبوتات لطلاب قسم الميكاترونكس', badge: 'فعالية' },
    { title: 'دورة تدريبية في أدوات الليزر', content: 'تسجيل الآن في الدورة التدريبية المتقدمة لأدوات الليزر', badge: 'إعلان' }
  ];
  const insertNews = db.prepare('INSERT INTO news (title, content, badge) VALUES (?, ?, ?)');
  for (const n of sampleNews) insertNews.run(n.title, n.content, n.badge);

  const departments = ['cyber', 'hardware', 'mechanics', 'mechatronics', 'laser'];
  const stages = ['first', 'second', 'third'];
  const insertExam = db.prepare('INSERT INTO exams (name, department, stage) VALUES (?, ?, ?)');
  for (const dept of departments) {
    for (const st of stages) {
      insertExam.run(`امتحان الفصل الأول - ${dept} - ${st}`, dept, st);
      insertExam.run(`امتحان الفصل الثاني - ${dept} - ${st}`, dept, st);
    }
  }

  res.json({ message: 'تم إنشاء البيانات الأولية' });
});

// ===== تشغيل الخادم =====
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ خادم إعدادية القاهرة المهنية الرائدة يعمل على http://localhost:${PORT}`);
  console.log(`📧 حساب المشرف: admin@school.com / admin123`);
});
