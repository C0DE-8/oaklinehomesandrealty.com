require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const db = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const listingRoutes = require("./routes/listings");
const leadRoutes = require("./routes/leads");
const adminProfileRoutes = require("./routes/admin.profile");
const adminListingRoutes = require("./routes/admin.listings");
const adminAgentRoutes = require("./routes/admin.agents");
const adminLeadRoutes = require("./routes/admin.leads");

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
app.use("/api/listings", listingRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/admin/profile", adminProfileRoutes);
app.use("/api/admin/listings", adminListingRoutes);
app.use("/api/admin/agents", adminAgentRoutes);
app.use("/api/admin/leads", adminLeadRoutes);

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
