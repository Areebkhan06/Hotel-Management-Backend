import mongoose from "mongoose";

const connectDB = async () => {
  mongoose.connection.on("connected", () => {
    console.log("Db Connected");
  });

  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("MongoDB connection established");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};


export default connectDB;