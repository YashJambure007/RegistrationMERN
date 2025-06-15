const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const UserModel = require("./models/User");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");


dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();
app.set("trust proxy", 1); 

// Middleware
app.use(express.json());
app.use(cookieParser());

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many requests, please try again later.",
});

// Allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://registration-project-mern.vercel.app",
];

// CORS setup
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Handle preflight OPTIONS requests
app.options("*", cors());

// Manual CORS headers (for some legacy support)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Root
app.get("/", (req, res) => {
  res.send("API is running");
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// JWT secret
const jwtSecret = process.env.JWT_SECRET || "your-default-jwt-secret";

// Verify user middleware
const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json("Token is missing");

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) return res.status(403).json("Invalid token");
    if (decoded.role === "admin") next();
    else return res.status(403).json("Not authorized");
  });
};

// Protected route
app.get("/dashboard", verifyUser, (req, res) => {
  res.json("Success");
});

// Register route
app.post("/register", authLimiter, (req, res) => {
  const { name, email, password } = req.body;
  bcrypt
    .hash(password, 10)
    .then((hash) => {
      UserModel.create({ name, email, password: hash, role })
        .then(() => res.json("Success"))
        .catch((err) => res.status(500).json(err));
    })
    .catch((err) => res.status(500).json(err));
});

// Login route
app.post("/login", authLimiter, (req, res) => {
  const { email, password } = req.body;
  UserModel.findOne({ email }).then((user) => {
    if (!user) return res.status(404).json("No Record existed");

    bcrypt.compare(password, user.password, (err, response) => {
      if (response) {
        const token = jwt.sign(
          { email: user.email, role: user.role },
          jwtSecret,
          { expiresIn: "1d" }
        );
        res.cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "None",
        });
        return res.json({ Status: "Success", role: user.role });
      } else {
        return res.status(401).json("The password is incorrect");
      }
    });
  });
});

// Forgot password
app.post("/forgot-password", authLimiter, (req, res) => {
  const { email } = req.body;
  UserModel.findOne({ email }).then((user) => {
    if (!user) return res.status(404).json({ Status: "User not existed" });

    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: "1d" });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset_password/${user._id}/${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Password Link",
      text: `Click to reset: ${resetUrl}`,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error)
        return res.status(500).json({ Status: "Failed to send email" });
      return res.json({ Status: "Success" });
    });
  });
});

// Reset password
app.post("/reset-password/:id/:token", (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  jwt.verify(token, "jwt_secret_key", (err, decoded) => {
    if (err) {
      return res.json({ Status: "Error with token" });
    } else {
      bcrypt
        .hash(password, 10)
        .then((hash) => {
          UserModel.findByIdAndUpdate({ _id: id }, { password: hash })
            .then((u) => res.send({ Status: "Success" }))
            .catch((err) => res.send({ Status: err }));
        })
        .catch((err) => res.send({ Status: err }));
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
