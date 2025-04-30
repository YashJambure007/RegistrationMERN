const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const UserModel = require("./models/User");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

const PORT = process.env.PORT || 3000;

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["POST", "GET"],
    credentials: true,
  })
);
app.use(cookieParser());

// Debug MongoDB URI
console.log("Mongo URI:", process.env.MONGO_URI);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware to verify admin user
const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json("Token is Missing");
  }
  jwt.verify(token, "jwt-secret-key", (err, decoded) => {
    if (err) return res.json("Error with Token");
    if (decoded.role === "admin") {
      next();
    } else {
      return res.json("not admin");
    }
  });
};

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
        .catch((err) => res.json(err));
    })
    .catch((err) => res.json(err));
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  UserModel.findOne({ email }).then((user) => {
    if (!user) return res.json("No Record existed");

    bcrypt.compare(password, user.password, (err, response) => {
      if (response) {
        const token = jwt.sign(
          { email: user.email, role: user.role },
          "jwt-secret-key",
          { expiresIn: "1d" }
        );
        res.cookie("token", token);
        return res.json({ Status: "Success", role: user.role });
      } else {
        return res.json("The password is incorrect");
      }
    });
  });
});

app.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  UserModel.findOne({ email }).then((user) => {
    if (!user) return res.send({ Status: "User not existed" });

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

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Password Link",
      text: `http://localhost:5173/reset_password/${user._id}/${token}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.send({ Status: "Failed to send email" });
      } else {
        return res.send({ Status: "Success" });
      }
    });
  });
});

app.post("/reset-password/:id/:token", (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  jwt.verify(token, "jwt_secret_key", (err) => {
    if (err) return res.json({ Status: "Error with token" });

    bcrypt
      .hash(password, 10)
      .then((hash) => {
        UserModel.findByIdAndUpdate({ _id: id }, { password: hash })
          .then(() => res.send({ Status: "Success" }))
          .catch((err) => res.send({ Status: err }));
      })
      .catch((err) => res.send({ Status: err }));
  });
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
