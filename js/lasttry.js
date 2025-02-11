const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const session = require("express-session");  // Add this line

const app = express();

// Middleware to parse form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(session({
    secret: 'secret-key',  // Change this in production!
    resave: false,
    saveUninitialized: false, // ✅ Set to false to avoid empty sessions
    cookie: { secure: false, maxAge: 1000 * 60 * 60 } // 1-hour session
}));


// Serve static files from "public" folder
app.use(express.static("public"));

// Set EJS as the view engine
app.set("view engine", "ejs");

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));


// Mongoose Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model("users", userSchema);

// Render Login Page
app.get("/", (req, res) => {
    res.render("login");
});

// Render Signup Page
app.get("/signup", (req, res) => {
    res.render("signup");
});

// Register User
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
        return res.status(400).send('User not found');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).send('Incorrect password');
    }

    req.session.userId = user._id; // ✅ Save user ID in session
    res.redirect('/index'); // ✅ Redirect to index after login
});



// Handle User Signup (POST request)
app.post("/signup", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.send("User already exists. Please choose a different username.");
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save user in the database
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        console.log("User registered:", newUser);

        // Redirect to login after signup
        res.redirect("/");
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).send("Error signing up");
    }
});

// Index Route (protected)
app.get('/index', (req, res) => {
    console.log("🔍 Session Data:", req.session);
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    Petition.find().then(petitions => {
        res.render('index', { 
            petitionsList: petitions,
            userVotes: req.session.userVotes || {} 
        });
    }).catch(err => {
        console.error('❌ Error fetching petitions:', err);
        res.status(500).send('Internal Server Error');
    });
});



// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
