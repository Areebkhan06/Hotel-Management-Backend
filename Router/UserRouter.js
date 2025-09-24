import express from "express";
import {
  addToCart,
  allRooms,
  BookingDetails,
  cancelBooking,
  changePassword,
  checkRoomIsAvailableForDates,
  fetchBasedOnUser,
  fetchBookingDetails,
  getCart,
  payAtCheckIn,
  payWithRazorpay,
  registerUser,
  removeFromCart,
  sendOTP,
  userLogin,
  verifyOTP,
  verifyPayment,
} from "../Controller/userController.js";
import { authUser } from "../middleware/authUser.js";

const userRouter = express.Router();

userRouter.get("/rooms", allRooms);
userRouter.post("/login", userLogin);
userRouter.post("/register", registerUser);
userRouter.post("/addtocart", authUser, addToCart);
userRouter.post("/getcart", authUser, getCart);
userRouter.post("/removefromcart", authUser, removeFromCart);
userRouter.post("/checkRoomAvalibility", checkRoomIsAvailableForDates);
userRouter.post("/bookingDetails", authUser, BookingDetails);
userRouter.post("/fetchbookingDetails", authUser, fetchBookingDetails);
userRouter.post("/checkInPayment", authUser, payAtCheckIn);
userRouter.post("/razorpay", authUser, payWithRazorpay);
userRouter.post("/verifyPayment", verifyPayment);
userRouter.post("/Bookings", authUser, fetchBasedOnUser);
userRouter.post("/cancel-booking", authUser,cancelBooking);
userRouter.post("/send-otp", sendOTP);
userRouter.post("/verify-otp", verifyOTP);
userRouter.post("/change-password", changePassword);

export default userRouter;
