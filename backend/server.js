require("dotenv").config();

const express = require("express");
const cors = require("cors");

const db = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const adminProfileRoutes = require("./routes/admin.profile");

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", async (req, res, next) => {
  try {
    await db.query("SELECT 1");
    return res.json({ status: "ok", database: "connected" });
  } catch (error) {
    return next(error);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin/profile", adminProfileRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? "Server error." : error.message;

  if (statusCode === 500) {
    console.error(error);
  }

  res.status(statusCode).json({ message });
});

app.listen(port, () => {
  console.log(`Real estate backend listening on port ${port}`);
});
