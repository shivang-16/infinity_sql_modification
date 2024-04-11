import { Post } from "../models/postModel.js";
import { User } from "../models/userModel.js";
import { Notification } from "../models/notificationModel.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "cloudinary";
import { cacheTime } from "../middlewares/redis.js";
import redisClient from "../utils/redisClient.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const createPost = async (req, res, next) => {
  try {
    const { caption } = req.body;

    // Check if a file is provided in the request
    let image = null;
    if (req.file) {
      const file = req.file;

      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "Maximum file size is 10 MB.",
        });
      }

      const fileUri = getDataUri(file);

      const myCloud = await cloudinary.v2.uploader.upload(fileUri.content, {
        folder: "posts",
      });

      image = {
        create: {
          publicId: myCloud.public_id,
          url: myCloud.secure_url,
        },
      };
    }

    const post = await prisma.post.create({
      data: {
        caption,
        image: image,
        owner: {
          connect: { id: req.user.id }, // Assuming user is authenticated
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Post added successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllPost = async (req, res, next) => {
  try {
    const post = await prisma.post.findMany({
      include: {
        owner: true, 
        likes: true, 
        comments: {
          include: {
            user: true, 
          },
        },
        image: {
          select: {
            url: true, 
          },
        },
      },
    });


    res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPostbyId = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        owner: true,
        likes: true,
        comments: {
          include: { user: true },
        },
      },
    });

    if (!post) {
      return res.status(400).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPostofFollowings = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { following: true },
    });

    const posts = await prisma.post.findMany({
      where: {
        ownerId: { in: user.following.map((user) => user.id) },
      },
      include: {
        owner: true,
        likes: true,
        comments: {
          include: { user: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      posts: posts.reverse(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const editPost = async (req, res, next) => {
  try {
    const postId = parseInt(req.params.id);
    const { caption } = req.body;

    const post = await prisma.post.update({
      where: { id: postId },
      data: { caption },
    });

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const postId = parseInt(req.params.id);

    // Assuming cloudinary or any other image service logic for deletion
    // Delete the image if exists

    await prisma.post.delete({
      where: { id: postId },
    });

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const likes = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(400).json({
        success: false,
        message: "Bad request",
      });
    }

    let user = await User.findById(req.user._id);
    let notification;
    // Check if the user ID is in the post.likes array
    const isLiked = post.likes.includes(user._id.toString());

    if (isLiked) {
      // User has already liked the post, so remove their ID
      post.likes = post.likes.filter(
        (likedUserId) => likedUserId.toString() !== user._id.toString(),
      );
    } else {
      // User has not liked the post, so add their ID
      post.likes.unshift(user._id);
      notification = await Notification.create({
        receiver: post.owner,
        sender: req.user,
        refPost: post,
        tag: "Liked",
        message: "Liked the post",
      });
    }

    await post.save();

    try {
      await redisClient.del('/allposts', '/me/posts', '/following');
    } catch (redisError) {
      console.error('Failed to cache data in Redis:', redisError);
    }
 

    res.status(200).json({
      success: true,
      message: isLiked ? "Post unliked" : "Post liked",
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const bookmarks = async (req, res, next) => {
  try {
    let bookmarkedPost = await Post.findById(req.params.id);
    if (!bookmarkedPost) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    let notification;
    let user = await User.findById(req.user._id);
    const isBookmarked = user.bookmarks.includes(bookmarkedPost._id.toString());
    if (isBookmarked) {
      user.bookmarks = user.bookmarks.filter((bookmarkedPostid) => {
        bookmarkedPostid.toString() !== user._id.toString();
      });
    } else {
      user.bookmarks.unshift(bookmarkedPost._id);
      notification = await Notification.create({
        user: bookmarkedPost.owner,
        sender: req.user,
        refPost: bookmarkedPost,
        tag: "Bookmark",
        message: "Bookmarked you post",
      });
    }
    await user.save();


    try {
      await redisClient.del('/me/bookmarks');
    } catch (redisError) {
      console.error('Failed to cache data in Redis:', redisError);
    }
 

    res.status(201).json({
      success: true,
      message: isBookmarked ? "Bookmarked remove" : "Post Bookmarked",
      notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const comments = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(400).json({
        success: false,
        message: "Bad request",
      });
    }

    const { comment } = req.body;

    post.comments.unshift({
      user: req.user._id,
      comment,
    });

    const notification = await Notification.create({
      receiver: post.owner,
      sender: req.user,
      refPost: post,
      tag: "Comment",
      message: comment,
    });

    await post.save();

    res.status(200).json({
      success: true,
      message: "Comment added",
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const commentId = req.params.commentId;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(400).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = post.comments.find((c) => c._id.toString() === commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    post.comments.pull({ _id: commentId });

    await post.save();

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
