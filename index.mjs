// index.mjs

import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import axios from 'axios';

// Database connection
const db = new pg.Client({
  user: 'postgres',
  host: 'localhost',
  database: 'book_review',
  password: 'Dpk@1234',
  port: 5432,
});

// Middleware to fetch book data from the PostgreSQL database
const getAllBooks = async (req, res) => {
  try {
    const books = await db.query('SELECT * FROM books ORDER BY date_read DESC');
    res.render('books', { books });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).send('Server error');
  }
};

// Middleware to add a new book
const addBook = async (req, res) => {
  const { title, author, rating, review, date_read, isbn } = req.body;
  
  try {
    // Fetch the cover image from Open Library Covers API
    const coverResponse = await axios.get(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`);
    const cover_url = coverResponse.data ? coverResponse.request.res.responseUrl : 'default_cover_url.jpg';

    const query = `
      INSERT INTO books (title, author, rating, review, date_read, cover_url)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await db.query(query, [title, author, rating, review, date_read, cover_url]);
    res.redirect('/books');
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).send('Server error');
  }
};

// Middleware to update an existing book
const updateBook = async (req, res) => {
  const { title, author, rating, review, date_read, cover_url } = req.body;
  const query = `
    UPDATE books
    SET title = $1, author = $2, rating = $3, review = $4, date_read = $5, cover_url = $6
    WHERE id = $7
  `;
  try {
    await db.query(query, [title, author, rating, review, date_read, cover_url, req.params.id]);
    res.redirect('/books');
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).send('Server error');
  }
};

// Middleware to delete a book
const deleteBook = async (req, res) => {
  const query = 'DELETE FROM books WHERE id = $1';
  try {
    await db.query(query, [req.params.id]);
    res.redirect('/books');
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).send('Server error');
  }
};

// Set up Express.js
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Serve static files
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/books', getAllBooks);
app.post('/books/add', addBook);
app.post('/books/update/:id', updateBook);
app.post('/books/delete/:id', deleteBook);

// Redirect to the main books route
app.get('/', (req, res) => res.redirect('/books'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
