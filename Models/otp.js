import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: false },
  expiresAt: { type: Date, required: false },
});

const Otp = mongoose.model.Otp || mongoose.model("Otp", otpSchema);

export default Otp;
