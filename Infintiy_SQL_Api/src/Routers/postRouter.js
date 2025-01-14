import express from "express";
import {
  createPost,
  bookmarks,
  getAllPost,
  editPost,
  deletePost,
  likes,
  comments,
  deleteComment,
  getPostbyId,
  getPostofFollowings,
} from "../controllers/postController.js";
import { isAuthenticated } from "../middlewares/auth.js";
import singleUpload from "../middlewares/multer.js";
import cacheMiddleware from "../middlewares/redis.js";

const router = express.Router();

router.post("/create", isAuthenticated, singleUpload, createPost);
router.get("/allposts", getAllPost);
router.get("/following", isAuthenticated, cacheMiddleware, getPostofFollowings);
router
  .route("/:id")
  .get(getPostbyId)
  .patch(isAuthenticated, editPost)
  .delete(isAuthenticated, deletePost);

router.route("/bookmark/:id").get(isAuthenticated, bookmarks);
router.route("/likes/:id").get(isAuthenticated, likes);
router.route("/comments/:id").post(isAuthenticated, comments);

router.delete("/:postId/comments/:commentId", isAuthenticated, deleteComment);

export default router;
