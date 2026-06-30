import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import apiRoutes from "./routes/index.js";
import { uploadsDir } from "./routes/uploads.js";
import { notFound, errorHandler } from "./middleware/error.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(",") || "*",
  })
);
app.use(express.json({ limit: "2mb" }));

app.use("/uploads", express.static(uploadsDir));

app.get("/", (req, res) => res.json({ name: "Evident Dental API", status: "ok" }));
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 1478;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("[server] failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
