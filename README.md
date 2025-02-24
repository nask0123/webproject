Petition Web App

Overview

This project is a web application for creating, managing, and voting on petitions. Users can register, log in, create petitions, vote on them, and leave comments. The application also includes user profile management and image uploads.

Features

User authentication (signup, login, logout)

Create, edit, and delete petitions

Vote on petitions (yes/no options)

Comment on petitions

Profile image upload

View Nike products from a MongoDB collection

Technologies Used

Backend: Node.js, Express.js

Database: MongoDB (Mongoose ODM)

Frontend: EJS (Embedded JavaScript Templates)

Authentication: bcrypt, express-session

File Uploads: multer

Others: dotenv, cors, method-override

Setup Instructions

Clone the repository:

git clone <repository_url>
cd <project_folder>

Install dependencies:
npm install express mongoose bcryptjs cors express-session multer method-override mongodb dotenv

Set up environment variables:

Create a .env file in the root directory.

Add the following variables:

MONGO_URI=<your_mongodb_uri>
PORT=5002

Start the server:
download file open code and in terminal write
node js/start.js or node js/lasttry.js
or just enter to https://webproject-jdv7.onrender.com/index
Access the application at http://localhost:5002

API Endpoints

GET / - Login page

GET /signup - Signup page

POST /signup - Register a new user

POST /login - User login

GET /index - Display all petitions

GET /new - Petition creation form

POST /create-petition - Create a new petition

GET /petition/:id - View petition details

POST /vote - Vote on a petition

POST /comment - Add a comment to a petition

GET /user - User profile page

POST /upload-profile - Upload a profile picture

GET /nike_products - View Nike products

GET /logout - Logout user

Deployment

The application is deployed on Render.
