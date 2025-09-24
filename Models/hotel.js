import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Single", "Double", "Suite", "Deluxe"],
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["available", "checked-in", "maintenance","booked"],
      default: "available",
    },
    images: {
      type: Array,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    amenities: {
      type: [String],
      default: [],
    },
    features: {
      type: Array,
      default: [],
    },
    rating: {
      type: String,
      min: 0,
      max: 5,
      default: 0,
    },
    capacity: { type: Number, required: true },
    reviews: {
      type: String,
      default: 0,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    offer: {
      type: String,
      default: null,
    },
    bookedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Avoid recompiling model in dev/hot-reload
const Hotel = mongoose.models.Hotel || mongoose.model("Hotel", hotelSchema);

export default Hotel;
