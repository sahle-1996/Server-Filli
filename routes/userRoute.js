import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';
import { sendEmail } from '../mailer.js';
import dotenv from 'dotenv'
const router = express.Router();
dotenv.config();
// Signup Route
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) return res.status(400).json({ message: 'Username or email already exists' });

    // Validate password length
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters long' });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email format' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      isConfirmed: false,
    });

    // Generate email confirmation token
    const emailToken = jwt.sign(
      { username: newUser.username, email: newUser.email, userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Generate confirmation URL
    const confirmUrl = `${process.env.CLIENT_URL}/confirm-email/?token=${emailToken}`;

    // Send confirmation email
    await sendEmail(
      email,
      'Confirm your email',
      `Please confirm your email by clicking the link: ${confirmUrl}`,
      `<p>Please confirm your email by clicking the link below:</p>
       <a href="${confirmUrl}">${confirmUrl}</a>`
    );

    res.status(201).json({ message: 'User created successfully. Please confirm your email.', newUser });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if the email is confirmed
    if (!user.isConfirmed) {
      return res.status(403).json({
        message: 'Please confirm your email before logging in',
        emailConfirmed: false,
        username: user.username,
      });
    }

    // Verify password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) return res.status(401).json({ message: 'Invalid password' });

    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      token,
      username: user.username,
      emailConfirmed: user.isConfirmed,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Email Confirmation Route
router.post('/confirm-email', async (req, res) => {
  const { token } = req.query;
  console.log(token)

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);


    // Find user by decoded userId
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    // Confirm the email
    user.isConfirmed = true;
    await user.save();

    res.status(200).json({ message: 'Email confirmed successfully' });
  } catch (error) {
    console.error('Email confirmation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
