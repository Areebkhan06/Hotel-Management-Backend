import mongoose, { Types } from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    grandTotal: { type: Number, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests: { type: Number, required: true },
    children: { type: Number, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["pending", "confirmed", "cancelled", "checked-in", "checked-out"],
      default: "pending",
    },
    isPaid: { type: Boolean, default: false },
    paymentMethod: {
      type: String,
      enum: ["UPI", "Credit Card", "Debit Card", "Razorpay", "Pay at CheckIn"],
      default: null,
    },
    roomDetails: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel" },
  },
  { timestamps: true }
);

const Order = mongoose.model.Order || mongoose.model("Order", orderSchema);

export default Order;
