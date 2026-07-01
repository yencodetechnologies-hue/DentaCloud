import { writeFileSync } from "fs";

const backend = (process.env.API_URL || process.env.VITE_API_URL || "")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

const rewrites = [];

if (backend) {
  rewrites.push({ source: "/api/:path*", destination: `${backend}/api/:path*` });
  rewrites.push({ source: "/uploads/:path*", destination: `${backend}/uploads/:path*` });
} else {
  rewrites.push({ source: "/api/:path*", destination: "/api" });
  rewrites.push({ source: "/uploads/:path*", destination: "/api" });
}

rewrites.push({ source: "/(.*)", destination: "/index.html" });

const config = {
  functions: {
    "api/index.js": {
      maxDuration: 30,
      includeFiles: "../backend/src/**",
    },
  },
  rewrites,
};

writeFileSync("vercel.json", JSON.stringify(config, null, 2) + "\n");
console.log(
  backend
    ? `[vercel] proxying /api -> ${backend}/api`
    : "[vercel] using serverless API (set MONGO_URI + JWT_SECRET in Vercel)"
);
