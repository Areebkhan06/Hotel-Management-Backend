import Hotel from "../Models/hotel.js";
import jwt from "jsonwebtoken";
import cloudinary from "../config/cloudinary.js";
import Order from "../Models/orders.js";

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("ENV EMAIL:", process.env.EMAIL);
    console.log("ENV PASSWORD:", process.env.PASSWORD);

    if (!email || !password) {
      return res.json({ success: false, message: "Please enter both feilds" });
    }

    if (email !== process.env.EMAIL || password !== process.env.PASSWORD) {
      return res.json({ success: false, message: "Login failed" });
    }

    const token = jwt.sign({ role: "admin", email }, process.env.JWT_SECRET);

    return res.json({ success: true, message: "Login successful", token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const addRoom = async (req, res) => {
  try {
    console.log("REQ.ADMIN:", req.admin);
    console.log("REQ.BODY:", req.body);
    console.log("images", req.files);

    const {
      roomNumber,
      type,
      pricePerNight,
      status,
      description,
      amenities,
      features,
      rating,
      reviews,
      isBestSeller,
      isFeatured,
      offer,
      bookedCount,
      capacity,
    } = req.body;

    const existingRoomNumber = await Hotel.findOne({ roomNumber });
    if (existingRoomNumber) {
      return res.json({ success: false, message: "Room Already axists" });
    }

    const uploadedImages = [];
    for (const item of req.files) {
      const result = await cloudinary.uploader.upload(item.path, {
        resource_type: "image",
      });
      console.log(result.secure_url);
      uploadedImages.push(result.secure_url);
    }

    const newRoom = new Hotel({
      roomNumber,
      type,
      pricePerNight,
      status,
      images: uploadedImages,
      description,
      amenities,
      features,
      rating,
      reviews,
      isBestSeller,
      isFeatured,
      offer,
      bookedCount,
      capacity,
    });

    await newRoom.save();

    res.json({ success: true, message: "added" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const calculateTotalRevenue = async (req, res) => {
  try {
    const bookings = await Order.find({ isPaid: true });
    const totalRevenue = bookings.reduce(
      (acc, booking) => acc + booking.grandTotal,
      0
    );

    res.json({ success: true, message: "Total", totalRevenue });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const TotalBookings = async (req, res) => {
  try {
    // Only fetch the count directly instead of fetching all documents
    const totalNumberBookings = await Order.countDocuments({
      status: "confirmed",
    });

    res.json({ success: true, totalNumberBookings });
  } catch (error) {
    console.error("Error fetching total bookings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminAllRooms = async (req, res) => {
  try {
    const rooms = await Hotel.find();
    res.json({ success: true, rooms });
  } catch (error) {
    console.error("Error fetching All rooms:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminAllBookings = async (req, res) => {
  try {
    const bookings = await Order.find({
      $or: [
        { paymentMethod: "Pay at CheckIn" },
        { paymentMethod: "Razorpay", isPaid: true },
      ],
    })
      .sort({ createdAt: -1 })
      .populate("roomDetails");

    res.json({ success: true, message: "Bookings", bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changeIsPaid = async (req, res) => {
  try {
    const { BookingId } = req.body;

    const updatedBooking = await Order.findByIdAndUpdate(BookingId, {
      isPaid: true,
    });

    res.json({ success: true, message: "Updated" });
  } catch (error) {
    console.error("Error fetching total bookings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const handleStatus = async (req, res) => {
  try {
    console.log(req.body);
    const { newStatus, id } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status: newStatus },
      { new: true } // return updated document
    );
    if (newStatus === "checked-in") {
      await Hotel.findByIdAndUpdate(updatedOrder.roomDetails, {
        status: newStatus,
      });
    } else if (newStatus === "checked-out") {
      await Hotel.findByIdAndUpdate(updatedOrder.roomDetails, {
        status: "available",
      });
    }

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const fetchRoom = async (req, res) => {
  const { id } = req.body;
  try {
    if (!id) {
      return res.json({ success: false, message: "Id not found" });
    }

    const room = await Hotel.findById(id);
    console.log(room);

    if (!room) {
      console.log({ success: false, message: "Room not found" });
    }
    res.json({ success: true, room });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const {
      _id,
      roomNumber,
      type,
      pricePerNight,
      status,
      images,
      description,
      amenities,
      features,
      rating,
      capacity,
      reviews,
      isBestSeller,
      isFeatured,
      offer,
      bookedCount,
    } = req.body.roomData;

    const updateData = {
      roomNumber,
      type,
      pricePerNight,
      status,
      description,
      amenities,
      features,
      rating,
      capacity,
      reviews,
      isBestSeller,
      isFeatured,
      offer,
      bookedCount,
    };

    const updated = await Hotel.findByIdAndUpdate(_id, updateData, {
      new: true,
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    res.json({ success: true, message: "Room Updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteRoom = async (req, res) => {
  const { roomId } = req.body;
  try {
    if (!roomId) {
      return res.json({ success: false, message: "Room id not found" });
    }

    const deletedRoom = await Hotel.findByIdAndDelete(roomId);

    if (!deletedRoom) {
      return res.json({ success: false, message: "Room not found" });
    }

    res.json({ success: true, message: "Room deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const monthSales = async (req, res) => {
  try {
    const sales = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          checkIn: { $type: "date" },
        },
      },
      {
        $group: {
          _id: { $month: "$checkIn" },
          totalSales: { $sum: "$grandTotal" },
          totalBookings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    console.log("Raw sales aggregation:", sales);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Fill all months with default 0
    const formatted = months.map((m, idx) => {
      const monthData = sales.find((s) => s._id === idx + 1);
      return monthData
        ? {
            month: m,
            sales: monthData.totalSales,
            bookings: monthData.totalBookings,
          }
        : { month: m, sales: 0, bookings: 0 }; // missing months = 0
    });

    res.json({ success: true, sales: formatted });
  } catch (error) {
    console.error("Month sales error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch sales data" });
  }
};
