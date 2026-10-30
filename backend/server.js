import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";
import { auth, allowRoles } from "./middleware/auth.js";
import { indexNote, answerFromNotes, generateQuiz, generateSyllabus } from "./services/rag.js";
dotenv.config();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

const safeUser = (u) => ({
  id: u.id, name: u.name, email: u.email, role: u.role, xp: u.xp, streak: u.streak,
});

// ─── Health ───
app.get("/api/health", (req, res) => res.json({ status: "ok", app: "StudyVault" }));

// ─── Auth ───
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 8)
      return res.status(400).json({ error: "Name, email and password (8+ characters) are required." });
    const hash = await bcrypt.hash(password, 12);
    const [r] = await pool.execute(
      "INSERT INTO users(name,email,password_hash) VALUES(?,?,?)",
      [name.trim(), email.toLowerCase().trim(), hash]
    );
    const user = { id: r.insertId, name: name.trim(), email: email.toLowerCase().trim(), role: "student", xp: 0, streak: 0 };
    res.status(201).json({ token: jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "7d" }), user });
  } catch (e) {
    res.status(e.code === "ER_DUP_ENTRY" ? 409 : 500).json({
      error: e.code === "ER_DUP_ENTRY" ? "Email already registered" : "Registration failed",
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM users WHERE email=?", [
      String(req.body.email || "").toLowerCase().trim(),
    ]);
    if (!rows[0] || !(await bcrypt.compare(req.body.password || "", rows[0].password_hash)))
      return res.status(401).json({ error: "Invalid email or password" });
    const user = safeUser(rows[0]);
    res.json({ token: jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "7d" }), user });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/me", auth, async (req, res) => {
  const [rows] = await pool.execute(
    "SELECT id,name,email,role,xp,streak FROM users WHERE id=?",
    [req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "User not found" });
  res.json(rows[0]);
});

// ─── Courses ───
// ─── Course Catalog (pre-built courses everyone can browse) ───
app.get("/api/catalog", auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.id, c.title, c.description, c.category, c.difficulty, c.thumbnail_color,
       c.thumbnail_icon, c.total_hours, c.student_count, c.rating,
       (SELECT COUNT(*) FROM notes n WHERE n.course_id=c.id) AS note_count,
       (SELECT COUNT(*) FROM quizzes q WHERE q.course_id=c.id) AS quiz_count,
       EXISTS(SELECT 1 FROM enrollments e WHERE e.course_id=c.id AND e.user_id=?) AS is_enrolled
       FROM courses c WHERE c.is_catalog=1 ORDER BY c.student_count DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Courses ───
app.get("/api/courses", auth, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT c.*, u.name AS creator,
     (SELECT COUNT(*) FROM notes n WHERE n.course_id=c.id) AS note_count,
     (SELECT COUNT(*) FROM enrollments e2 WHERE e2.course_id=c.id) AS enrolled_count,
     (SELECT COUNT(*) FROM quizzes q WHERE q.course_id=c.id) AS quiz_count
     FROM courses c JOIN users u ON u.id=c.created_by
     LEFT JOIN enrollments e ON e.course_id=c.id AND e.user_id=?
     WHERE c.created_by=? OR e.user_id=? ORDER BY c.created_at DESC`,
    [req.user.id, req.user.id, req.user.id]
  );
  res.json(rows);
});


app.post("/api/courses", auth, allowRoles("teacher", "admin"), async (req, res) => {
  const { title, description = "" } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: "Course title is required" });
  const [r] = await pool.execute(
    "INSERT INTO courses(title,description,created_by) VALUES(?,?,?)",
    [title.trim(), description, req.user.id]
  );
  await pool.execute("INSERT INTO enrollments(user_id,course_id) VALUES(?,?)", [req.user.id, r.insertId]);
  res.status(201).json({ id: r.insertId, title, description });
});

app.post("/api/courses/:id/enroll", auth, async (req, res) => {
  try {
    await pool.execute(
      "INSERT IGNORE INTO enrollments(user_id,course_id) VALUES(?,?)",
      [req.user.id, req.params.id]
    );
    res.json({ message: "Enrolled" });
  } catch {
    res.status(500).json({ error: "Could not enroll" });
  }
});

// ─── Notes ───
app.get("/api/courses/:id/notes", auth, async (req, res) => {
  const [rows] = await pool.execute(
    "SELECT id,title,original_name,created_at FROM notes WHERE course_id=? ORDER BY created_at DESC",
    [req.params.id]
  );
  res.json(rows);
});

app.post("/api/courses/:id/notes", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Choose a .txt or .md file" });
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (![".txt", ".md"].includes(ext))
      return res.status(400).json({ error: "This app supports .txt and .md files only" });
    const content = req.file.buffer.toString("utf8").trim();
    if (!content) return res.status(400).json({ error: "The file is empty" });
    const [r] = await pool.execute(
      "INSERT INTO notes(course_id,user_id,title,original_name,content) VALUES(?,?,?,?,?)",
      [req.params.id, req.user.id, req.body.title || req.file.originalname, req.file.originalname, content]
    );
    const chunkCount = await indexNote(r.insertId, Number(req.params.id), content);
    res.status(201).json({ id: r.insertId, title: req.body.title || req.file.originalname, chunkCount });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Upload/indexing failed" });
  }
});

// ─── AI ───
app.post("/api/ai/ask", auth, async (req, res) => {
  try {
    const { courseId, question } = req.body;
    if (!courseId || !question?.trim())
      return res.status(400).json({ error: "courseId and question are required" });
    
    // Update streak
    const today = new Date().toISOString().split("T")[0];
    const [[u]] = await pool.execute("SELECT last_study_date, streak FROM users WHERE id=?", [req.user.id]);
    const lastDate = u.last_study_date ? new Date(u.last_study_date).toISOString().split("T")[0] : null;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    let newStreak = u.streak || 0;
    if (lastDate !== today) {
      newStreak = lastDate === yesterday ? newStreak + 1 : 1;
      await pool.execute(
        "UPDATE users SET streak=?, last_study_date=? WHERE id=?",
        [newStreak, today, req.user.id]
      );
    }

    res.json(await answerFromNotes(Number(courseId), question.trim()));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "AI request failed" });
  }
});

// ─── Syllabus ───
app.get("/api/courses/:id/syllabus", auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT syllabus FROM courses WHERE id=?",
      [req.params.id]
    );
    if (!rows[0] || !rows[0].syllabus) return res.json({ syllabus: null });
    const syllabus = typeof rows[0].syllabus === "string"
      ? JSON.parse(rows[0].syllabus)
      : rows[0].syllabus;
    res.json({ syllabus });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/courses/:id/syllabus", auth, async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    // Get course notes content
    const [notes] = await pool.execute(
      "SELECT content, title FROM notes WHERE course_id=? LIMIT 10",
      [courseId]
    );
    if (!notes.length)
      return res.status(400).json({ error: "Upload course notes first to generate a syllabus." });

    const [courseRows] = await pool.execute("SELECT title, description FROM courses WHERE id=?", [courseId]);
    const course = courseRows[0];

    const syllabus = await generateSyllabus(courseId, notes, course);

    // Save to DB
    await pool.execute("UPDATE courses SET syllabus=? WHERE id=?", [JSON.stringify(syllabus), courseId]);

    res.json({ syllabus });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Syllabus generation failed" });
  }
});

// ─── Quizzes ───
app.post("/api/courses/:id/quizzes/generate", auth, async (req, res) => {
  try {
    const questions = await generateQuiz(Number(req.params.id), Number(req.body.count || 5));
    const title = req.body.title || `Practice Quiz — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    const [r] = await pool.execute(
      "INSERT INTO quizzes(course_id,user_id,title,questions) VALUES(?,?,?,?)",
      [req.params.id, req.user.id, title, JSON.stringify(questions)]
    );
    res.status(201).json({ id: r.insertId, title, questions });
  } catch (e) {
    res.status(500).json({ error: e.message || "Quiz generation failed" });
  }
});

