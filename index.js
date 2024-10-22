require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrpyt = require("bcrypt");
const app = express();
const port = 5000;
const db = require("./db");
const jwt = require("jsonwebtoken");

const artistRouter = require("./routes/artistRoutes");
const songRouter = require("./routes/songRoutes");

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use("/artist", artistRouter);
app.use("/song", songRouter);

app.post("/register", async (req, res) => {
    const {first_name, last_name, email, password, phone, dob, gender, address} = req.body;

    if(!first_name || !last_name || !email || !password || !phone || !dob || !gender || !address) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    try {
        const checkQuery = "SELECT * FROM user WHERE email = ? OR phone = ?";
        db.query(checkQuery, [email, phone], async (err, results) => {
            if(err) {
                console.error("Error checking existing user:", err);
                return res.status(500).json({
                    success: false,
                    message: "Database error",
                    error: err
                });
            }

            if (results.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Email or phone number already exists"
                });
            }

            const hashedPassword = await bcrpyt.hash(password, 10);

            const query = "INSERT INTO user (first_name, last_name, email, password, phone, dob, gender, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            db.query(query, [first_name, last_name, email, hashedPassword, phone, dob, gender, address], (err, results) => {
                if (err) {
                    console.error("Error registering user:", err);
                    return res.status(500).json({
                        success: false,
                        message: "Failed to register user"
                    })
                }

                res.status(201).json({
                    success: true,
                    message: "User registered successfully"
                });
            });
        })
    } catch (error) {
        console.error("Error during registration:", error);
        return res.status(500).json({ error: "Server error" });
    }
});

app.post("/login", (req, res) => {
    const {email, password} = req.body;

    if(!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password is required"
        });
    }

    const query = "SELECT * FROM user WHERE email = ?";

    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error("Error fetching user:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to login"
            });
        }

        if(results.length === 0) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            });
        }

        const user = results[0];
        const match = await bcrpyt.compare(password, user.password);

        if(!match) {
            return res.status(400).json({
                success: false,
                message: "Incorrect password"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email },             // Payload (user data)
            process.env.JWT_SECRET,                         // Secret key
            { expiresIn: process.env.JWT_EXPIRATION }       // Token expiration time (1 hour in this case)
        );

        res.status(200).json({
            success: true,
            message: "Login Successful",
            token: token
        });
    })
})

app.get("/check-token", (req, res) => {
    const token = req.headers['authorization'];

    if(!token) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if(err) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        res.status(200).json({
            success: true,
            message: "Authorized"
        });
    });
})

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});