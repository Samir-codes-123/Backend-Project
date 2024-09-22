// wrapping function for try catch
export const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
      next(error)
    );
  };
};

// const handler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req,res,next)// execute the function
//   } catch (error) {
//     res.status(error.code || 500).json({
//       // for frontend to get error message in json
//       success: false,
//       message: error.message,
//     });
//   }
// };