app.get("/api/courses/:id/quizzes", auth, async (req, res) => {
  const [rows] = await pool.execute(
    "SELECT id,title,questions,created_at FROM quizzes WHERE course_id=? ORDER BY created_at DESC",
    [req.params.id]
  );
  res.json(
    rows.map((q) => ({
      ...q,
      questions: typeof q.questions === "string" ? JSON.parse(q.questions) : q.questions,
    }))
  );
});

app.post("/api/quizzes/:id/attempt", auth, async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT questions FROM quizzes WHERE id=?", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Quiz not found" });
    const qs = typeof rows[0].questions === "string" ? JSON.parse(rows[0].questions) : rows[0].questions;
    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
    const score = qs.reduce((n, q, i) => n + (Number(answers[i]) === Number(q.answerIndex) ? 1 : 0), 0);
    await pool.execute(
      "INSERT INTO quiz_attempts(quiz_id,user_id,score,total) VALUES(?,?,?,?)",
      [req.params.id, req.user.id, score, qs.length]
    );
    const xpEarned = score * 10 + 5;
    await pool.execute("UPDATE users SET xp=xp+? WHERE id=?", [xpEarned, req.user.id]);
    res.json({ score, total: qs.length, xpEarned });
  } catch {
    res.status(500).json({ error: "Could not submit quiz" });
  }
});

// ─── Progress ───
app.get("/api/progress", auth, async (req, res) => {
  const [[user]] = await pool.execute("SELECT xp,streak FROM users WHERE id=?", [req.user.id]);
  const [[stats]] = await pool.execute(
    `SELECT COUNT(*) AS attempts, COALESCE(SUM(score),0) AS correct,
     COALESCE(SUM(total),0) AS questions FROM quiz_attempts WHERE user_id=?`,
    [req.user.id]
  );
  const [[notes]] = await pool.execute("SELECT COUNT(*) AS count FROM notes WHERE user_id=?", [req.user.id]);
  res.json({
    ...user, ...stats, notes: notes.count,
    accuracy: stats.questions ? Math.round((stats.correct / stats.questions) * 100) : 0,
  });
});

// ─── Leaderboard ───
app.get("/api/leaderboard", auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.role, u.xp, u.streak,
       COALESCE(
         ROUND(
           SUM(qa.score) / NULLIF(SUM(qa.total), 0) * 100
         ), 0
       ) AS accuracy
       FROM users u
       LEFT JOIN quiz_attempts qa ON qa.user_id = u.id
       GROUP BY u.id
       ORDER BY u.xp DESC
       LIMIT 50`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Forum ───
app.get("/api/courses/:id/forum", auth, async (req, res) => {
  const [rows] = await pool.execute(
    "SELECT p.id,p.body,p.created_at,u.name,u.role FROM forum_posts p JOIN users u ON u.id=p.user_id WHERE p.course_id=? ORDER BY p.created_at DESC",
    [req.params.id]
  );
  res.json(rows);
});

app.post("/api/courses/:id/forum", auth, async (req, res) => {
  const body = String(req.body.body || "").trim();
  if (!body) return res.status(400).json({ error: "Post cannot be empty" });
  const [r] = await pool.execute(
    "INSERT INTO forum_posts(course_id,user_id,body) VALUES(?,?,?)",
    [req.params.id, req.user.id, body]
  );
  res.status(201).json({ id: r.insertId, body });
});

// ─── Error handler ───
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error" });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`StudyVault API running on http://localhost:${port}`));
