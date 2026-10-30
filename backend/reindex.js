/**
 * Re-index all course notes into chunks.
 * Run after seed.js if embedding failed.
 * node reindex.js
 */
import dotenv from 'dotenv';
dotenv.config();
import { pool } from './db.js';
import { indexNote, chunkText } from './services/rag.js';

async function reindex() {
  console.log('\n🔍 Re-indexing course notes into chunks...\n');

  // Delete existing chunks so we start fresh
  const [del] = await pool.execute('DELETE FROM chunks');
  console.log(`Cleared ${del.affectedRows} existing chunks.`);

  // Get all notes
  const [notes] = await pool.execute(
    'SELECT id, course_id, title, content FROM notes WHERE content IS NOT NULL AND content != ""'
  );
  console.log(`Found ${notes.length} notes to index.\n`);

  let total = 0;
  for (const note of notes) {
    console.log(`📄 Indexing: "${note.title}" (note id=${note.id}, course id=${note.course_id})`);
    try {
      const count = await indexNote(note.id, note.course_id, note.content);
      console.log(`   ✅ ${count} chunks stored`);
      total += count;
    } catch (e) {
      // If embedding fails, store chunks with null embedding for text-search fallback
      const parts = chunkText(note.content);
      let stored = 0;
      for (const part of parts) {
        try {
          await pool.execute(
            'INSERT INTO chunks(note_id,course_id,chunk_text,embedding) VALUES(?,?,?,?)',
            [note.id, note.course_id, part, null]
          );
          stored++;
        } catch { /* ignore */ }
      }
      console.log(`   ⚠️  Embedding unavailable — stored ${stored} text-only chunks`);
      total += stored;
    }
  }

  console.log(`\n✅ Done! ${total} total chunks indexed across ${notes.length} notes.\n`);
  process.exit(0);
}

reindex().catch(e => { console.error('Error:', e.message); process.exit(1); });
