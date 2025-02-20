const axios = require("axios");
const cheerio = require("cheerio");
const { MongoClient } = require("mongodb");

const MONGO_URI = "mongodb+srv://everyone:vxtphvFI4fswR32C@cluster0.vsy7m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const DB_NAME = "test";
const COLLECTION_NAME = "nikeProducts";

const BASE_URL = "https://www.nike.com/w/mens-shoes-nik1zy7ok";
const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
};

async function getProductUrls() {
    try {
        const { data } = await axios.get(BASE_URL, { headers: HEADERS });
        const $ = cheerio.load(data);
        let links = [];

        $("a.product-card__link-overlay").each((i, element) => {
            let href = $(element).attr("href");
            if (href.startsWith("http")) {
                links.push(href);
            } else {
                links.push("https://www.nike.com" + href);
            }
        });

        return links;
    } catch (error) {
        console.error("Error fetching product URLs:", error.message);
        return [];
    }
}

async function fetchProductDetails(url) {
    try {
        const { data } = await axios.get(url, { headers: HEADERS });
        const $ = cheerio.load(data);

        const productId = url.split("-").pop().split("/")[0];
        const name = $("h1.nds-text").text().trim() || "Unknown Product";
        const brand = $("span.nike-sku").text().trim() || "Nike";
        const price = $("span.nds-text").first().text().trim() || "Price not available";

        return { id: productId, name, brand, price, url };
    } catch (error) {
        console.error(`Error fetching details for ${url}:`, error.message);
        return { error: error.message, url };
    }
}

async function saveToMongo(data) {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        const result = await collection.insertMany(data);
        console.log(`${result.insertedCount} products inserted into MongoDB.`);
    } catch (error) {
        console.error("Error saving to MongoDB:", error.message);
    } finally {
        await client.close();
    }
}

async function main() {
    console.log("Fetching product URLs...");
    const productUrls = await getProductUrls();
    console.log(`Found ${productUrls.length} products.`);

    let allData = [];
    for (let [index, url] of productUrls.entries()) {
        console.log(`Processing ${index + 1}/${productUrls.length}: ${url}`);
        const details = await fetchProductDetails(url);
        allData.push(details);
        await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000)); // Avoid getting blocked
    }

    console.log("Saving data to MongoDB...");
    await saveToMongo(allData);
    console.log("Process completed!");
}

main().catch(console.error);
