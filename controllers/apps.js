const axios = require('axios');
const Userfile = require('../models/Userfile');
const PrimaryProfile = require('../models/primaryprofile')
const bcrypt = require('bcrypt');

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

exports.getNotesPage = (req, res)=> {
  res.sendFile(path.join(__dirname, '../views/notes.html'))
}

exports.getDailyExpensePage = (req, res)=>{
  res.sendFile(path.join(__dirname, '../views/daily.html')) 
}

exports.getMonthlyExpensePage = (req, res)=>{
  res.sendFile(path.join(__dirname, '../views/monthly.html')) 
}

exports.getYearlyExpensePage = (req, res)=>{
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
    const primaryProfile = await PrimaryProfile.findOne({ email });
    if (!primaryProfile) {
      return res.status(404).json({ message: 'Email not found' });
    }
    if (!(await primaryProfile.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    if (primaryProfile.email !== email) {
      return res.status(401).json({ message: 'Invalid email' });
    }
    res.status(200).json({ message: 'Login successful', redirect: true });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
