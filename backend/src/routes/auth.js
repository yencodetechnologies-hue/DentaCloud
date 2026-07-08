import { Router } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Enterprise from "../models/Enterprise.js";
import Branch from "../models/Branch.js";
import { protect } from "../middleware/auth.js";
import { asyncHandler } from "../controllers/crudController.js";
import { generateUniqueCode } from "../utils/codeGen.js";
import { sendEmail } from "../services/notify.js";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "7d",
  });
}

function refPublic(doc) {
  if (!doc) return null;
  if (typeof doc === "object" && doc.name) {
    return { id: doc._id, name: doc.name };
  }
  return { id: doc, name: "" };
}

function publicUser(u, { branch, enterprise } = {}) {
  const ent = enterprise ?? u.enterprise;
  const br = branch ?? u.branch;
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar,
    accountType: u.accountType,
    enterprise: refPublic(ent),
    branch: refPublic(br),
    linkedRef: u.linkedRef,
    linkedModel: u.linkedModel,
  };
}

async function resolveBranch(user) {
  if (user.branch) return user.branch;
  const enterpriseId = user.enterprise?._id || user.enterprise;
  if (!enterpriseId) return null;
  return Branch.findOne({ enterprise: enterpriseId, status: "active" }).sort({ createdAt: 1 });
}

async function enrichUser(user) {
  const populated = await User.findById(user._id).populate("enterprise branch");
  if (!populated) return user;
  const branch = (await resolveBranch(populated)) || populated.branch;
  return publicUser(populated, { branch, enterprise: populated.enterprise });
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { accountType, clinicName, address, email, phone, password } = req.body;

    if (accountType === "enterprise") {
      return res.status(400).json({ message: "Enterprise registration coming soon" });
    }

    if (!clinicName?.trim()) {
      return res.status(400).json({ message: "Clinic name is required" });
    }
    if (!address?.trim()) {
      return res.status(400).json({ message: "Address is required" });
    }
    if (!email?.trim() || !EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }
    if (!phone?.trim()) {
      return res.status(400).json({ message: "Mobile number is required" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const name = clinicName.trim();
    const code = await generateUniqueCode(name, Enterprise);

    const enterprise = await Enterprise.create({
      name,
      code,
      address: address.trim(),
      phone: phone.trim(),
      email: normalizedEmail,
      status: "active",
    });

    const branch = await Branch.create({
      enterprise: enterprise._id,
      name,
      code,
      address: address.trim(),
      phone: phone.trim(),
      email: normalizedEmail,
      status: "active",
    });

    const initials = name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: "dental-admin",
      accountType: "clinic",
      avatar: initials,
      enterprise: enterprise._id,
      branch: branch._id,
    });

    res.status(201).json({
      token: signToken(user),
      user: publicUser(user, { enterprise, branch }),
    });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.json({ token: signToken(user), user: await enrichUser(user) });
  })
);

router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email?.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      user.resetPasswordToken = hashToken(rawToken);
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      const appUrl = process.env.APP_URL || "http://localhost:5173";
      const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

      const result = await sendEmail({
        to: user.email,
        subject: "Reset your Denta Cloud password",
        text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
        html: `<p>Reset your password by clicking the link below:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p>`,
      });

      if (!result.sent) {
        console.log(`[auth] Password reset link for ${user.email}: ${resetUrl}`);
      }
    }

    res.json({
      message: "If an account exists with that email, a reset link has been sent.",
    });
  })
);

router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Reset token is required" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashed = hashToken(token);
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires +password");

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password updated successfully" });
  })
);

router.get(
  "/me",
  protect,
  asyncHandler(async (req, res) => {
    res.json({ user: await enrichUser(req.user) });
  })
);

export default router;
