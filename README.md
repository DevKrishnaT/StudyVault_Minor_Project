# StudyVault — AI-Powered Personalized Learning & Collaboration Platform

Minor-project starter implementation based on the supplied PPT.

## Stack (same as PPT)
- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express.js REST API
- Database: MySQL
- Authentication: JWT
- AI: Google Gemini API (pre-trained model; no model training)
- RAG: text chunking + Gemini embeddings + cosine-similarity retrieval (prototype vector index)

## Prerequisites
Node.js 20+, MySQL 8+, Google Gemini API key.

## Run locally
1. Create a MySQL database and load schema:
   ```bash
   mysql -u root -p < backend/schema.sql
   ```
2. Configure backend:
   ```bash
   cd backend
   cp .env.example .env
   # edit DB credentials, JWT_SECRET, GEMINI_API_KEY
   npm install
   npm run dev
   ```
3. Configure frontend in another terminal:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. Open the Vite URL (normally http://localhost:5173). Register a user, then create courses and upload notes.

## Important prototype notes
- Uploaded `.txt` and `.md` files are indexed for RAG. PDF/DOCX parsing is not included in this minor-project starter.
- Embeddings are kept in MySQL as JSON vectors and searched with cosine similarity. This is intentionally simple for a college demo; a dedicated vector database can replace it later.
- The project includes working starter flows for registration/login, courses, notes, AI Q&A grounded in retrieved notes, quiz generation, progress, and discussion posts.
- Configure a valid Gemini API key to use AI endpoints. Never commit `.env`.
- This is an educational prototype, not production-hardened. Add rate limits, validation, virus scanning, refresh-token rotation, and deployment secrets before public deployment.

## Default roles
New registrations default to `student`. For a teacher/admin demo, update the user's `role` in the database after registering:
```sql
UPDATE users SET role='teacher' WHERE email='teacher@example.com';
```
