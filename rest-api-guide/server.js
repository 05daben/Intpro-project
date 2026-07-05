const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Enable CORS and JSON Parsing middleware
app.use(cors());
app.use(express.json());

// In-memory Database
let books = [
  { id: 1, title: "1984", author: "George Orwell", year: 1949 },
  { id: 2, title: "To Kill a Mockingbird", author: "Harper Lee", year: 1960 }
];
let nextId = 3;

// --- CRUD ENDPOINTS ---

// 1. READ: Get all books
app.get('/api/books', (req, res) => {
  console.log(`[GET] /api/books - Fetching all books`);
  res.status(200).json(books);
});

// 2. READ: Get a specific book by ID
app.get('/api/books/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  console.log(`[GET] /api/books/${id} - Fetching book`);
  
  const book = books.find(b => b.id === id);
  if (!book) {
    return res.status(404).json({ error: `Book with ID ${id} not found.` });
  }
  res.status(200).json(book);
});

// 3. CREATE: Add a new book
app.post('/api/books', (req, res) => {
  const { title, author, year } = req.body;
  console.log(`[POST] /api/books - Creating new book: "${title}"`);

  // Basic Validation
  if (!title || !author) {
    return res.status(400).json({ error: "Validation Failed: 'title' and 'author' are required fields." });
  }

  const newBook = {
    id: nextId++,
    title,
    author,
    year: year || "Unknown"
  };

  books.push(newBook);
  res.status(201).json(newBook);
});

// 4. UPDATE: Modify an existing book
app.put('/api/books/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { title, author, year } = req.body;
  console.log(`[PUT] /api/books/${id} - Updating book: "${title}"`);

  const bookIndex = books.findIndex(b => b.id === id);
  if (bookIndex === -1) {
    return res.status(404).json({ error: `Book with ID ${id} not found.` });
  }

  // Validation
  if (!title || !author) {
    return res.status(400).json({ error: "Validation Failed: 'title' and 'author' are required fields." });
  }

  books[bookIndex] = {
    id,
    title,
    author,
    year: year || books[bookIndex].year
  };

  res.status(200).json(books[bookIndex]);
});

// 5. DELETE: Remove a book by ID
app.delete('/api/books/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  console.log(`[DELETE] /api/books/${id} - Deleting book`);

  const bookIndex = books.findIndex(b => b.id === id);
  if (bookIndex === -1) {
    return res.status(404).json({ error: `Book with ID ${id} not found.` });
  }

  books.splice(bookIndex, 1);
  res.status(204).send(); // 204 No Content
});

// Start Server
app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(` Node.js CRUD API Live at http://localhost:${PORT}`);
  console.log(` Endpoint: http://localhost:${PORT}/api/books`);
  console.log(`=============================================`);
});
