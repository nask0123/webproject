const mongoose = require('mongoose');
const connect = mongoose.connect("mongodb://localhost:27017/login-tut");

connect.then(() =>{ 
    console.log("database connected successfully");
})
.catch(() => {
    console.log("database not connected");
});

const schema = new mongoose.Schema({
    username: {  // Corrected the typo here
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

const collection = mongoose.model("users", schema);
module.exports = collection;
