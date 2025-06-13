const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const UserModel = require("./models/User");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(cookieParser());

// ✅ Correct CORS configuration
app.use(
  cors({
    origin: ["https://registration-project-mern.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// ✅ Allow preflight OPTIONS requests
app.options("*", cors());

// 🌐 Simple route to confirm server is running
app.get("/", (req, res) => {
  res.send("API is running");
});

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ JWT secret
const jwtSecret = process.env.JWT_SECRET || "your-default-jwt-secret";

// ✅ Auth middleware
const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json("Token is missing");

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) return res.status(403).json("Invalid token");
    if (decoded.role === "admin") next();
    else return res.status(403).json("Not authorized");
  });
};

// 🧪 Protected route
app.get("/dashboard", verifyUser, (req, res) => {
  res.json("Success");
});

// 🔐 Register
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  bcrypt
    .hash(password, 10)
    .then((hash) => {
      UserModel.create({ name, email, password: hash })
        .then(() => res.json("Success"))
        .catch((err) => res.status(500).json(err));
    })
    .catch((err) => res.status(500).json(err));
});

// 🔐 Login
app.post("/login", (req, res) => {
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
          secure: true, // for HTTPS
          sameSite: "None", // for cross-origin cookies
        });
        return res.json({ Status: "Success", role: user.role });
      } else {
        return res.status(401).json("The password is incorrect");
      }
    });
  });
});

// 📧 Forgot password
app.post("/forgot-password", (req, res) => {
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
      if (error) return res.status(500).json({ Status: "Failed to send email" });
      return res.json({ Status: "Success" });
    });
  });
});

// 🔒 Reset password
app.post("/reset-password/:id/:token", (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  jwt.verify(token, jwtSecret, (err) => {
    if (err) return res.status(403).json({ Status: "Invalid token" });

    bcrypt
      .hash(password, 10)
      .then((hash) => {
        UserModel.findByIdAndUpdate(id, { password: hash })
          .then(() => res.json({ Status: "Success" }))
          .catch((err) => res.status(500).json({ Status: err }));
      })
      .catch((err) => res.status(500).json({ Status: err }));
  });
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
