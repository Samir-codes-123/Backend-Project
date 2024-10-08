import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    ); //db connection
    console.log(
      `\n mongoDB connected DB HOST: ${connectionInstance.connection.host}` //error in console
    );
  } catch (error) {
    console.log("MONGODB connection error", error);
    process.exit(1);
  }
};
export default connectDB;
