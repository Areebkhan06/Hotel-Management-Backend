import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/Database.js";
import userRouter from "./Router/UserRouter.js";
import AdminRouter from "./Router/AdminRouter.js";
import compression from "compression";
import helmet from "helmet";

// Load environment variables
dotenv.config();

// Create app
const app = express();

// Middleware
app.use(express.json());
app.use(compression());
app.use(helmet());

app.use(
  cors({
    origin:"https://thetranshotel.vercel.app", // fallback if not set
    credentials: true,
  })
);

// Routes
app.use("/api/user", userRouter);
app.use("/api/admin", AdminRouter);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start server only after DB connection
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to DB", err);
    process.exit(1);
  }
};

startServer();
