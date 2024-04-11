import express from "express";

import {
  register,
  login,
  logout,
  getAllUsers,
  getMyProfile,
  verifyOtp,
  getUserbyID,
  getMyPosts,
  getUserPosts,
  getMyBookmarks,
  getAllSearched,
  getUserbyName,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";
import singleUpload from "../middlewares/multer.js";
import cacheMiddleware from "../middlewares/redis.js";

const router = express.Router();

router.post("/register", singleUpload, register);
router.post("/verify", verifyOtp);
router.post("/login", login);
router.get("/myProfile", isAuthenticated, getMyProfile);
router.get("/logout", logout);
router.get("/allusers", getAllUsers);
router.get("/search", getAllSearched);
router.post("/:id", getUserbyID);
router.get("/:username", getUserbyName);
router.route("/me/posts").get(isAuthenticated, cacheMiddleware, getMyPosts);
router.route("/me/bookmarks").get(isAuthenticated, cacheMiddleware, getMyBookmarks);
router.route("/posts/:id").get(isAuthenticated, getUserPosts);

export default router;
