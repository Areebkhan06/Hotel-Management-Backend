import Hotel from "../Models/hotel.js";
import Order from "../Models/orders.js";
import User from "../Models/user.js";
import Otp from "../Models/otp.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import RazorpayInstance from "../config/razorpay.js";
import crypto from "crypto";
import transporter from "../config/EmailConfig.js";

export const allRooms = async (req, res) => {
  try {
    const rooms = await Hotel.find();
    res.json({ success: true, rooms, cached: false });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log("Incoming data:", req.body);

    // 1. Validate input
    if (!name || !email || !password) {
      return res.json({
        success: false,
        message: "Please fill all the fields",
      });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({
        success: false,
        message: "User already exists",
      });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // 5. Remove password before sending back
    const userData = newUser.toObject();
    delete userData.password;

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);

    return res.json({
      success: true,
      message: "User signup successful",
      user: userData,
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);

    // 1️⃣ Validate input
    if (!email || !password) {
      return res.json({
        success: false,
        message: "Please fill all the blanks",
      });
    }

    // 2️⃣ Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    // 3️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    // 4️⃣ Success
    return res.json({
      success: true,
      message: "Logged in successfully",
      user: {
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { userId, hotelId } = req.body;

    // Validate input
    if (!userId || !hotelId) {
      return res.status(400).json({
        success: false,
        message: "userId and hotelId are required",
      });
    }

    // Check if user exists
    const findUser = await User.findById(userId);
    if (!findUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update cart without overwriting
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { cart: hotelId } }, // use $push if you want duplicates
      { new: true }
    );

    res.json({
      success: true,
      message: "Added to cart",
      cart: updatedUser.cart,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCart = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId).populate("cart");

    console.log(user);

    res.json({ success: true, cart: user.cart });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { userId, hotelId } = req.body;

    await User.findByIdAndUpdate(userId, { $pull: { cart: hotelId } });

    res.json({ success: true, message: "Removed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const checkRoomIsAvailableForDates = async (req, res) => {
  try {
    const { id, checkIn, checkOut } = req.body;

    if (!id || !checkIn || !checkOut) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const overLappingBooking = await Order.find({
      roomDetails: id, // roomDetails stores the ObjectId of Hotel
      checkIn: { $lte: checkOutDate },
      checkOut: { $gte: checkInDate },
      status: { $ne: "cancelled" }, // ignore cancelled
    })
      .populate("roomDetails", "roomNumber type pricePerNight")
      .select("checkIn checkOut status roomDetails")
      .sort({ createdAt: -1 })
      .limit(1);

    if (overLappingBooking.length > 0) {
      return res.json({
        success: true,
        isAvailable: false,
        message: "Room is already booked for these dates ❌",
        bookedDates: overLappingBooking,
      });
    }

    return res.json({
      success: true,
      isAvailable: true,
      message: "Room is available ✅",
      bookedDates: [],
    });
  } catch (error) {
    console.error("Error checking availability:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const BookingDetails = async (req, res) => {
  try {
    console.log(req.body);
    const {
      userId,
      grandTotal,
      checkIn,
      checkOut,
      children,
      guests,
      name,
      email,
      phone,
      roomDetails,
    } = req.body;

    // create and save booking
    const order = await Order.create({
      userId,
      grandTotal,
      checkIn,
      checkOut,
      children,
      guests,
      name,
      email,
      phone,
      roomDetails,
      status: "pending", // 👈 add status field to mark before payment
    });

    res.json({
      success: true,
      message: "Order created successfully",
      order, // send back the booking object
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export const fetchBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res
        .status(400)
        .json({ success: false, message: "Booking ID is required" });
    }

    const order = await Order.findById(bookingId).populate("roomDetails");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    res.json({
      success: true,
      message: "Booking details fetched successfully",
      order,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// pay While checkIn

export const payAtCheckIn = async (req, res) => {
  try {
    const { bookingId } = req.body;
    console.log(bookingId);

    const order = await Order.findByIdAndUpdate(
      bookingId,
      {
        $set: { paymentMethod: "Pay at CheckIn", status: "confirmed" },
      },
      { new: true }
    );

    const {
      email,
      name,
      checkIn,
      checkOut,
      grandTotal: amount,
      guests,
    } = order;

    if (order) {
      // Format amount safely
      const formattedAmount = Number(amount).toLocaleString("en-IN");

      // Format dates nicely
      const formattedCheckIn = new Date(checkIn).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const formattedCheckOut = new Date(checkOut).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      await transporter.sendMail({
        from: '"The TRANS" <arebkhn6@gmail.com>',
        to: email,
        subject: "📌 Booking Confirmed - Pay at Check-In",
        text: `Hello ${name},\n\nYour booking (ID: ${bookingId}) has been successfully confirmed.\n\nYou have chosen to pay at check-in. Please be ready to pay ₹${formattedAmount} at the hotel.\n\nCheck-In Date: ${formattedCheckIn}\nCheck-Out Date: ${formattedCheckOut}\nGuests: ${guests}\n\nWe look forward to hosting you!\n\n- The TRANS Team`,
        html: `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px; margin: auto;">
        <h2 style="color: #2196F3; text-align: center;">📌 Booking Confirmed</h2>
        <p>Hi <b>${name}</b>,</p>
        <p>Your booking has been <b>successfully confirmed</b>. You have selected <b>Pay at Check-In</b>.</p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p><b>Booking ID:</b> ${bookingId}</p>
          <p><b>Amount Due:</b> ₹${formattedAmount} (Pay at Check-In)</p>
          <p><b>Check-In:</b> ${formattedCheckIn}</p>
          <p><b>Check-Out:</b> ${formattedCheckOut}</p>
          <p><b>Guests:</b> ${guests}</p>
        </div>
        
        <p>We’re excited to welcome you at <b>The TRANS</b>. Please make sure to carry a valid ID proof at the time of check-in.</p>
        
        <p>If you have any special requests, reply to this email and we’ll be happy to help.</p>
        
        <hr style="margin: 20px 0;" />
        <p style="font-size: 12px; text-align: center; color: #aaa;">
          © 2025 The TRANS. All rights reserved.
        </p>
      </div>
    `,
      });
    } else {
      res.json({
        success: false,
        message: "Something went Wrong",
      });
    }

    res.json({
      success: true,
      message: "Booking successful",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Pay Online
export const payWithRazorpay = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Validate bookingId
    if (!bookingId) {
      return res
        .status(400)
        .json({ success: false, message: "Booking ID is required" });
    }

    const Booking = await Order.findById(bookingId);

    // Check if booking exists
    if (!Booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    const Amount = Booking.grandTotal;

    // Validate amount
    if (!Amount || Amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid amount" });
    }

    const options = {
      amount: Amount * 100, // Convert INR to paise
      currency: "INR",
      receipt: `receipt_${bookingId}`,
      payment_capture: 1, // Auto-capture payment
    };

    const order = await RazorpayInstance.orders.create(options);

    res.json({
      success: true,
      message: "Razorpay order created successfully",
      order,
      key: process.env.KEY_ID,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // ✅ Generate signature from secret
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZOR_SECRET) // Razorpay secret key
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // ✅ Verified → update order
      const order = await Order.findByIdAndUpdate(
        bookingId,
        {
          $set: {
            paymentMethod: "Razorpay",
            status: "confirmed",
            isPaid: true,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
          },
        },
        { new: true }
      );

      const amount = order.grandTotal;
      const email = order.email;
      const name = order.name;

      await transporter.sendMail({
        from: '"The TRANS" <arebkhn6@gmail.com>',
        to: email,
        subject: "✅ Payment Confirmation - Thank You!",
        text: `Hello ${name},\n\nWe have successfully received your payment of ₹${amount} via Razorpay.\n\nTransaction ID: ${razorpay_payment_id}\nDate: ${new Date().toLocaleString()}\n\nThank you for your purchase.\n\n- The TRANS Team`,
        html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px; margin: auto;">
          <h2 style="color: #4CAF50; text-align: center;">✅ Payment Successful</h2>
          <p>Hi <b>${name}</b>,</p>
          <p>We’re happy to let you know that your payment has been <b>successfully received</b>.</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p><b>Amount Paid:</b> ₹${amount}</p>
            <p><b>Payment ID:</b> ${razorpay_payment_id}</p>
            <p><b>Date:</b> ${new Date().toLocaleString()}</p>
          </div>
          <p>Thank you for trusting <b>The TRANS</b>. Your transaction is safe and secure with Razorpay.</p>
          <p>If you have any questions, feel free to reply to this email.</p>
          <hr style="margin: 20px 0;" />
          <p style="font-size: 12px; text-align: center; color: #aaa;">
            © 2025 The TRANS. All rights reserved.
          </p>
        </div>
      `,
      });

      return res.json({ success: true, message: "Payment verified", order });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }
  } catch (error) {
    console.error("Payment verify error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const fetchBasedOnUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.json({
        success: false,
        message: "Please Login & Create Account",
      });
    }

    const bookings = await Order.find({
      userId,
      $or: [
        { paymentMethod: "Pay at CheckIn" },
        { paymentMethod: "Razorpay", isPaid: true },
      ],
    })
      .populate("roomDetails")
      .sort({ createdAt: -1 });

    console.log(bookings);
    res.json({ success: true, message: "Bookings", bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate otp

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000);
}

export const sendOTP = async (req, res) => {
  const { email } = req.body;
  let otp = String(generateOtp());
  try {
    await Otp.deleteMany({ email });

    const newOtp = new Otp({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await newOtp.save();

    await transporter.sendMail({
      from: '"The TRANS" <arebkhn6@gmail.com>',
      to: email,
      subject: "🔐 Verify Your Email - OTP Code",
      text: `Your One-Time Password (OTP) is ${otp}. It is valid for 5 minutes. Do not share this code with anyone.`,
      html: `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 500px; margin: auto;">
      <h2 style="color: #4CAF50; text-align: center;">🔐 Email Verification</h2>
      <p>Hello,</p>
      <p>Your One-Time Password (OTP) for verification is:</p>
      <h1 style="text-align: center; color: #4CAF50; letter-spacing: 2px;">${otp}</h1>
      <p style="text-align: center; color: #777;">This code will expire in <b>5 minutes</b>.</p>
      <p style="color: #555;">⚠️ Please do not share this code with anyone. If you did not request this, you can safely ignore this email.</p>
      <hr style="margin: 20px 0;" />
      <p style="font-size: 12px; text-align: center; color: #aaa;">© 2025 The TRANS. All rights reserved.</p>
    </div>
  `,
    });

    res.json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error sending OTP" });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp || otp.length === 0) {
      return res.json({ success: false, message: "OTP is required" });
    }

    const enteredOTP = otp.join("");

    const user = await Otp.findOne({
      otp: enteredOTP,
      expiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.json({ success: false, message: "Invalid or expired OTP" });
    }

    // OTP is valid → clear it so it can't be reused
    user.otp = null;
    user.expiresAt = null;
    await user.save();

    console.log(user);

    return res.json({
      success: true,
      message: "OTP verified successfully",
      email: user.email,
    });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const changePassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // update password
    user.password = hashedPassword;
    await user.save();

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const cancelBooking = async (req, res) => {
  const { BookingId } = req.body;
  console.log("cancillation", req.body);

  try {
    const booking = await Order.findById(BookingId).populate("roomDetails");
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    // Update status
    booking.status = "cancelled";
    await booking.save();

    if (booking.email) {
      const mailOptions = {
        from: `"Hotel Booking" <arebkhn6@gmail.com>`,
        to: booking.email,
        subject: "Booking Cancellation Confirmation ✅",
        html: `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
      <h2 style="color: #d32f2f; text-align: center;">Booking Cancelled</h2>
      <p>Dear <strong>${booking.name}</strong>,</p>
      <p>We regret to inform you that your booking has been successfully cancelled. Here are the details:</p>

      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr>
          <td style="padding: 8px; font-weight: bold;">Booking ID:</td>
          <td style="padding: 8px;">${booking._id}</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 8px; font-weight: bold;">Room Number:</td>
          <td style="padding: 8px;">${booking.roomDetails?.roomNumber || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Total Amount:</td>
          <td style="padding: 8px;">₹${booking.grandTotal?.toLocaleString() || "N/A"}</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 8px; font-weight: bold;">Check-in:</td>
          <td style="padding: 8px;">${booking.checkIn.toDateString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Check-out:</td>
          <td style="padding: 8px;">${booking.checkOut.toDateString()}</td>
        </tr>
      </table>

      <p style="margin-top: 20px;">If you have any questions or need further assistance, please feel free to <a href="mailto:arebkhn6@gmail.com" style="color: #1976d2;">contact us</a>.</p>
      
      <p style="margin-top: 10px; font-size: 0.9em; color: #777;">Thank you for choosing our hotel. We hope to serve you in the future!</p>
    </div>
  `,
      };

      await transporter.sendMail(mailOptions);
      console.log("Cancellation email sent to:", booking.email);
    }

    return res.json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
