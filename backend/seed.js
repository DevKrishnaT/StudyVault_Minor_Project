/**
 * StudyVault Course Seeder
 * Inserts pre-built catalog courses with full content, then indexes them for AI/Quiz.
 * Run: node seed.js
 */
import dotenv from 'dotenv';
dotenv.config();
import { pool } from './db.js';
import { indexNote } from './services/rag.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── System admin account for catalog content ───
const ADMIN_EMAIL = 'platform@studyvault.ai';
const ADMIN_NAME  = 'StudyVault Platform';

// ═══════════════════════════════════════════════════════════════
//  COURSE DEFINITIONS (metadata + syllabus only)
// ═══════════════════════════════════════════════════════════════
const COURSES = [
  {
    title: 'Data Structures & Algorithms',
    description: 'Master the most important topic for coding interviews and competitive programming. From arrays to graphs, sorting to dynamic programming — fully covered.',
    category: 'Computer Science',
    difficulty: 'Intermediate',
    thumbnail_color: 'purple',
    thumbnail_icon: 'Binary',
    total_hours: 40,
    student_count: 12400,
    rating: 4.8,
    contentFile: 'content/dsa.txt',
    syllabus: [
      { topic: 'Arrays & Strings', subtopics: ['Array manipulation', 'Two-pointer technique', 'Sliding window', 'String reversal & palindromes'], duration: 90, difficulty: 'easy', objectives: 'Understand fundamental array operations and pattern-based problem solving.' },
      { topic: 'Linked Lists', subtopics: ['Singly & doubly linked lists', 'Fast & slow pointers', 'Reversing a linked list', 'Cycle detection (Floyd algorithm)'], duration: 75, difficulty: 'medium', objectives: 'Build and manipulate pointer-based data structures.' },
      { topic: 'Stacks & Queues', subtopics: ['Stack using arrays/linked lists', 'Monotonic stack', 'Queue & Deque', 'Priority Queue (Min/Max Heap)'], duration: 60, difficulty: 'medium', objectives: 'Apply LIFO and FIFO structures to solve real-world problems.' },
      { topic: 'Trees & Binary Search Trees', subtopics: ['Binary tree traversals', 'BST insert/delete/search', 'Height & diameter', 'Level-order traversal (BFS)'], duration: 90, difficulty: 'medium', objectives: 'Understand hierarchical data structures and traversal algorithms.' },
      { topic: 'Graphs', subtopics: ['Graph representation', 'BFS & DFS', 'Topological sort', 'Dijkstra shortest path', 'Union-Find'], duration: 100, difficulty: 'hard', objectives: 'Model and solve network-related problems using graph algorithms.' },
      { topic: 'Dynamic Programming', subtopics: ['Memoization vs tabulation', 'Fibonacci & coin change', '0/1 Knapsack', 'Longest Common Subsequence'], duration: 120, difficulty: 'hard', objectives: 'Break complex problems into overlapping subproblems and solve efficiently.' },
      { topic: 'Sorting & Searching', subtopics: ['Merge sort & Quick sort', 'Binary search patterns', 'Search in rotated arrays'], duration: 75, difficulty: 'medium', objectives: 'Implement and analyze fundamental sorting and searching algorithms.' },
    ],
  },
  {
    title: 'Full-Stack Web Development',
    description: 'Build modern web applications from scratch. Learn HTML, CSS, JavaScript, React, Node.js, and databases. Go from zero to deploying real projects.',
    category: 'Web Development',
    difficulty: 'Beginner',
    thumbnail_color: 'blue',
    thumbnail_icon: 'Globe',
    total_hours: 55,
    student_count: 18900,
    rating: 4.9,
    contentFile: 'content/webdev.txt',
    syllabus: [
      { topic: 'HTML & Semantic Web', subtopics: ['HTML5 elements', 'Forms & validation', 'Semantic tags', 'Accessibility basics'], duration: 60, difficulty: 'easy', objectives: 'Build well-structured, semantic HTML documents.' },
      { topic: 'CSS & Modern Layouts', subtopics: ['Box model & positioning', 'Flexbox', 'CSS Grid', 'Animations & transitions', 'Responsive design'], duration: 90, difficulty: 'easy', objectives: 'Style web pages with modern CSS techniques.' },
      { topic: 'JavaScript Fundamentals', subtopics: ['Variables, types, operators', 'Functions & scope', 'Arrays & objects', 'DOM manipulation', 'Events'], duration: 100, difficulty: 'medium', objectives: 'Write dynamic JavaScript code to manipulate web pages.' },
      { topic: 'Advanced JavaScript & ES6+', subtopics: ['Promises & async/await', 'Arrow functions', 'Destructuring', 'Modules', 'Fetch API & REST'], duration: 80, difficulty: 'medium', objectives: 'Use modern JavaScript features for clean, efficient code.' },
      { topic: 'React.js', subtopics: ['Components & JSX', 'State & Props', 'Hooks (useState, useEffect)', 'React Router', 'Context API'], duration: 110, difficulty: 'medium', objectives: 'Build interactive UI with React component architecture.' },
      { topic: 'Node.js & Express', subtopics: ['Node.js runtime', 'NPM & modules', 'Express server', 'REST API design', 'Middleware'], duration: 90, difficulty: 'intermediate', objectives: 'Create backend servers and REST APIs with Node.js.' },
      { topic: 'Databases & Deployment', subtopics: ['SQL basics (MySQL)', 'MongoDB & Mongoose', 'Authentication with JWT', 'Deployment'], duration: 80, difficulty: 'medium', objectives: 'Persist data and deploy full-stack applications.' },
    ],
  },
  {
    title: 'Python Programming — Zero to Pro',
    description: 'Learn Python from the ground up. Variables, functions, OOP, file handling, web scraping, and data science libraries. The most beginner-friendly language.',
    category: 'Programming',
    difficulty: 'Beginner',
    thumbnail_color: 'teal',
    thumbnail_icon: 'Code',
    total_hours: 30,
    student_count: 22100,
    rating: 4.9,
    contentFile: 'content/python.txt',
    syllabus: [
      { topic: 'Python Basics', subtopics: ['Variables & data types', 'Operators', 'Input/Output', 'Type conversion'], duration: 60, difficulty: 'easy', objectives: 'Write basic Python programs and understand core syntax.' },
      { topic: 'Control Flow', subtopics: ['if/elif/else', 'for loops', 'while loops', 'break/continue/pass'], duration: 55, difficulty: 'easy', objectives: 'Control program execution with conditionals and loops.' },
      { topic: 'Functions & Scope', subtopics: ['Defining functions', 'Arguments & return values', 'Lambda functions', 'Recursion', 'Variable scope'], duration: 70, difficulty: 'medium', objectives: 'Create reusable, modular code with functions.' },
      { topic: 'Data Structures', subtopics: ['Lists & tuples', 'Dictionaries', 'Sets', 'List comprehensions'], duration: 80, difficulty: 'medium', objectives: 'Use Python built-in data structures effectively.' },
      { topic: 'Object-Oriented Programming', subtopics: ['Classes & objects', 'Inheritance', 'Encapsulation', 'Polymorphism', 'Magic methods'], duration: 90, difficulty: 'medium', objectives: 'Design programs using OOP principles in Python.' },
      { topic: 'File Handling & Exceptions', subtopics: ['Reading/writing files', 'CSV & JSON', 'try/except/finally', 'Custom exceptions'], duration: 65, difficulty: 'medium', objectives: 'Handle files and errors gracefully in Python programs.' },
      { topic: 'Libraries & Real Projects', subtopics: ['pip & virtual environments', 'requests', 'pandas basics', 'matplotlib', 'Building a CLI project'], duration: 80, difficulty: 'medium', objectives: 'Use popular Python libraries and build complete projects.' },
    ],
  },
  {
    title: 'Machine Learning & AI Fundamentals',
    description: 'Understand the math and code behind ML. Learn supervised learning, neural networks, model evaluation, and real projects with scikit-learn and TensorFlow.',
    category: 'Artificial Intelligence',
    difficulty: 'Advanced',
    thumbnail_color: 'orange',
    thumbnail_icon: 'Brain',
    total_hours: 45,
    student_count: 9800,
    rating: 4.7,
    contentFile: 'content/ml.txt',
    syllabus: [
      { topic: 'ML Fundamentals', subtopics: ['What is ML?', 'Supervised vs unsupervised', 'Training & test sets', 'Overfitting & underfitting'], duration: 70, difficulty: 'medium', objectives: 'Understand the core concepts and terminology of machine learning.' },
      { topic: 'Linear & Logistic Regression', subtopics: ['Linear regression math', 'Gradient descent', 'Logistic regression', 'Loss functions'], duration: 85, difficulty: 'medium', objectives: 'Implement regression models and understand optimization.' },
      { topic: 'Decision Trees & Ensemble Methods', subtopics: ['Decision trees', 'Random forests', 'Bagging vs boosting', 'XGBoost'], duration: 75, difficulty: 'medium', objectives: 'Build powerful tree-based models for classification and regression.' },
      { topic: 'Neural Networks & Deep Learning', subtopics: ['Perceptrons', 'Backpropagation', 'Activation functions', 'CNNs basics', 'Transfer learning'], duration: 100, difficulty: 'hard', objectives: 'Understand and build neural networks for complex tasks.' },
      { topic: 'Model Evaluation & Tuning', subtopics: ['Accuracy, precision, recall, F1', 'ROC curve & AUC', 'Cross-validation', 'Hyperparameter tuning'], duration: 65, difficulty: 'medium', objectives: 'Properly evaluate and tune machine learning models.' },
      { topic: 'Real ML Projects', subtopics: ['Image classification', 'Sentiment analysis', 'Recommendation systems', 'Deploying ML models'], duration: 90, difficulty: 'hard', objectives: 'Apply ML to solve real-world problems end-to-end.' },
    ],
  },
  {
    title: 'Database Design & SQL',
    description: 'Learn to design efficient databases and write powerful SQL queries. Covers normalization, joins, indexing, stored procedures, and NoSQL introduction.',
    category: 'Databases',
    difficulty: 'Intermediate',
    thumbnail_color: 'green',
    thumbnail_icon: 'Database',
    total_hours: 25,
    student_count: 11200,
    rating: 4.6,
    contentFile: 'content/sql.txt',
    syllabus: [
      { topic: 'Relational Database Concepts', subtopics: ['Tables, rows, columns', 'Primary & foreign keys', 'ACID properties'], duration: 60, difficulty: 'easy', objectives: 'Understand the fundamentals of relational database design.' },
      { topic: 'SQL Queries', subtopics: ['SELECT, WHERE, ORDER BY', 'LIMIT & OFFSET', 'Aggregate functions', 'GROUP BY & HAVING'], duration: 80, difficulty: 'easy', objectives: 'Write SQL queries to retrieve and analyze data.' },
      { topic: 'Joins & Subqueries', subtopics: ['INNER, LEFT, RIGHT JOIN', 'FULL OUTER JOIN', 'Self joins', 'Subqueries', 'CTEs'], duration: 75, difficulty: 'medium', objectives: 'Combine data from multiple tables with joins and subqueries.' },
      { topic: 'Database Normalization', subtopics: ['1NF, 2NF, 3NF, BCNF', 'Functional dependencies', 'Denormalization for performance'], duration: 65, difficulty: 'medium', objectives: 'Design normalized databases to eliminate redundancy.' },
      { topic: 'Indexing & Performance', subtopics: ['B-tree indexes', 'Composite indexes', 'EXPLAIN query plan', 'Query optimization'], duration: 60, difficulty: 'hard', objectives: 'Optimize database performance using proper indexing strategies.' },
    ],
  },
  {
    title: 'System Design & Architecture',
    description: 'Learn to design scalable systems like YouTube, Twitter, and Amazon. Covers load balancing, caching, databases, microservices, and distributed systems.',
    category: 'Computer Science',
    difficulty: 'Advanced',
    thumbnail_color: 'pink',
    thumbnail_icon: 'Server',
    total_hours: 35,
    student_count: 7600,
    rating: 4.8,
    contentFile: 'content/sysdesign.txt',
    syllabus: [
      { topic: 'System Design Fundamentals', subtopics: ['Scalability concepts', 'Vertical vs horizontal scaling', 'CAP theorem', 'Latency vs throughput'], duration: 70, difficulty: 'medium', objectives: 'Understand core principles for designing scalable systems.' },
      { topic: 'Load Balancing & Caching', subtopics: ['Load balancer types', 'Round-robin, weighted', 'CDN basics', 'Redis caching', 'Cache invalidation'], duration: 75, difficulty: 'medium', objectives: 'Apply load balancing and caching to improve performance.' },
      { topic: 'Databases at Scale', subtopics: ['SQL vs NoSQL', 'Sharding', 'Replication', 'Consistent hashing'], duration: 80, difficulty: 'hard', objectives: 'Design database solutions for high-traffic applications.' },
      { topic: 'Microservices & APIs', subtopics: ['Monolith vs microservices', 'API gateway', 'Service discovery', 'Message queues (Kafka)'], duration: 85, difficulty: 'hard', objectives: 'Design distributed systems with microservices architecture.' },
      { topic: 'Designing Real Systems', subtopics: ['URL shortener', 'Feed ranking (Twitter)', 'Video streaming (YouTube)', 'Rate limiting'], duration: 95, difficulty: 'hard', objectives: 'Apply system design principles to real-world case studies.' },
    ],
  },
  {
    title: 'Operating Systems Concepts',
    description: 'Deep dive into how operating systems work. Processes, threads, memory management, file systems, deadlocks, and scheduling — everything CS students need.',
    category: 'Computer Science',
    difficulty: 'Intermediate',
    thumbnail_color: 'indigo',
    thumbnail_icon: 'Cpu',
    total_hours: 32,
    student_count: 8300,
    rating: 4.5,
    contentFile: 'content/os.txt',
    syllabus: [
      { topic: 'Processes & Threads', subtopics: ['Process lifecycle', 'PCB', 'Context switching', 'Threads vs processes'], duration: 75, difficulty: 'medium', objectives: 'Understand process management and threading concepts.' },
      { topic: 'CPU Scheduling', subtopics: ['FCFS, SJF, Round Robin', 'Priority scheduling', 'MLFQ', 'Convoy effect'], duration: 70, difficulty: 'medium', objectives: 'Apply CPU scheduling algorithms and analyze their performance.' },
      { topic: 'Memory Management', subtopics: ['Paging', 'Segmentation', 'Virtual memory', 'Page replacement algorithms', 'TLB'], duration: 80, difficulty: 'hard', objectives: 'Understand how operating systems manage physical and virtual memory.' },
      { topic: 'Synchronization & Deadlocks', subtopics: ['Race conditions', 'Mutex & semaphores', 'Monitors', 'Deadlock conditions', 'Bankers algorithm'], duration: 85, difficulty: 'hard', objectives: 'Handle concurrency problems and prevent deadlocks.' },
      { topic: 'File Systems & I/O', subtopics: ['File system structure', 'Inode', 'FAT, NTFS, ext4', 'Disk scheduling'], duration: 65, difficulty: 'medium', objectives: 'Understand file system design and I/O management.' },
    ],
  },
  {
    title: 'Computer Networks & Security',
    description: 'Understand how the internet works. TCP/IP, DNS, HTTP, routing, firewalls, encryption, and cybersecurity fundamentals for every developer.',
    category: 'Networking',
    difficulty: 'Intermediate',
    thumbnail_color: 'red',
    thumbnail_icon: 'Wifi',
    total_hours: 28,
    student_count: 6900,
    rating: 4.6,
    contentFile: 'content/networks.txt',
    syllabus: [
      { topic: 'Network Models & Protocols', subtopics: ['OSI model (7 layers)', 'TCP/IP model', 'Protocols at each layer', 'Encapsulation'], duration: 70, difficulty: 'medium', objectives: 'Understand network layering and how protocols interact.' },
      { topic: 'TCP & UDP', subtopics: ['TCP handshake', 'Reliability & flow control', 'Congestion control', 'UDP advantages'], duration: 75, difficulty: 'medium', objectives: 'Explain the differences between TCP and UDP and when to use each.' },
      { topic: 'HTTP & Web Protocols', subtopics: ['HTTP/1.1 vs HTTP/2 vs HTTP/3', 'Request/response format', 'Status codes', 'Cookies & sessions', 'REST vs GraphQL'], duration: 80, difficulty: 'medium', objectives: 'Master web protocols used in every web application.' },
      { topic: 'DNS & Routing', subtopics: ['DNS resolution steps', 'Recursive vs iterative', 'IP addressing & CIDR', 'Routing algorithms'], duration: 70, difficulty: 'medium', objectives: 'Trace how domain names resolve and how packets are routed.' },
      { topic: 'Security & Encryption', subtopics: ['Symmetric vs asymmetric encryption', 'TLS/SSL', 'HTTPS', 'SQL injection, XSS, CSRF', 'Firewalls & VPN'], duration: 85, difficulty: 'hard', objectives: 'Apply security principles to protect web applications and networks.' },
    ],
  },
  {
    title: 'JavaScript & TypeScript Advanced',
    description: 'Go beyond the basics. Master closures, prototypes, async patterns, TypeScript, testing, and modern tooling to write professional-grade JavaScript.',
    category: 'Web Development',
    difficulty: 'Advanced',
    thumbnail_color: 'yellow',
    thumbnail_icon: 'Braces',
    total_hours: 35,
    student_count: 13500,
    rating: 4.8,
    contentFile: 'content/js_ts.txt',
    syllabus: [
      { topic: 'JavaScript Deep Dive', subtopics: ['Execution context & call stack', 'Closures', 'Prototypes & prototype chain', 'this keyword', 'Event loop & microtasks'], duration: 90, difficulty: 'hard', objectives: 'Understand JavaScript internals for writing more efficient code.' },
      { topic: 'Asynchronous JavaScript', subtopics: ['Callbacks & callback hell', 'Promises in depth', 'async/await patterns', 'Promise.all, race, allSettled'], duration: 80, difficulty: 'medium', objectives: 'Master all async patterns for reliable asynchronous programming.' },
      { topic: 'TypeScript Fundamentals', subtopics: ['Types & interfaces', 'Generics', 'Union & intersection types', 'Type guards'], duration: 85, difficulty: 'medium', objectives: 'Add static typing to JavaScript with TypeScript.' },
      { topic: 'Modern Patterns & Tools', subtopics: ['Module bundlers (Vite/Webpack)', 'ESLint & Prettier', 'Unit testing (Jest/Vitest)', 'Design patterns'], duration: 75, difficulty: 'medium', objectives: 'Use modern tooling and patterns for production applications.' },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
//  MIGRATION
// ═══════════════════════════════════════════════════════════════
async function migrate() {
  console.log('Setting up database columns...');
  const cols = [
    ["category",       "VARCHAR(80) NOT NULL DEFAULT 'General'"],
    ["difficulty",     "ENUM('Beginner','Intermediate','Advanced') NOT NULL DEFAULT 'Beginner'"],
    ["thumbnail_color","VARCHAR(20) NOT NULL DEFAULT 'purple'"],
    ["thumbnail_icon", "VARCHAR(30) NOT NULL DEFAULT 'BookOpen'"],
    ["total_hours",    "INT NOT NULL DEFAULT 0"],
    ["is_catalog",     "TINYINT(1) NOT NULL DEFAULT 0"],
    ["student_count",  "INT NOT NULL DEFAULT 0"],
    ["rating",         "DECIMAL(3,1) NOT NULL DEFAULT 4.5"],
    ["syllabus",       "JSON NULL"],
  ];

  for (const [col, def] of cols) {
    try {
      await pool.execute(`ALTER TABLE courses ADD COLUMN ${col} ${def}`);
      console.log(`  + Added column: ${col}`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log(`  ~ Already exists: ${col}`);
      } else {
        console.warn(`  ! Warning for ${col}: ${e.message}`);
      }
    }
  }
  console.log('Migration done.\n');
}

// ═══════════════════════════════════════════════════════════════
//  SEEDER
// ═══════════════════════════════════════════════════════════════
async function seed() {
  console.log('\n🌱 StudyVault Course Seeder\n');
  await migrate();

  // Get or create platform admin
  let adminId;
  const [existing] = await pool.execute('SELECT id FROM users WHERE email=?', [ADMIN_EMAIL]);
  if (existing.length) {
    adminId = existing[0].id;
    console.log(`Platform admin exists (id=${adminId})`);
  } else {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.default.hash('StudyVault_Platform_2026!', 12);
    const [r] = await pool.execute(
      "INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,'admin')",
      [ADMIN_NAME, ADMIN_EMAIL, hash]
    );
    adminId = r.insertId;
    console.log(`Created platform admin (id=${adminId})`);
  }

  let seeded = 0;
  let skipped = 0;

  for (const course of COURSES) {
    // Skip if already seeded
    const [ex] = await pool.execute(
      'SELECT id FROM courses WHERE title=? AND created_by=?',
      [course.title, adminId]
    );
    if (ex.length) {
      console.log(`  Skip (exists): ${course.title}`);
      skipped++;
      continue;
    }

    console.log(`\n📚 ${course.title}`);

    // Load content from file
    const contentPath = path.join(__dirname, course.contentFile);
    let content = '';
    try {
      content = readFileSync(contentPath, 'utf8').trim();
    } catch (e) {
      console.warn(`  WARNING: Content file not found: ${contentPath}`);
      content = `Course: ${course.title}\n\n${course.description}\n\n${course.syllabus.map(s => s.topic + ': ' + s.subtopics.join(', ')).join('\n')}`;
    }

    // Insert course
    const [cr] = await pool.execute(
      `INSERT INTO courses(title,description,category,difficulty,thumbnail_color,thumbnail_icon,
       total_hours,is_catalog,student_count,rating,syllabus,created_by)
       VALUES(?,?,?,?,?,?,?,1,?,?,?,?)`,
      [
        course.title, course.description, course.category, course.difficulty,
        course.thumbnail_color, course.thumbnail_icon, course.total_hours,
        course.student_count, course.rating,
        JSON.stringify(course.syllabus), adminId,
      ]
    );
    const courseId = cr.insertId;
    console.log(`  DB id: ${courseId}`);

    // Insert note
    const [nr] = await pool.execute(
      'INSERT INTO notes(course_id,user_id,title,original_name,content) VALUES(?,?,?,?,?)',
      [courseId, adminId, `${course.title} — Complete Notes`, 'course_notes.txt', content]
    );

    // Index for RAG
    try {
      const count = await indexNote(nr.insertId, courseId, content);
      console.log(`  Indexed ${count} chunks for AI`);
    } catch (e) {
      console.warn(`  Indexing skipped (no GEMINI_API_KEY or error): ${e.message}`);
    }

    seeded++;
  }

  console.log(`\n✅ Done: ${seeded} seeded, ${skipped} skipped.\n`);
  process.exit(0);
}

seed().catch(e => { console.error('Seeder error:', e.message); process.exit(1); });
