import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import booksRoute from "./routes/booksRoute.js";
import userRoute from "./routes/userRoute.js";

dotenv.config();

const app = express();
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: [
    "https://client-filli-cgnx.vercel.app",
    "https://client-filli.vercel.app",
    "http://localhost:5173",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Add headers middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Credentials", true);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.get("/", (req, res) =>
  res.status(200).send("Welcome to MERN Stack Tutorial!")
);
app.use("/books", booksRoute);
app.use("/user", userRoute);

mongoose
  .connect(process.env.MONGO_DB_URL)
  .then(() => {
    console.log("Connected to database");
    app.listen(process.env.PORT || 5555, () => {
      console.log(`Server running on port ${process.env.PORT || 5555}`);
    });
  })
  .catch((error) => console.error("Database connection error:", error.message));
