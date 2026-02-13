import mongoose from "mongoose";
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  otp: String,
  otpExpire: Date
}, { timestamps: true });
export default mongoose.model("User", UserSchema);
