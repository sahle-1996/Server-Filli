import nodemailer from 'nodemailer';
import dotenv from 'dotenv'

dotenv.config()


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


export const sendEmail = async (to, subject, text, html) => {
  const mailOptions = { from: process.env.EMAIL_USER, to, subject, text, html };

  return transporter.sendMail(mailOptions);
};

