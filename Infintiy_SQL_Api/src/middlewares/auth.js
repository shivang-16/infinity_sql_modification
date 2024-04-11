import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const isAuthenticated = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(404).json({
        success: false,
        message: "Login to your account first",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);


    const user = await prisma.user.findUnique({ where: { id: decoded._id } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
