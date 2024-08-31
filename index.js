const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cros = require("cors");
require('dotenv').config();

const app = express();
const port = process.env.PORT_NUMBER || 8000;
console.log(port)
const token = process.env.JWT_SECRET || "9167d4aa54f371ff3d8ec16f095ac07c42a806605a6ed0a3ec17736fec6bbd0f5e1bebda30e3a7d5272a76a7eb9ea508d170cf45e5b51fe81c71a1371e0cbbe2"

console.log(token)

app.use(cros());
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/SwiftCart")
    .then(() => console.log("MongoDB Is Connected"))
    .catch((err) => console.log("Error connecting to MongoDB", err));

// User Sign Up Data Schema
const UserData = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    userMobile: { type: Number, required: true },
    alterMobile: { type: Number, required: true },
    userEmail: { type: String, required: true },
    userPassword: { type: String, required: true },
    isAccepted: { type: Boolean, required: true },
    token: { type: String }
});

const SignUp = mongoose.model('create', UserData);

const Products = new mongoose.Schema({

    id: { type: Number, required: true },
    img: { type: String, required: true },
    price: { type: String, required: true },
    discount: { type: String, required: true },
    product_name: { type: String, required: true },
    category: { type: String, required: true },
    desc: { type: String, required: true }

});

const AllProducts = mongoose.model("allproducts", Products)

// Sign-Up Route
app.post("/create", async (req, res) => {
    try {
        // console.log("Received payload:", req.body);
        const { firstName, lastName, userMobile, alterMobile, userEmail, userPassword, isAccepted } = req.body;

        if (!firstName || !lastName || !userMobile || !alterMobile || !userEmail || !userPassword || !isAccepted) {
            return res.status(400).json({ error: "Some Details are Missing Kindly Check Once." });
        };

        // this condition check if user deatils is already present or not by uisng Email and Mobile Number
        const existingUser = await SignUp.findOne({ $or: [{ userEmail: userEmail }, { userMobile: userMobile }] });

        if (existingUser) {
            return res.status(400).json({ error: "User with this email or mobile number already exists." });
        }


        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(userPassword, 10);

        // Generate JWT token
        const token = jwt.sign({ email: userEmail }, "9167d4aa54f371ff3d8ec16f095ac07c42a806605a6ed0a3ec17736fec6bbd0f5e1bebda30e3a7d5272a76a7eb9ea508d170cf45e5b51fe81c71a1371e0cbbe2", { expiresIn: '1h' });

        const newUser = new SignUp({
            firstName,
            lastName,
            userMobile,
            alterMobile,
            userEmail,
            userPassword: hashedPassword,
            isAccepted,
            token
        });

        // const data = SignUp.find({});
        // console.log(data)

        const user = await newUser.save();
        res.status(200).json({
            message: "Data saved successfully",
            user: user
        });
    } catch (err) {
        console.log("Error saving user:", err);
        res.status(400).json({ error: "Something went wrong" });
    }
});


// Login API
// Login API
app.post("/login", async (req, res) => {
    try {
        const { userEmail, userPassword } = req.body;
        console.log("userEmail", userEmail);
        console.log("userPassword", userPassword)


        if (!userEmail || !userPassword) {
            return res.status(400).json({ error: "Email and password are required." });
        }


        const user = await SignUp.findOne({ userEmail });

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const isMatch = await bcrypt.compare(userPassword, user.userPassword);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.userEmail },
            process.env.JWT_SECRET || "9167d4aa54f371ff3d8ec16f095ac07c42a806605a6ed0a3ec17736fec6bbd0f5e1bebda30e3a7d5272a76a7eb9ea508d170cf45e5b51fe81c71a1371e0cbbe2",
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: "Login successful",
            token
        });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});


// get AllProducts form DB;

app.get("/api/products", async (req, res) => {
    try {
        const products = await AllProducts.find({});
        return res.status(200).json(products);
    } catch (err) {
        return res.status(400).json({ error: "Server is busy", details: err });
    }
});



//Listen the Server
app.listen(port, (err) => {
    if (!err) {
        console.log("Server is Running Fine");
    } else {
        console.log("Server is not Running");
    }
});
