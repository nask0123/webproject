const axios = require('axios');
const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/', (req,res)=>{
    res.sendFile(path.join(__dirname, "../VIEWS/apis/api.html"))
});

router.get('/authors/:author', async(req, res) =>{
    const author = req.params.author;
    try{
        responce = await axios.get(`https://openlibrary.org/search/authors.json?q=${author}`);
        docs = responce.data.docs;
        const first = docs[0];
        const second = docs[1];
        const third = docs[2];
        let result = {first:{name: first.name, date:first.date, topWork:first.top_work},
                      second:{name: second.name, date:second.date, topWork:second.top_work},
                      third:{name: third.name, date:third.date, topWork:third.top_work}};
        res.status(200).json(result);
    }catch(err)
    {
        return err;
    }
});

module.exports = router;