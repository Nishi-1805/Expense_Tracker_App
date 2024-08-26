const axios = require('axios');
const sequelize = require('../util/database');
const PrimaryProfile = require('../models/primaryprofile')
const Transactions = require('../models/daily-expense');
const Orders = require('../models/orders')
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const { authenticate, generateAccessToken } = require('../middleware/auth');
const Razorpay = require('razorpay');
const dotenv = require('dotenv');
const { sendForgotPasswordEmail } = require('./mail');

dotenv.config({ path: './util/.env' });
console.log(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_SECRET_KEY);
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

exports.getCurrencies = async (req, res) => {
  try {
    const response = await axios.get(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json`);
    const currencies = response.data;
    //console.log('Currencies:', currencies);
    if (!currencies) {
      throw new Error('No currencies found');
    }

    const entries = Object.entries(currencies);
    const filteredEntries = entries.filter(([key, value]) => {
      return key.toLowerCase().includes(req.query.searchTerm.toLowerCase()) ||
        value.toLowerCase().includes(req.query.searchTerm.toLowerCase());
    });

    const currenciesArray = filteredEntries.map(([key, value]) => {
      return {
        name: value,
        code: key,
        country: ''
      };
    });

    res.json(currenciesArray);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error fetching currencies');
  }
};

exports.getAppPage = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/app.html'));
};

exports.getNewUser = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/new-user.html'));
};

exports.getloginPage = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
};

exports.getNotesPage = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/notes.html'))
}

exports.getDailyExpensePage = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/daily.html'))
}

exports.getMonthlyExpensePage = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/monthly.html'))
}

exports.getYearlyExpensePage = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/yearly.html'))
}

exports.createUser = async (req, res) => {
  try {
    const { password, name, email, purpose, info, account } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

   // const userfile = await Userfile.create({ googleDriveBackupId: null }); // assume no Google Drive backup ID for now
    const primaryProfile = await PrimaryProfile.create({
     // userId: userfile.id,
      password: hashedPassword,
      name,
      email,
      purpose,
      info,
      account,
    });

    res.status(201).json({ message: 'User added successfully!' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Email id already registered!!!' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const primaryProfile = await PrimaryProfile.findOne({ where: { email } });
    if (!primaryProfile) {
      return res.status(404).json({ message: 'Email not found' });
    }

    const isValidPassword = await primaryProfile.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate token
    const token = generateAccessToken(primaryProfile.id);

    // Send token back to client
    res.json({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.addTransaction = async (req, res) => {
  try {
    const { user } = req;
    const transactionData = req.body;
    const formattedDate = moment(transactionData.date).format('YYYY-MM-DD');

    let transactionType = '';
    let amount = 0;

    if (transactionData.income) {
      transactionType = 'income';
      amount = parseFloat(transactionData.income.amount);
    } else if (transactionData.expense) {
      transactionType = 'expense';
      amount = parseFloat(transactionData.expense.amount);
    }

    const transaction = await Transactions.create({
      date: formattedDate,
      type: transactionType,
      text: transactionData[transactionType].text,
      amount: amount,
      description: transactionData[transactionType].description,
      profileId: user.id,
    });

    if (transactionType === 'income') {
      user.totalIncome += amount;
    } else if (transactionType === 'expense') {
      user.totalExpense += amount;
    }

    await user.save();

    res.status(201).json({
      message: 'Transaction added successfully',
    });
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ message: 'Error adding transaction' });
  }
};

exports.getDailyExpenses = async (req, res) => {
  try {
    const profileId = req.user.id;
    const transactions = await Transactions.findAll({
      where: {
        profileId: {
          [Op.eq]: profileId
        }
      },
      order: [['date', 'DESC']]
    });

    const dailyExpenses = {
      income: 0,
      expense: 0,
    };

    transactions.forEach((transaction) => {
      if (transaction.type === 'income') {
        dailyExpenses.income += parseFloat(transaction.amount);
      } else {
        dailyExpenses.expense += parseFloat(transaction.amount);
      }
    });

    res.json({
      dailyExpenses,
      transactions,
    });
  } catch (error) {
    console.error('Error fetching daily expenses:', error);
    res.status(500).json({ message: 'Error fetching daily expenses' });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const transactionId = req.params.transactionId;
    const userId = req.user.id; // Ensure user is properly authenticated

    const transaction = await Transactions.findOne({
      where: { id: transactionId, profileId: userId }
    });

    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found or not authorized to delete' });
      return;
    }

    const amount = transaction.amount;
    const type = transaction.type;

    await transaction.destroy();

    const user = await PrimaryProfile.findByPk(userId);
    if (type === 'income') {
      user.totalIncome -= amount;
    } else if (type === 'expense') {
      user.totalExpense -= amount;
    }

    await user.save();

    res.status(200).json({ message: 'Transaction deleted successfully!' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Error deleting transaction' });
  }
};

exports.buyPremiumMembership = async (req, res) => {
  try {
    const options = {
      amount: 100, // Amount in paise
      currency: 'INR',
      receipt: 'rcptid_11',
    };

    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create order' });
  }
};

exports.handlePaymentResponse = async (req, res) => {
  try {
    const paymentId = req.body.razorpay_payment_id;
    const orderId = uuid.v4();

    // Save payment details to database
    const user = req.user;
    user.isPremium = true;
    await user.save();

    await Orders.create({
      profileId: user.id,
      paymentId,
      orderId,
      status: 'paid',
    });
    req.session.isPremium = true;
    // Set cookie indicating premium membership 
    res.cookie('premiumStatus', 'true', { maxAge: 31536000000 }); 
    res.json({ message: 'Premium membership purchased successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to process payment' });
  }
};

exports.checkPremiumStatus = async (req, res) => {
  try {
    const user = req.user; // The user should already be set by the `authenticate` middleware
    if (!user) {
      throw new Error('Unauthorized');
    }
    const orders = await Orders.findAll({
      where: {
        profileId: user.id,
        status: 'paid',
      },
    });
    const isPremium = orders.length > 0; // Check if the user has any paid orders
    res.json({ isPremium });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to check premium status' });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await PrimaryProfile.findAll({
      attributes: ['id', 'name', 'email', 'totalExpense'],
      order: [['totalExpense', 'DESC']],
    });

    res.status(200).json(leaderboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch leaderboard data' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body; // Extract email from the request body

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await PrimaryProfile.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const name = user.name;
    sendForgotPasswordEmail(email, name); // Ensure this function completes before proceeding

    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Error sending password reset link:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
