require("dotenv").config();
const express = require("express")
const mongoose= require("mongoose")
const bcrypt = require("bcryptjs")
const cors = require("cors")
const session = require("express-session");
const multer = require("multer")
const path = require("path")

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
// app.use(cors({
//     origin:
// }))
app.use(express.static("public"));
app.set("view engine", "ejs")