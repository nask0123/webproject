require("dotenv").config(); // Load environment variables

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const methodOverride = require("method-override");

const MONGO_URI = "mongodb+srv://everyone:vxtphvFI4fswR32C@cluster0.vsy7m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DB_NAME = "test";
const COLLECTION_NAME = "nikeProducts";

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: "https://webproject-jdv7.onrender.com", // ✅ Adjust for frontend
    credentials: true
}));
app.use(express.static("public"));
app.use(methodOverride("_method"));

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
    password: { type: String, required: true },
    profileImage: { type: String } // Stores the image as a Base64 string
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
    image: String,
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true } // ✅ Track creator
});

const Petition = mongoose.model("Petition", petitionSchema);

const commentSchema = new mongoose.Schema({
    petitionId: { type: mongoose.Schema.Types.ObjectId, ref: "Petition", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const Comment = mongoose.model("Comment", commentSchema);

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
    if (!req.session.userId) {
        return res.redirect("/login"); // Redirect to login if not authenticated
    }

    try {
        const user = await User.findById(req.session.userId);
        const petitionsList = await Petition.find({}); // Fetch all petitions

        res.render("index", { 
            user: user, 
            petitionsList: petitionsList 
        });

    } catch (error) {
        console.error("❌ Error fetching data for index page:", error);
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
    if (!req.session.userId) {
        return res.status(401).send("Unauthorized");
    }

    const { question, description } = req.body;
    let imageBase64 = req.file ? req.file.buffer.toString("base64") : "";

    const newPetition = new Petition({
        question,
        description,
        answers: { yes: 0, no: 0 },
        votedUsers: [],
        image: imageBase64,
        creator: req.session.userId // ✅ Store the creator's user ID
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

        // Загружаем комментарии по petitionId
        const comments = await Comment.find({ petitionId: petition._id }).populate("userId", "username").sort({ createdAt: -1 });


        res.render("petition", { 
            petition,
            comments, // Передаем комментарии в шаблон
            userVoted: req.session.userVotes?.[petition._id] || false
        });
    } catch (err) {
        console.error("❌ Error fetching petition:", err);
        res.status(500).send("Internal Server Error");
    }
});
app.put("/petition/:id", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).send("Unauthorized");
    }

    try {
        const petition = await Petition.findById(req.params.id);
        if (!petition) return res.status(404).send("Petition not found");

        // ✅ Check if the logged-in user is the petition creator
        if (petition.creator.toString() !== req.session.userId) {
            return res.status(403).send("You can only edit your own petition.");
        }

        // ✅ Update petition fields
        petition.question = req.body.question || petition.question;
        petition.description = req.body.description || petition.description;
        await petition.save();

        res.redirect(`/petition/${petition._id}`); // Redirect to the petition page
    } catch (error) {
        console.error("❌ Error updating petition:", error);
        res.status(500).send("Internal Server Error");
    }
});
app.get("/edit-petition/:id", async (req, res) => {
    if (!req.session.userId) {
        return res.redirect("/"); // Redirect to login if not authenticated
    }

    try {
        const petition = await Petition.findById(req.params.id);
        if (!petition) return res.status(404).send("Petition not found");

        // ✅ Ensure only creator can access edit page
        if (petition.creator.toString() !== req.session.userId) {
            return res.status(403).send("You can only edit your own petition.");
        }

        res.render("edit-petition", { petition }); // Render EJS form
    } catch (error) {
        console.error("❌ Error loading edit page:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.delete("/petition/:id", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).send("Unauthorized");
    }

    try {
        const petition = await Petition.findById(req.params.id);
        if (!petition) return res.status(404).send("Petition not found");

        // ✅ Ensure only the creator can delete
        if (petition.creator.toString() !== req.session.userId) {
            return res.status(403).send("You can only delete your own petition.");
        }

        await Petition.findByIdAndDelete(req.params.id);
        res.redirect("/index"); // Redirect to homepage after deletion
    } catch (error) {
        console.error("❌ Error deleting petition:", error);
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
app.get("/user", async (req, res) => {
    if (!req.session.userId) {
        return res.redirect("/"); // Redirect to login if not authenticated
    }

    try {
        const user = await User.findById(req.session.userId).select("-password");
        if (!user) {
            return res.status(404).send("User not found");
        }

        res.render("user", { user });
    } catch (error) {
        console.error("❌ Error fetching user data:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/upload-profile", upload.single("image"), async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).send("Unauthorized");
    }

    try {
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).send("User not found");
        }

        if (req.file && req.file.buffer) {
            user.profileImage = req.file.buffer.toString("base64"); // Convert image to Base64
        }

        await user.save();
        res.redirect("/user");
    } catch (error) {
        console.error("❌ Error uploading profile picture:", error);
        res.status(500).send("Internal Server Error");
    }
});
app.get("/", (req, res) => {
    res.render("login");
});
app.post("/add-comment", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).send("Unauthorized");
    }

    try {
        const { petitionId, text } = req.body;
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).send("User not found");
        }

        const newComment = new Comment({
            petitionId,
            userId: user._id, // ✅ Передаем userId, а не username
            text
        });

        await newComment.save();
        res.redirect(`/petition/${petitionId}`);

    } catch (err) {
        console.error("❌ Error adding comment:", err);
        res.status(500).send("Internal Server Error");
    }
});


// ✅ Create Comment
app.post("/comment", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).send("Unauthorized");
    }
    
    try {
        const { petitionId, text } = req.body;
        const newComment = new Comment({
            petitionId,
            userId: req.session.userId, // ✅ Гарантируем передачу userId
            text
        });
        await newComment.save();
        res.redirect(`/petition/${petitionId}`);
    } catch (error) {
        console.error("❌ Error adding comment:", error);
        res.status(500).send("Internal Server Error");
    }
});

async function fetchProducts() {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const products = await db.collection(COLLECTION_NAME).find().toArray();
    await client.close();
    return products;
}

// ✅ Route to render Nike products
app.get("/nike_products", async (req, res) => {
    try {
        const products = await fetchProducts();
        res.render("nike_products", { products });
    } catch (error) {
        console.error("❌ Error fetching products:", error);
        res.status(500).send("Internal Server Error");
    }
});
// ✅ Logout Route
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("❌ Logout Error:", err);
            return res.status(500).send("Error logging out");
        }
        res.redirect("/"); // Redirect to login page
    });
});



// ✅ Start Server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// process.env.MONGO_URI
//mongodb://localhost:27017/