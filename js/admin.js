const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");
const User = require("../models/User");
const Product = require("../models/Product");
const Petition = require("../models/Petition");

// 🏠 Admin Dashboard
router.get("/", requireAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalPetitions = await Petition.countDocuments();

        res.render("admin/dashboard", { totalUsers, totalProducts, totalOrders, totalPetitions });
    } catch (error) {
        console.error("❌ Admin Panel Error:", error);
        res.status(500).send("Server Error");
    }
});

// 🛍 Manage Products
router.get("/products", requireAdmin, async (req, res) => {
    const products = await Product.find();
    res.render("admin/products", { products });
});

router.post("/products/add", requireAdmin, async (req, res) => {
    const { name, price, stock } = req.body;
    await Product.create({ name, price, stock });
    res.redirect("/admin/products");
});

// ✏️ Manage Petitions
router.get("/petitions", requireAdmin, async (req, res) => {
    const petitions = await Petition.find();
    res.render("admin/petitions", { petitions });
});

router.delete("/petitions/:id", requireAdmin, async (req, res) => {
    await Petition.findByIdAndDelete(req.params.id);
    res.redirect("/admin/petitions");
});

module.exports = router;
