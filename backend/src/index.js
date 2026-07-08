import "dotenv/config";
import { connectDB } from "./config/db.js";
import app from "./app.js";
import { startReminderScheduler } from "./services/scheduler.js";

const PORT = process.env.PORT || 1478;

connectDB()
  .then(() => {
    startReminderScheduler();
    app.listen(PORT, () => console.log(`[server] running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("[server] failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
