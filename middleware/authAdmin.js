import jwt from "jsonwebtoken";

const AdminAuth = async(req, res, next) => {
  try {
    const token = req.headers.token; // direct token from header    
    if (!token) {
      return res.json({
        success: false,
        message: "Not Authorised, login again",
      });
    }

    // Verify the token
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the role is admin
    if (token_decode.role !== "admin") {
      return res.json({
        success: false,
        message: "Not Authorised, login again",
      });
    }

    req.admin = token_decode;
    next();
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Invalid or expired token" });
  }
};

export default AdminAuth;
