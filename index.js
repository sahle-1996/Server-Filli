import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import booksRoute from "./routes/booksRoute.js";
import userRoute from "./routes/userRoute.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["https://client-filli-cgnx.vercel.app", "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
