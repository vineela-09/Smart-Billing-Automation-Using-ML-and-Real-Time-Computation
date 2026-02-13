import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendEmail } from "../utils/mailer.js";
import twilio from "twilio";
const JWT = process.env.JWT_SECRET || "devsecret";
export const register = async (req,res)=>{
  try{
    const { name, email, password, phone } = req.body;
    if(!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const ex = await User.findOne({ email });
    if(ex) return res.status(400).json({ message: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, phone });
    return res.status(201).json({ message: 'Registered successfully', userId: user._id });
  }catch(err){ return res.status(500).json({ message: 'Server error', error: err.message }); }
};
export const login = async (req,res)=>{
  try{
    const { email, password } = req.body;
    if(!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const user = await User.findOne({ email });
    if(!user) return res.status(401).json({ message: 'Invalid email or password' });
    const ok = await bcrypt.compare(password, user.password);
    if(!ok) return res.status(401).json({ message: 'Invalid email or password' });
    const token = jwt.sign({ id: user._id }, JWT, { expiresIn: '7d' });
    return res.status(200).json({ message: 'Login successful', token });
  }catch(err){ return res.status(500).json({ message: 'Server error', error: err.message }); }
};
export const forgot = async (req,res)=>{
  try{
    const { email, phone, method } = req.body;
    
    // Validate email
    if (!email) return res.status(400).json({ message: 'Email is required' });
    
    const user = await User.findOne({ email });
    if(!user) return res.status(400).json({ message: 'User not found' });
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random()*900000).toString();
    user.otp = otp;
    user.otpExpire = Date.now() + 10*60*1000; // Valid for 10 minutes
    await user.save();
    
    // Send OTP via selected method
    if (method === 'sms' && phone) {
      // Send SMS
      if(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        try {
          const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
          await client.messages.create({ 
            body: `Your Smart Billing OTP is: ${otp}. Valid for 10 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER, 
            to: formattedPhone 
          });
        } catch (smsErr) {
          // Fallback to email if SMS fails
          await sendEmail(email, 'Reset OTP', `<h3>Your Smart Billing OTP: ${otp}</h3><p>Valid for 10 minutes</p>`);
        }
      } else {
        // Fallback to email if Twilio not configured
        await sendEmail(email, 'Reset OTP', `<h3>Your Smart Billing OTP: ${otp}</h3><p>Valid for 10 minutes</p>`);
      }
    } else {
      // Send via Email (default)
      await sendEmail(email, 'Smart Billing - Password Reset OTP', 
        `<h2>Password Reset Request</h2>
         <p>Your OTP: <strong>${otp}</strong></p>
         <p>This OTP is valid for 10 minutes.</p>
         <p>If you didn't request this, please ignore this email.</p>`
      );
    }
    
    return res.status(200).json({ message: 'OTP sent successfully' });
  }catch(err){ 
    return res.status(500).json({ message: 'Server error', error: err.message }); 
  }
};
export const reset = async (req,res)=>{
  try{
    const { email, otp, password } = req.body;
    
    // Validate inputs
    if (!email || !otp || !password) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    // Find user with valid OTP
    const user = await User.findOne({ 
      email, 
      otp, 
      otpExpire: { $gt: Date.now() } 
    });
    
    if(!user) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }
    
    // Update password
    user.password = await bcrypt.hash(password, 10);
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();
    
    // Send confirmation email
    try {
      await sendEmail(email, 'Smart Billing - Password Changed', 
        `<h2>Password Successfully Reset</h2>
         <p>Your Smart Billing password has been changed successfully.</p>
         <p>If you didn't make this change, please contact support immediately.</p>`
      );
    } catch (emailErr) {
      console.error('Error sending confirmation email:', emailErr);
    }
    
    return res.status(200).json({ message: 'Password reset successful. Please login with your new password.' });
  }catch(err){ 
    return res.status(500).json({ message: 'Server error', error: err.message }); 
  }
};
