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

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://registration-mern.vercel.app"
    ],
    methods: ["POST", "GET"],
    credentials: true,
  })
);

// Root route to verify deployment
app.get("/", (req, res) => {
  res.send("API is running");
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware to verify admin user
const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json("Token is missing");

  jwt.verify(token, "jwt-secret-key", (err, decoded) => {
    if (err) return res.status(403).json("Invalid token");
    if (decoded.role === "admin") next();
    else return res.status(403).json("Not authorized");
  });
};

// Routes
app.get("/dashboard", verifyUser, (req, res) => {
  res.json("Success");
});

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

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  UserModel.findOne({ email }).then((user) => {
    if (!user) return res.status(404).json("No Record existed");

    bcrypt.compare(password, user.password, (err, response) => {
      if (response) {
        const token = jwt.sign(
          { email: user.email, role: user.role },
          "jwt-secret-key",
          { expiresIn: "1d" }
        );
        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Lax",
        });
        return res.json({ Status: "Success", role: user.role });
      } else {
        return res.status(401).json("The password is incorrect");
      }
    });
  });
});

app.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  UserModel.findOne({ email }).then((user) => {
    if (!user) return res.status(404).json({ Status: "User not existed" });

    const token = jwt.sign({ id: user._id }, "jwt_secret_key", {
      expiresIn: "1d",
    });

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

app.post("/reset-password/:id/:token", (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  jwt.verify(token, "jwt_secret_key", (err) => {
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

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
