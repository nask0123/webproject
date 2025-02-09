require('dotenv').config(); // Загрузка переменных окружения

const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');
const cors = require('cors');
const session = require('express-session');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set('view engine', 'ejs');

// Настройка сессии для отслеживания голосов пользователей
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// Подключение к MongoDB
mongoose.connect("mongodb://localhost:27017/petition", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB Connection Error', err));

// Модель петиции
const petitionSchema = new mongoose.Schema({
    question: String,
    description: { type: String, default: "No description available" }, // Добавлен default
    answers: {
        yes: { type: Number, default: 0 },
        no: { type: Number, default: 0 }
    },
    votedUsers: [{ type: String }]
});


const Petition = mongoose.model('Petition', petitionSchema);

// 📌 Главная страница со списком петиций
app.get('/index', async (req, res) => {
    try {
        const petitions = await Petition.find();
        res.render('index', { 
            petitionsList: petitions,
            userVotes: req.session.userVotes || {}
        });
    } catch (err) {
        console.error('Error fetching petitions:', err);
        res.status(500).send('Internal Server Error');
    }
});

// 📌 Форма для создания новой петиции
app.get('/new', (req, res) => {
    res.render('new');
});

// 📌 Создание новой петиции
app.post('/create-petition', async (req, res) => {
    const { question, description } = req.body;

    const newPetition = new Petition({
        question,
        description, 
        answers: { yes: 0, no: 0 },
        votedUsers: []
    });

    try {
        await newPetition.save();
        res.redirect(`/petition/${newPetition._id}`);
    } catch (err) {
        console.error('Error creating petition:', err);
        res.status(500).send('Internal Server Error');
    }
});


// 📌 Страница отдельной петиции
app.get('/petition/:id', async (req, res) => {
    try {
        const petition = await Petition.findById(req.params.id);

        if (!petition) {
            return res.status(404).send("Петиция не найдена");
        }

        res.render('petition', { 
            petition,
            userVoted: req.session.userVotes?.[petition._id] || false
        });
    } catch (err) {
        console.error('Error fetching petition:', err);
        res.status(500).send('Internal Server Error');
    }
});

// 📌 Голосование
app.post('/vote', async (req, res) => {
    const { petitionId, answer } = req.body;
    const userId = req.sessionID;

    if (!['yes', 'no'].includes(answer)) {
        return res.status(400).send('Invalid vote option.');
    }

    try {
        const petition = await Petition.findById(petitionId);

        if (!petition) {
            return res.status(404).send('Petition not found');
        }

        if (petition.votedUsers.includes(userId)) {
            return res.status(403).send('You have already voted on this petition.');
        }

        petition.answers[answer] += 1;
        petition.votedUsers.push(userId);
        await petition.save();

        req.session.userVotes = req.session.userVotes || {};
        req.session.userVotes[petitionId] = true;

        res.redirect(`/petition/${petitionId}`);
    } catch (err) {
        console.error('Error voting:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Запуск сервера
const PORT = 5002;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
