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
