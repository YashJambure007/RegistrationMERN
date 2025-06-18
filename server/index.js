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
const jwtSecret = process.env.JWT_SECRET;

const app = express();
app.set("trust proxy", 1);

// Middleware
app.use(express.json());
app.use(cookieParser());

// Rate limiting (5 requests per minute for auth routes)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many requests, please try again later.",
});

//  Allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://registration-mern.vercel.app", // Replace with your actual Vercel domain
];

//  CORS setup
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

app.options("*", cors());

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
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Root route
app.get("/", (req, res) => {
  res.send("API is running");
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware: Verify user
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
app.post("/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json("All fields are required");

    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.create({ name, email, password: hashedPassword, role });
    res.json("Success");
  } catch (err) {
    res.status(500).json(err);
  }
});

// Login route
app.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json("No Record existed");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json("Incorrect password");

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

    res.json({ Status: "Success", role: user.role });
  } catch (err) {
    res.status(500).json(err);
  }
});

// Forgot password
app.post("/forgot-password", authLimiter, async (req, res) => {
  const { email } = req.body;

  const user = await UserModel.findOne({ email });
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

// Reset password
app.post("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  jwt.verify(token, jwtSecret, async (err, decoded) => {
    if (err) return res.status(401).json({ Status: "Invalid or expired token" });

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      await UserModel.findByIdAndUpdate(id, { password: hashedPassword });
      res.json({ Status: "Success" });
    } catch (err) {
      res.status(500).json({ Status: "Error updating password" });
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
