import { User } from "../models/userModel.js";
import { Post } from "../models/postModel.js";
import { setCookie } from "../utils/features.js";
import { sendMail } from "../middlewares/sendOtp.js";
import bcrypt from "bcrypt";
import cloudinary from "cloudinary";
import getDataUri from "../utils/dataUri.js";
import redisClient from "../utils/redisClient.js";
import { cacheTime } from "../middlewares/redis.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

let OTP, userData
export const register = async (req, res, next) => {
  try {
    const { name, userName, email, password } = req.body;

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({ where: { userName } });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let digits = "0123456789";
    OTP = "";
    for (let i = 0; i < 4; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }

    await sendMail({
      email,
      subject: "Verification code",
      message: `Your verification code to signup is ${OTP}`,
    });
    // Create user object
    userData = {
        name,
        userName,
        email,
        password: hashedPassword,
        avatar: {
          create: {
            publicId: "",
            url: "https://res.cloudinary.com/ddszevvis/image/upload/v1697807048/avatars/Default_Image_oz0haa.png",
          }
        }
    };


    res.status(200).json({
      success: true,
      message: `Otp send Successfully to ${email}`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;

    console.log(userData)
    // Verify OTP
    if (otp !== OTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const newUser = await prisma.user.create({
      data: userData,
    });

    // You may want to clear the OTP after verification
    OTP = "";

    setCookie(newUser, res, "Registered Successfully", 201);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//login to your account
export const login = async (req, res, next) => {
  try {
    const { loginIdentifier, password } = req.body;

    let user;
    if (loginIdentifier.includes("@")) {
      user = await prisma.user.findUnique({ where: { email: loginIdentifier } });
    } else {
      user = await prisma.user.findUnique({ where: { userName: loginIdentifier } });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found - Register first",
      });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    setCookie(user, res, "Login Successfully", 200);

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
//get the profile of logined user
export const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; // Assuming you have the user ID in the request after authentication
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
      }
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Profile fetched",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { name, userName } = req.query;

    const users = await prisma.user.findMany({
      where: {
        // Apply filters based on query parameters
        ...(name && { name: { contains: name, mode: 'insensitive' } }),
        ...(userName && { userName: userName }),
      },
      include: {
      },
      orderBy: { createdAt: 'desc' },
      skip: (req.query.page - 1) * req.query.limit || 0,
      take: parseInt(req.query.limit) || 10,
    });

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "No Users found",
      });
    }

    res.status(200).json({
      success: true,
      users,
      length: users.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const getAllSearched = async (req, res) => {
  try {
    const { name, userName } = req.query;

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: name || '', mode: 'insensitive' } },
          { userName: { contains: userName || '', mode: 'insensitive' } }
        ]
      },
      include: {

      },
      orderBy: { name: 'desc' },
    });

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "No Users found",
      });
    }

    res.status(200).json({
      success: true,
      users,
      length: users.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const logout = (req, res) => {
  res
    .status(200)
    .clearCookie("token")
    .json({
      success: true,
      message: "Logged out Successfully",
    });
};

export const getUserbyID = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {

      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserbyName = async (req, res, next) => {
  try {
    const username = req.params.username;
    const user = await prisma.user.findUnique({
      where: { userName: username },
      include: {

      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { posts: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      posts: user.posts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { bookmarks: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      posts: user.bookmarks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { posts: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      posts: user.posts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};