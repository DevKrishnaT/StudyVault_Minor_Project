import { GoogleGenerativeAI } from '@google/generative-ai';
import { pool } from '../db.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Embedding model — use 'models/text-embedding-004' (correct ID format)
const embedModel = () => genAI.getGenerativeModel({
  model: process.env.GEMINI_EMBED_MODEL || 'models/text-embedding-004'
});
const chatModel = () => genAI.getGenerativeModel({
  model: process.env.GEMINI_CHAT_MODEL || 'gemini-3.8-flash'
});

// ─── Chunking ───
export function chunkText(text, size = 900, overlap = 120) {
  const clean = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  for (let start = 0; start < clean.length; start += size - overlap) {
    const part = clean.slice(start, start + size);
    if (part.trim()) chunks.push(part);
  }
  return chunks;
}

// ─── Embedding (with graceful error) ───
async function embedding(text) {
  if (!process.env.GEMINI_API_KEY) throw new Error('Set GEMINI_API_KEY in backend/.env');
  const result = await embedModel().embedContent(text);
  return result.embedding.values;
}

// ─── Cosine similarity ───
function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; aa += a[i] * a[i]; bb += b[i] * b[i]; }
  return dot / (Math.sqrt(aa) * Math.sqrt(bb) || 1);
}

// ─── Index a note into chunks ───
export async function indexNote(noteId, courseId, content) {
  const parts = chunkText(content);
  let count = 0;
  for (const part of parts) {
    try {
      const vector = await embedding(part);
      await pool.execute(
        'INSERT INTO chunks(note_id,course_id,chunk_text,embedding) VALUES(?,?,?,?)',
        [noteId, courseId, part, JSON.stringify(vector)]
      );
      count++;
    } catch (e) {
      // If embedding fails, still store chunk without embedding (text search fallback)
      try {
        await pool.execute(
          'INSERT INTO chunks(note_id,course_id,chunk_text,embedding) VALUES(?,?,?,?)',
          [noteId, courseId, part, null]
        );
        count++;
      } catch { /* ignore */ }
    }
  }
  return count;
}

// ─── Answer from course notes (RAG with text-search fallback) ───
export async function answerFromNotes(courseId, question) {
  // Try semantic search first
  let context = '';
  let sources = [];

  try {
    const qv = await embedding(question);
    const [rows] = await pool.execute(
      'SELECT chunk_text, embedding FROM chunks WHERE course_id=? AND embedding IS NOT NULL',
      [courseId]
    );

    if (rows.length > 0) {
      const scored = rows.map(r => ({
        text: r.chunk_text,
        score: cosine(qv, typeof r.embedding === 'string' ? JSON.parse(r.embedding) : r.embedding)
      }));
      const best = scored.sort((a, b) => b.score - a.score).slice(0, 5).filter(x => x.score > 0.05);
      if (best.length > 0) {
        context = best.map((x, i) => `[Source ${i + 1}]\n${x.text}`).join('\n\n');
        sources = best.map((x, i) => ({ label: `Source ${i + 1}`, excerpt: x.text.slice(0, 260) }));
      }
    }
  } catch (e) {
    // Embedding failed — will fall back to text search below
  }

  // Fallback: text keyword search in chunks
  if (!context) {
    const [rows] = await pool.execute(
      'SELECT chunk_text FROM chunks WHERE course_id=? ORDER BY RAND() LIMIT 20',
      [courseId]
    );
    if (rows.length > 0) {
      // Simple keyword relevance: score by how many question words appear
      const words = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const scored = rows.map(r => ({
        text: r.chunk_text,
        score: words.filter(w => r.chunk_text.toLowerCase().includes(w)).length
      })).sort((a, b) => b.score - a.score).slice(0, 5);

      context = scored.map((x, i) => `[Source ${i + 1}]\n${x.text}`).join('\n\n');
      sources = scored.map((x, i) => ({ label: `Source ${i + 1}`, excerpt: x.text.slice(0, 260) }));
    }
  }

  // Final fallback: fetch from notes table directly
  if (!context) {
    const [notes] = await pool.execute(
      'SELECT title, content FROM notes WHERE course_id=? LIMIT 1',
      [courseId]
    );
    if (notes.length > 0) {
      context = notes[0].content.slice(0, 8000);
      sources = [{ label: 'Course Notes', excerpt: context.slice(0, 260) }];
    }
  }

  if (!context) {
    return {
      answer: 'No course material found. Please enroll in the course first.',
      sources: []
    };
  }

  const prompt = `You are StudyVault AI, a knowledgeable and friendly study assistant. Answer the student's question using the course material context below.

Guidelines:
- Be clear, detailed, and educational in your response
- Use structured formatting with bullet points or numbered steps where helpful  
- If the context contains partial information, share what you know and note the gaps
- Keep your answer focused and student-friendly
- Always explain concepts thoroughly as if teaching a student

COURSE MATERIAL:
${context}

STUDENT'S QUESTION: ${question}

Provide a thorough, well-structured answer:`;

  const result = await chatModel().generateContent(prompt);
  return {
    answer: result.response.text(),
    sources
  };
}

