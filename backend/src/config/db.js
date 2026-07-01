import mongoose from "mongoose";
import dns from "node:dns";

const SRV_DNS_ERROR = /querySrv|ECONNREFUSED|ENOTFOUND|ETIMEOUT|EREFUSED|getaddrinfo/i;

const cache = globalThis.__mongooseCache ?? { conn: null, promise: null };
globalThis.__mongooseCache = cache;

async function connectOnce() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/evident-dental";
  mongoose.set("strictQuery", true);
  const opts = { serverSelectionTimeoutMS: 20000 };

  try {
    await mongoose.connect(uri, opts);
  } catch (err) {
    // mongodb+srv:// needs a DNS SRV lookup which some local/ISP resolvers refuse.
    // Fall back to reliable public DNS servers and retry once.
    if (uri.startsWith("mongodb+srv") && SRV_DNS_ERROR.test(err.message)) {
      console.warn("[db] SRV DNS lookup failed, retrying via public DNS (8.8.8.8, 1.1.1.1)...");
      dns.setServers(["8.8.8.8", "1.1.1.1", ...dns.getServers()]);
      await mongoose.connect(uri, opts);
    } else {
      throw err;
    }
  }

  console.log("[db] connected");
  return mongoose.connection;
}

export async function connectDB() {
  if (cache.conn) return cache.conn;
  if (!cache.promise) cache.promise = connectOnce();
  cache.conn = await cache.promise;
  return cache.conn;
}
