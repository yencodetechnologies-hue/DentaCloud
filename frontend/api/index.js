import "dotenv/config";
import { connectDB } from "../../backend/src/config/db.js";
import app from "../../backend/src/app.js";

const dbReady = connectDB();

export default async function handler(req, res) {
  await dbReady;
  return app(req, res);
}
