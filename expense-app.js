const express = require('express');
const app = express();
const path = require('path');
const routes = require('./routes/app');
const sequelize = require('./util/database');
const PrimaryProfile = require('./models/primaryprofile');
const Transaction = require('./models/daily-expense');
const Order = require('./models/orders');
const session = require('express-session');
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'IKTsaDhkXRzHrB40nvYOrQ88',
  resave: false,
  saveUninitialized: true,
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/app.html'));
});

app.get('/new-user', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/new-user.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/login.html'));
});

app.get('/notes', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/notes.html'));
});

app.get('/daily', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/daily.html'));
});

app.get('/monthly', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/monthly.html'));
});

app.get('/yearly', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/yearly.html'));
});

app.use('/api', routes);

PrimaryProfile.hasMany(Transaction, {
  foreignKey: 'profileId',
  onDelete: 'CASCADE'
});

Transaction.belongsTo(PrimaryProfile, {
  foreignKey: 'profileId',
  onDelete: 'CASCADE'
});

PrimaryProfile.hasMany(Order, {
  foreignKey: 'profileId',
  onDelete: 'CASCADE'
});

Order.belongsTo(PrimaryProfile, {
  foreignKey: 'profileId',
  onDelete: 'CASCADE'
});

sequelize.sync() 
    .then(() => {
        console.log('Database connected and tables synced');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
