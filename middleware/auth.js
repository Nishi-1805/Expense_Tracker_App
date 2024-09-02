const jwt = require('jsonwebtoken');
const PrimaryProfile = require('../models/primaryprofile');
const dotenv = require('dotenv');
dotenv.config({ path: './util/.env' });
const session = require('express-session');

const SECRET_KEY = process.env.TOKEN_SECRET;;

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, SECRET_KEY, { expiresIn: '7000h' });
};

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    console.log(`Token: ${token}`);
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log(`Decoded token: ${decoded}`);
    const userId = decoded.userId;
    const primaryProfile = await PrimaryProfile.findByPk(userId);
    if (!primaryProfile) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = primaryProfile;
    req.session.isPremium = primaryProfile.isPremium;
    req.session.premiumStatus = primaryProfile.isPremium;
    next();
  } catch (error) {
    console.error('Error authenticating:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { authenticate, generateAccessToken };
