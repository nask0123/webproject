class BookEntity
{
    constructor(title, author, year, genre)
    {
        this.title = title;
        this.author = author,
        this.year = year;
        this.genre = genre;
    }

    getTitle(){
        return this.title;
    }
    getAuthor(){
        return this.author;
    }
    getYear(){
        return this.year;
    }
    getGenre(){
        return this.genre;
    }

    setTitle(title)
    {
        this.title = title;
    }
    setAuthor(author)
    {
        this.author = author;
    }
    setYear(year)
    {
        this.year = year;
    }
    setGenre(genre)
    {
        this.genre = genre;
    }

}
module.exports = BookEntity;