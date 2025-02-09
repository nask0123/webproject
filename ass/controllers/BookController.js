const BookEntity = require('../entities/BookEntity')

class BookController
{
    constructor()
    {        
        this.books = [
            new BookEntity("Hitler", "Timothy Zahn", 1991, "Sci-fi"),
            new BookEntity("Stalin", "Miguel de Cervantes", 1605, "Novel"),
            new BookEntity("churchyll", "Leo Tolstoy", 1867, "Historical Novel"),
            new BookEntity("911", "George Orwell", 1949, "Sci-fi"),
            new BookEntity("Ruzvelt", "Jules Verne", 1867, "Adventure")
        ];;
    }

    async create(book)
    {
        this.books.push(book);
    }
    
    async read()
    {
        return this.books;
    }

    async update(id, book)
    {
        id = Number(id);
        
        if(id > this.books.length || id < 1)
        {
            return -1;
        }
        this.books[id-1] = book;
        return 1
    }
    async delete(id)
    {
        id = Number(id);
        if(id >= this.books.length || id < 1)
        {
            return -1;
        }
        this.books.splice(id-1, 1)
        return 1;
    }

}

module.exports = new BookController();