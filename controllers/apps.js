const axios = require('axios');
const path = require('path');
const buffer = require('buffer');
const sequelize = require('../util/database');
const PrimaryProfile = require('../models/primaryprofile')
const Transactions = require('../models/daily-expense');
const Orders = require('../models/orders')
const ForgotPasswordRequest = require('../models/forgot_pw_request');
const Note = require('../models/Note');
const Monthlyexpense = require('../models/monthly');
const Yearlyexpense = require('../models/year');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const { authenticate, generateAccessToken } = require('../middleware/auth');
const Razorpay = require('razorpay');
const dotenv = require('dotenv');
const { sendForgotPasswordEmail } = require('./mail');
const S3services = require('../services/S3services');

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
  res.cookie('isPremium', req.session.isPremium, { httpOnly: false });
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

    const primaryProfile = await PrimaryProfile.create({
    
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

exports.createNote = async (req, res) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    const userId = decoded.userId;
    console.log(`Received Token: ${token}`);

    const primaryProfile = await PrimaryProfile.findOne({ where: { id: userId } });
    if (!primaryProfile) {
      return res.status(401).send({ error: 'User not found' });
    }

    const noteData = req.body;
    console.log(`Received note data: ${JSON.stringify(noteData)}`);

    const formattedDate = moment(noteData.date, 'YYYY-MM-DD', true).isValid() ? moment(noteData.date).format('YYYY-MM-DD') : null;

    if (!formattedDate) {
      console.log(`Invalid date format: ${noteData.date}`);
      return res.status(400).send({ error: 'Invalid date format. Please use YYYY-MM-DD.' });
    }

    const note = new Note({
      title: noteData.title,
      text: noteData.text,
      date: formattedDate,
      profileId: primaryProfile.id, 
    });

    await note.save();
    res.status(201).send(note);
  } catch (error) {
    console.error(error);
    res.status(400).send({ error: 'Error creating note' });
  }
}