// ─── Generate quiz from course notes ───
export async function generateQuiz(courseId, count = 5) {
  // Try to get chunks first
  let context = '';

  const [chunks] = await pool.execute(
    'SELECT chunk_text FROM chunks WHERE course_id=? ORDER BY RAND() LIMIT 30',
    [courseId]
  );

  if (chunks.length > 0) {
    context = chunks.map(r => r.chunk_text).join('\n').slice(0, 14000);
  } else {
    // Fallback: read from notes table directly
    const [notes] = await pool.execute(
      'SELECT content FROM notes WHERE course_id=? LIMIT 2',
      [courseId]
    );
    if (notes.length === 0) throw new Error('No course material available. Enroll in the course first.');
    context = notes.map(n => n.content).join('\n').slice(0, 14000);
  }

  const questionCount = Math.min(10, Math.max(3, count));

  const prompt = `You are an expert educational content creator. Create ${questionCount} high-quality multiple-choice questions from the study material below.

Requirements:
- Questions should test genuine understanding, not just recall
- Each question must have exactly 4 options (A, B, C, D)
- Include one clearly correct answer and three plausible distractors
- Add a clear, educational explanation for why the answer is correct
- Vary difficulty: include easy, medium, and challenging questions
- Use clear, academic language appropriate for students

Return ONLY a valid JSON array with this exact structure (no markdown, no extra text):
[
  {
    "question": "Clear question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answerIndex": 0,
    "explanation": "Explanation of why this answer is correct and others are wrong.",
    "difficulty": "easy|medium|hard"
  }
]

STUDY MATERIAL:
${context}`;

  const result = await chatModel().generateContent(prompt);
  const raw = result.response.text()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Quiz generation returned invalid JSON. Please try again.');
  }
}

// ─── Generate course syllabus ───
export async function generateSyllabus(courseId, notes, course) {
  const combinedContent = notes
    .map(n => `[${n.title}]\n${n.content}`)
    .join('\n\n')
    .slice(0, 18000);

  const prompt = `You are an expert curriculum designer. Based on the course materials provided, create a structured course syllabus.

Course: "${course.title}"
${course.description ? `Description: ${course.description}` : ''}

Create a detailed syllabus with 6-8 topics. For each topic provide:
- A clear topic title
- 3-5 subtopics/learning points
- Estimated duration in minutes (30-90)
- Difficulty level (easy, medium, or hard)
- Learning objectives (1-2 sentences)

Return ONLY a valid JSON array (no markdown, no extra text):
[
  {
    "topic": "Topic title",
    "subtopics": ["Subtopic 1", "Subtopic 2", "Subtopic 3"],
    "duration": 45,
    "difficulty": "easy|medium|hard",
    "objectives": "Students will be able to..."
  }
]

COURSE MATERIALS:
${combinedContent}`;

  const result = await chatModel().generateContent(prompt);
  const raw = result.response.text()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Syllabus generation returned invalid JSON. Please try again.');
  }
}
