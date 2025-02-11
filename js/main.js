require('dotenv').config(); // Load environment variables

const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');
const cors = require('cors');
const session = require('express-session');
const multer = require('multer');
const path = require('path');


const storage = multer.memoryStorage(); // Store in memory, not disk
const upload = multer({ storage: storage });


const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set('view engine', 'ejs');

// Session setup for tracking votes
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));


// Petition Schema
const petitionSchema = new mongoose.Schema({
    question: String,
    description: String,
    answers: {
        yes: { type: Number, default: 0 },
        no: { type: Number, default: 0 }
    },
    votedUsers: [{ type: String }], 
    image: String // Store only image filename, not Base64
});

const Petition = mongoose.model('Petition', petitionSchema);

app.get('/index', async (req, res) => {
    try {
        const petitions = await Petition.find();
        res.render('index', { 
            petitionsList: petitions,
            userVotes: req.session.userVotes || {}
        });
    } catch (err) {
        console.error('❌ Error fetching petitions:', err);
        res.status(500).send('Internal Server Error');
    }
});

// ✅ Route: Show new petition form
app.get('/new', (req, res) => {
    res.render('new');
});

function searchPetitions() {
    let input = document.getElementById("searchInput").value.toLowerCase();
    let petitions = document.querySelectorAll(".petition-item");

    petitions.forEach(petition => {
        let title = petition.querySelector(".petition-title").innerText.toLowerCase();
        if (title.includes(input)) {
            petition.style.display = "block";
        } else {
            petition.style.display = "none";
        }
    });
}

// ✅ Route: Create new petition
app.post('/create-petition', upload.single('image'), async (req, res) => {
    const { question, description } = req.body;
    let imageBase64 = '';

    // ✅ Check if a file was uploaded
    if (req.file && req.file.buffer) {
        imageBase64 = req.file.buffer.toString('base64'); // Convert to Base64
    }

    const newPetition = new Petition({
        question,
        description,
        answers: { yes: 0, no: 0 },
        votedUsers: [],
        image: imageBase64 // Store only Base64 data
    });

    try {
        await newPetition.save();
        res.redirect('/index');
    } catch (err) {
        console.error('❌ Error creating petition:', err);
        res.status(500).send('Internal Server Error');
    }
});



// ✅ Route: View single petition
app.get('/petition/:id', async (req, res) => {
    try {
        const petition = await Petition.findById(req.params.id);

        if (!petition) {
            return res.status(404).send("Petition not found");
        }

        res.render('petition', { 
            petition,
            userVoted: req.session.userVotes?.[petition._id] || false
        });
    } catch (err) {
        console.error('❌ Error fetching petition:', err);
        res.status(500).send('Internal Server Error');
    }
});

// ✅ Route: Voting logic
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
        console.error('❌ Error voting:', err);
        res.status(500).send('Internal Server Error');
    }
});

// ✅ Start the server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
