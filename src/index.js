import dotenv from "dotenv";
import connectDB from "./db/index.js";
// require('dotenv').config({path:'./env'})// takes vairable from env
// semicolon for cleanup purpose

dotenv.config({
  //config in package.json
  path: "./env",
});
connectDB();

// const app = express();
// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`); // db connection
//     app.on("error", (error) => {
//       console.log("ERROR: ", error);
//       throw error;
//     })
//     app.listen(process.env.PORT,()=>{
//         console.log(`App is listening on port ${process.env.PORT}`);

//     })
//   } catch (error) {
//     console.log("ERROR: ", error);
//     throw error;
//   }
// })();
