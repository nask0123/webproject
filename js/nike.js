const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
const MONGO_URI = "mongodb+srv://everyone:vxtphvFI4fswR32C@cluster0.vsy7m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DB_NAME = "test";
const COLLECTION_NAME = "nikeProducts";

app.set("view engine", "ejs");

async function fetchProducts() {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const products = await db.collection(COLLECTION_NAME).find().toArray();
    await client.close();
    return products;
}

app.get("/", async (req, res) => {
    const products = await fetchProducts();
    res.render("nike_products", { products });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
