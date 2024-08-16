const axios = require('axios');
const Userfile = require('../models/Userfile');
const PrimaryProfile = require('../models/primaryprofile')
const Transactions = require('../models/daily-expense');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const moment = require('moment');

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

    const userfile = await Userfile.create({ googleDriveBackupId: null }); // assume no Google Drive backup ID for now
    const primaryProfile = await PrimaryProfile.create({
      userId: userfile.id,
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
    if (!(await primaryProfile.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    res.status(200).json({ message: 'Login successful', redirect: true });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.addTransaction = async (req, res) => {
  try {
    const transactionData = req.body;
    const formattedDate = moment(transactionData.date).format('YYYY-MM-DD');

    let incomeTransaction;
    let expenseTransaction;

    if (transactionData.income.text && transactionData.income.amount) {
      incomeTransaction = await Transactions.create({
        date: formattedDate,
        type: 'income',
        text: transactionData.income.text,
        amount: parseFloat(transactionData.income.amount),
        description: transactionData.income.description
      });
    }

    if (transactionData.expense.text && transactionData.expense.amount) {
      expenseTransaction = await Transactions.create({
        date: formattedDate,
        type: 'expense',
        text: transactionData.expense.text,
        amount: parseFloat(transactionData.expense.amount),
        description: transactionData.expense.description
      });
    }

    // Update total income and total expense amounts
    const totalIncome = await Transactions.sum('amount', {
      where: { type: 'income' }
    });
    const totalExpense = await Transactions.sum('amount', {
      where: { type: 'expense' }
    });

    res.status(201).json({
      message: 'Transaction added successfully',
      data: {
        income: incomeTransaction,
        expense: expenseTransaction
      },
      totalIncome,
      totalExpense
    });
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ message: 'Error adding transaction' });
  }
};

exports.getDailyExpenses = async (req, res) => {
  try {
    const transactions = await Transactions.findAll({
      order: [['date', 'DESC']] // Fetch all transactions in descending order of date
    });

    const dailyExpenses = {
      income: 0,
      expense: 0
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
      transactions
    });
  } catch (error) {
    console.error('Error fetching daily expenses:', error);
    res.status(500).json({ message: 'Error fetching daily expenses' });
  }
}; 
