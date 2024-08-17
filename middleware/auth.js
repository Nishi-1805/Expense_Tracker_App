const jwt = require('jsonwebtoken');
const PrimaryProfile = require('../models/primaryprofile');

const SECRET_KEY = '0b2c9fd7829bdbf853bf2193f0b538bc5ba22aeb8ff2d1eb9d44c801a3d535f3';

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, SECRET_KEY, { expiresIn: '1000h' });
};

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.userId;
    const primaryProfile = await PrimaryProfile.findByPk(userId);
    if (!primaryProfile) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = primaryProfile;
    next();
  } catch (error) {
    console.error('Error authenticating:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { authenticate, generateAccessToken };


//const crypto = require('crypto');

//const generateSecretKey = () => {
  //return crypto.randomBytes(32).toString('hex');
//};

//const secretKey = generateSecretKey();
//console.log(secretKey);
