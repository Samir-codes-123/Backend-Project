import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
// require('dotenv').config({path:'./env'})// takes vairable from env

dotenv.config({
  //config in package.json
  path: "./.env",
});
connectDB() // returns promise
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      // listen http request
      console.log(`Server is running at ${process.env.PORT}`);
    });
    app.on("error", (error) => {
      console.log("ERROR: ", error);
    });
  })
  .catch((error) => {
    console.log("MONGO db connection failed !!! ", error);
  });
