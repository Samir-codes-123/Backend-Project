import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Enable CORS with specific options
app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // Only allow requests from the specified origin
    credentials: true, // Allow credentials such as cookies and authorization headers
  })
);

// Middleware to parse incoming JSON requests, with a limit on the body size (16kb)
app.use(express.json({ limit: "16kb" }));

// Middleware to parse URL-encoded data (e.g., form data), also with a size limit (16kb)
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Serve static files (like HTML, CSS, images) from the "public" folder
app.use(express.static("public"));

// Middleware to parse cookies attached to the request
app.use(cookieParser());

// routes import

import userRouter from "./routes/user.routes.js";
// since router is in other file so dont use get but use middleware using use
app.use("/api/v1/users", userRouter); // standard practice
//after user controll is passed to router
// http://localhost:8000/users/register is routed

export { app };
