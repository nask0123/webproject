require("dotenv").config(); // Load environment variables

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const session = require("express-session");
const multer = require("multer");
const path = require("path");

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: "https://webproject-jdv7.onrender.com", // ✅ Adjust for frontend
    credentials: true
}));
app.use(express.static("public"));

app.set("view engine", "ejs");

// ✅ Session setup
app.use(session({
    secret: "664ebf1f9c5ff3b89bcab52e2d16729f9a023e829fe1037de7ce0e2c6d6397be",  
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 } // Secure false for localhost
}));

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Mongoose User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model("users", userSchema);

// ✅ Mongoose Petition Schema
const petitionSchema = new mongoose.Schema({
    question: String,
    description: String,
    answers: {
        yes: { type: Number, default: 0 },
        no: { type: Number, default: 0 }
    },
    votedUsers: [{ type: String }],
    image: String
});
const Petition = mongoose.model("Petition", petitionSchema);

// ✅ Render Login Page
app.get("/", (req, res) => {
    res.render("login");
});

// ✅ Render Signup Page
app.get("/signup", (req, res) => {
    res.render("signup");
});

// ✅ Register User
app.post("/signup", async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.send("User already exists. Choose a different username.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        console.log("User registered:", newUser);
        res.redirect("/");
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).send("Error signing up");
    }
});

// ✅ Login User
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.send("Invalid credentials.");
        }

        req.session.userId = user._id;
        console.log("✅ User logged in:", req.session.userId);

        res.redirect("/index");
    } catch (error) {
        console.error("❌ Login error:", error);
        res.status(500).send("Error logging in");
    }
});

// ✅ Protected Index Route
app.get("/index", async (req, res) => {
    console.log("🔍 Checking session:", req.session.userId);

    if (!req.session.userId) {
        return res.redirect("/");
    }

    try {
        const petitions = await Petition.find();
        res.render("index", { 
            petitionsList: petitions,
            userVotes: req.session.userVotes || {} 
        });
    } catch (err) {
        console.error("❌ Error fetching petitions:", err);
        res.status(500).send("Internal Server Error");
    }
});

// ✅ Show Petition Creation Form
app.get("/new", (req, res) => {
    res.render("new");
});

// ✅ Multer setup for image upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ✅ Create New Petition
app.post("/create-petition", upload.single("image"), async (req, res) => {
    const { question, description } = req.body;
    let imageBase64 = "";

    if (req.file && req.file.buffer) {
        imageBase64 = req.file.buffer.toString("base64");
    }

    const newPetition = new Petition({
        question,
        description,
        answers: { yes: 0, no: 0 },
        votedUsers: [],
        image: imageBase64
    });

    try {
        await newPetition.save();
        res.redirect("/index");
    } catch (err) {
        console.error("❌ Error creating petition:", err);
        res.status(500).send("Internal Server Error");
    }
});

// ✅ View Single Petition
app.get("/petition/:id", async (req, res) => {
    try {
        const petition = await Petition.findById(req.params.id);

        if (!petition) {
            return res.status(404).send("Petition not found");
        }

        res.render("petition", { 
            petition,
            userVoted: req.session.userVotes?.[petition._id] || false
        });
    } catch (err) {
        console.error("❌ Error fetching petition:", err);
        res.status(500).send("Internal Server Error");
    }
});

// ✅ Vote on Petition
app.post("/vote", async (req, res) => {
    const { petitionId, answer } = req.body;
    const userId = req.session.userId;

    if (!["yes", "no"].includes(answer)) {
        return res.status(400).send("Invalid vote option.");
    }

    try {
        const petition = await Petition.findById(petitionId);

        if (!petition) {
            return res.status(404).send("Petition not found");
        }

        if (petition.votedUsers.includes(userId)) {
            return res.status(403).send("You have already voted.");
        }

        petition.answers[answer] += 1;
        petition.votedUsers.push(userId);
        await petition.save();

        req.session.userVotes = req.session.userVotes || {};
        req.session.userVotes[petitionId] = true;

        res.redirect(`/petition/${petitionId}`);
    } catch (err) {
        console.error("❌ Error voting:", err);
        res.status(500).send("Internal Server Error");
    }
});

// ✅ Logout Route
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/logout");
    });
});

// ✅ Start Server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
