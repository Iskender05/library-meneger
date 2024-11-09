const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

let library = require('./data/library.json');

// Helper function to save changes to the JSON file
const saveLibraryData = () => {
    fs.writeFileSync('./data/library.json', JSON.stringify(library, null, 2));
};

// Routes
app.get('/', (req, res) => {
    res.render('index', { library });
});

app.get('/books/:id', (req, res) => {
    const book = library.find(b => b.id === parseInt(req.params.id));
    if (book) {
        res.render('book', { book });
    } else {
        res.status(404).send('Book not found');
    }
});

app.post('/books/borrow/:id', (req, res) => {
    const book = library.find(b => b.id === parseInt(req.params.id));
    if (book && book.available) {
        book.available = false;
        book.borrower = req.body.borrower;
        book.dueDate = req.body.dueDate;
        saveLibraryData();
        res.redirect('/');
    } else {
        res.status(400).send('Book not available');
    }
});

app.post('/books/return/:id', (req, res) => {
    const book = library.find(b => b.id === parseInt(req.params.id));
    if (book && !book.available) {
        book.available = true;
        book.borrower = null;
        book.dueDate = null;
        saveLibraryData();
        res.redirect('/');
    } else {
        res.status(400).send('Book not borrowed');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const expressSession = require('express-session');

// Добавим настройку Passport для аутентификации
app.use(expressSession({ secret: 'library-secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Стратегия Passport.js
passport.use(new LocalStrategy((username, password, done) => {
    if (username === 'admin' && password === 'password') {
        return done(null, { username: 'admin' });
    }
    return done(null, false);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Маршруты для аутентификации
app.get('/login', (req, res) => res.render('login'));
app.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' }));

// Проверка аутентификации
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

// Добавление книг
app.post('/books/add', ensureAuthenticated, (req, res) => {
    const { title, author, releaseDate } = req.body;
    const newBook = {
        id: library.length + 1,
        title,
        author,
        releaseDate,
        available: true,
        borrower: null,
        dueDate: null
    };
    library.push(newBook);
    saveLibraryData();
    res.redirect('/');
});

// Удаление книг с подтверждением
app.post('/books/delete/:id', ensureAuthenticated, (req, res) => {
    const bookId = parseInt(req.params.id);
    library = library.filter(book => book.id !== bookId);
    saveLibraryData();
    res.redirect('/');
});

// Фильтрация с использованием AJAX
app.get('/books/filter', (req, res) => {
    const { available, overdue } = req.query;
    let filteredBooks = library;
    if (available) {
        filteredBooks = filteredBooks.filter(book => book.available === (available === 'true'));
    }
    if (overdue) {
        const today = new Date();
        filteredBooks = filteredBooks.filter(book => !book.available && new Date(book.dueDate) < today);
    }
    res.json(filteredBooks);
});

