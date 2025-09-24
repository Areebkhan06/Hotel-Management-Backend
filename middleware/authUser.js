import jwt from "jsonwebtoken";

export const authUser = async (req, res, next) => {
  try {
    let token = req.headers.token; // or req.headers["authorization"] if using Bearer token
    console.log("token",token);
    
    // 1️⃣ Check if token is provided
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not Authorised, Please login again.",
      });
    }

    // 3️⃣ Verify token
    let token_decode;
    try {
      token_decode = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please login again.",
      });
    }

    // 4️⃣ Validate payload structure
    if (!token_decode || !token_decode.id) {
      return res.status(400).json({
        success: false,
        message: "Token payload invalid",
      });
    }
    console.log(token_decode.id);
    

    // ✅ Attach userId to request
    req.body.userId = token_decode.id;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error in authentication middleware",
    });
  }
};
