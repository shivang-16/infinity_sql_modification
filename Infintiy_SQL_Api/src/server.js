import { app } from "./app.js";
import { connectToDB } from "./data/database.js";
import cloudinary from "cloudinary";
import { connectToRedis } from "./utils/redisClient.js";

const port = process.env.PORT || 4000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// connectToDB();

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
