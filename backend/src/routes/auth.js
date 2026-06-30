import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { asyncHandler } from "../controllers/crudController.js";

const router = Router();

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "7d",
  });
}

function publicUser(u) {
  return { id: u._id, name: u.name, email: u.email, role: u.role, avatar: u.avatar };
}

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
    res.json({ token: signToken(user), user: publicUser(user) });
  })
);

router.get(
  "/me",
  protect,
  asyncHandler(async (req, res) => {
    res.json({ user: publicUser(req.user) });
  })
);

export default router;
