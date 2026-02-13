import nodemailer from "nodemailer";
export const sendEmail = async (to, subject, html) => {
  if(!process.env.EMAIL_USER || !process.env.EMAIL_PASS){
    console.log("[DEV EMAIL]", to, subject, html);
    return;
  }
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
  await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html });
};
