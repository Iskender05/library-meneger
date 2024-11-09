document.addEventListener('DOMContentLoaded', () => {
    // Подтверждение удаления книги
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', (e) => {
            const dialog = document.getElementById('confirmDialog');
            const confirmButton = document.getElementById('confirmDelete');
            dialog.showModal();
            confirmButton.onclick = () => {
                fetch(`/books/delete/${button.dataset.id}`, { method: 'POST' })
                    .then(() => window.location.reload());
                dialog.close();
            };
        });
    });

    // AJAX фильтрация
    document.getElementById('filterAvailable').addEventListener('click', () => filterBooks(true, false));
    document.getElementById('filterOverdue').addEventListener('click', () => filterBooks(false, true));

    function filterBooks(available, overdue) {
        fetch(`/books/filter?available=${available}&overdue=${overdue}`)
            .then(response => response.json())
            .then(books => {
                const bookList = document.querySelector('.book-list');
                bookList.innerHTML = '';
                books.forEach(book => {
                    // Code to render each filtered book in bookList
                });
            });
    }
});