exports.getNotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const primaryProfile = await PrimaryProfile.findOne({ where: { id: userId } });
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // number of notes per page
    const offset = (page - 1) * limit;

    const notes = await Note.findAll({
      where: { profileId: primaryProfile.id },
      limit,
      offset,
      attributes: ['date', 'title', 'text'] 
    });

    const count = await Note.count({ where: { profileId: primaryProfile.id } });
    const totalPages = Math.ceil(count / limit);

    res.json({ notes, totalPages });
  } catch (error) {
    console.error('Error getting notes:', error);
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
      },
    });
    if (orders.length === 0) {
      res.json({ isPremium: false }); // User has no orders, so they're not premium
    } else {
      const isPremium = orders.some(order => order.status === 'paid');
      res.json({ isPremium });
    }
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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await PrimaryProfile.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const forgotPasswordRequest = await ForgotPasswordRequest.create({
      userId: user.id
    });

    sendForgotPasswordEmail(email, user.name, forgotPasswordRequest.id);

    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Error sending password reset link:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getResetPasswordPage = async (req, res) => {
  try {
    const forgotPasswordRequestId = req.params.forgotPasswordRequestId;
    const forgotPasswordRequest = await ForgotPasswordRequest.findByPk(forgotPasswordRequestId);

    if (!forgotPasswordRequest || !forgotPasswordRequest.isActive) {
      return res.status(404).json({ message: 'Invalid or expired password reset link' });
    }
    res.status(200).sendFile(path.join(__dirname, '../views/reset-password.html'));
  } catch (error) {
    console.error('Error fetching reset password page:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const forgotPasswordRequestId = req.params.forgotPasswordRequestId;
    const forgotPasswordRequest = await ForgotPasswordRequest.findByPk(forgotPasswordRequestId);

    if (!forgotPasswordRequest || !forgotPasswordRequest.isActive) {
      return res.status(404).json({ message: 'Invalid or expired password reset link' });
    }

    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    
    const user = await PrimaryProfile.findByPk(forgotPasswordRequest.userId);
    user.password = await bcrypt.hash(password, 10);
    await user.save();

    await forgotPasswordRequest.update({ isActive: false });

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.createMonthlyExpense = async (req, res) => {
  try {
    const { user } = req;
    const expenseData = req.body;

    const monthlyExpense = await Monthlyexpense.create({
      income: expenseData.income,
      expense: expenseData.expense,
      balance: expenseData.balance,
      description: expenseData.description,
      profileId: user.id,
    });

    res.status(201).json({
      message: 'Monthly expense added successfully',
    });
  } catch (error) {
    console.error('Error creating monthly expense:', error);
    res.status(500).json({ message: 'Error creating monthly expense' });
  }
};

exports.getMonthlyExpenses = async (req, res) => {
  try {
    const profileId = req.user.id;
    const transactions = await Monthlyexpense.findAll({
      where: {
        profileId: {
          [Op.eq]: profileId
        }
      }
    });

    if (!transactions) {
      return res.status(404).json({ message: 'No monthly expense data found' });
    }

    let totalIncome = 0;
    let totalExpense = 0;
    let totalBalance = 0;

    transactions.forEach((transaction) => {
      totalIncome += parseFloat(transaction.income);
      totalExpense += parseFloat(transaction.expense);
      totalBalance += parseFloat(transaction.balance);
    });

    totalIncome = totalIncome.toFixed(2);
    totalExpense = totalExpense.toFixed(2);
    totalBalance = totalBalance.toFixed(2);

    const latestTransaction = transactions[transactions.length - 1];
    const monthlyExpenses = {
      income: totalIncome,
      expense: totalExpense,
      balance: totalBalance,
      description: latestTransaction.description
    };

    res.json(monthlyExpenses);
  } catch (error) {
    console.error('Error fetching monthly expenses:', error);
    res.status(500).json({ message: 'Error fetching monthly expenses' });
  }
};

exports.createYearlyExpense = async (req, res) => {
  try {
    const { user } = req;
    const expenseData = req.body;

    const yearlyExpense = await Yearlyexpense.create({
      income: expenseData.income,
      expense: expenseData.expense,
      balance: expenseData.balance,
      description: expenseData.description,
      profileId: user.id,
    });

    res.status(201).json({
      message: 'Yearly expense added successfully',
    });
  } catch (error) {
    console.error('Error creating yearly expense:', error);
    res.status(500).json({ message: 'Error creating yearly expense' });
  }
};

exports.getYearlyExpenses = async (req, res) => {
  try {
    const profileId = req.user.id;
    const transactions = await Yearlyexpense.findAll({
      where: {
        profileId: {
          [Op.eq]: profileId
        }
      }
    });

    if (!transactions) {
      return res.status(404).json({ message: 'No yearly expense data found' });
    }

    let totalIncome = 0;
    let totalExpense = 0;
    let totalBalance = 0;

    transactions.forEach((transaction) => {
      totalIncome += parseFloat(transaction.income);
      totalExpense += parseFloat(transaction.expense);
      totalBalance += parseFloat(transaction.balance);
    });

    totalIncome = totalIncome.toFixed(2);
    totalExpense = totalExpense.toFixed(2);
    totalBalance = totalBalance.toFixed(2);

    const latestTransaction = transactions[transactions.length - 1];
    const yearlyExpenses = {
      income: totalIncome,
      expense: totalExpense,
      balance: totalBalance,
      description: latestTransaction.description
    };

    res.json(yearlyExpenses);
  } catch (error) {
    console.error('Error fetching yearly expenses:', error);
    res.status(500).json({ message: 'Error fetching yearly expenses' });
  }
};

exports.downloadallexpense = async (req, res) => {
  try {
    const profileId = req.user.id;
    const dailyExpenses = await Transactions.findAll({
      where: {
        profileId: profileId
      }
    });
    const monthlyExpenses = await Monthlyexpense.findAll({
      where: {
        profileId: profileId
      }
    });
    const yearlyExpenses = await Yearlyexpense.findAll({
      where: {
        profileId: profileId
      }
    });
    const allExpenses = [...dailyExpenses, ...monthlyExpenses, ...yearlyExpenses];
  
    const filename = `AllExpenses_${profileId}_${new Date().toISOString().replace(/:/g, '-')}.txt`;
    const fileURL = await S3services.uploadToS3(allExpenses, filename);

    res.json({ fileURL: fileURL });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err: err });
  }
}
