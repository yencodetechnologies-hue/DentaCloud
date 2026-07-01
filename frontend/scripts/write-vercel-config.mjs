import { writeFileSync } from "fs";

const backend = (process.env.API_URL || process.env.VITE_API_URL || "")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

const rewrites = [];

if (backend) {
  rewrites.push({ source: "/api/:path*", destination: `${backend}/api/:path*` });
  rewrites.push({ source: "/uploads/:path*", destination: `${backend}/uploads/:path*` });
}

rewrites.push({ source: "/(.*)", destination: "/index.html" });

writeFileSync("vercel.json", JSON.stringify({ rewrites }, null, 2) + "\n");
console.log(
  backend
    ? `[vercel] proxying /api -> ${backend}/api`
    : "[vercel] no API_URL set — /api will 404 until backend is configured"
);
