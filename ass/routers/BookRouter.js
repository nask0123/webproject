const bookController = require('../controllers/BookController');
const bookEntity = require('../entities/BookEntity');
const express = require('express')
const path = require('path');

const router = express.Router();

router.get('/', (req, res) =>{
    res.sendFile(path.join(__dirname, "../VIEWS/books/read.html"))
});
router.get('/add', (req, res) =>{
    res.sendFile(path.join(__dirname, "../VIEWS/books/create.html"))
});

router.get('/get', async (req, res) =>{
    try
    {
        const books = await bookController.read();
        return res.status(200).json(books);
    }
    catch(err){
        return res.status(500).json({messsage: err});
    }
});

router.post('/post', async (req, res) =>{
    const {title, author, year, genre} = req.body;
    const book = new bookEntity(title, author, year, genre);

    if(!title || ! author || ! year || ! genre)
        {
            return res.status(400).json({message:'All fields are required'});
        }
        
    // if(!Number.isInteger(year))
    // {
    //     return res.status(400).json({message:'Year must be a valid number'});
    // }
    
    try
    {
        await bookController.create(book);
        return res.status(201).json({message:'New Book Added!!!!!!'});
    }
    catch(err)
    {
        return res.status(500).json({messsage: err});
    }
});

router.put('/put/:id', async (req, res) =>
{
    const id = req.params.id;

    const {title, author, year, genre} = req.body;
    const book = new bookEntity(title, author, year, genre);

    if(!title || ! author || ! year || ! genre)
    {
        return res.status(400).json({message:'All fields are required'});
    }
    
    // if(!Number.isInteger(year))
    // {
    //     return res.status(400).json({message:'Year must be a valid number'});
    // }

    console.log(id);
    try{
        let isListUpdated = await bookController.update(id, book);
        if(isListUpdated == -1)
        {
            return res.status(400).json({message:'Not correct id'})
        }
        return res.status(201).json({message:'Update Successful!!!!!!'});
    }
    catch(err) 
    {
        return res.status(500).json({messsage: err});
    }
    
});

router.delete('/delete/:id', async (req,res) =>{
    const id = req.params.id;

    try{
        let isListDeleted = await bookController.delete(id);
        if(isListDeleted == -1)
        {
            return res.status(400).json({message:'Not correct id'})
        }
        return res.status(201).json({message:'Update Successful!!!!!!'});
    }
    catch(err) 
    {
        return res.status(500).json({messsage: err});
    }
    
});

module.exports = router;