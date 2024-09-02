const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes/app');
const sequelize = require('./util/database');
const PrimaryProfile = require('./models/primaryprofile');
const Transaction = require('./models/daily-expense');
const Order = require('./models/orders');
const ForgotPasswordRequest = require('./models/forgot_pw_request');
const Note = require('./models/Note');
const Monthly = require('./models/monthly');
const Yearly = require('./models/year');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors()); 
dotenv.config();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(session({
  secret: 'IKTsaDhkXRzHrB40nvYOrQ88',
  resave: false,
  saveUninitialized: true,
}));

app.use((req, res, next) => {
  console.log(`${req.method} request to ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/app.html'));
});

app.get('/new-user', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/new-user.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/login.html'));
});

app.get('/note', (req, res) => {
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

app.get('/reset-password/:forgotPasswordRequestId', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/reset_pw.html'));
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

PrimaryProfile.hasMany(ForgotPasswordRequest, {
  foreignKey: 'userId',
  onDelete: 'CASCADE'
});

ForgotPasswordRequest.belongsTo(PrimaryProfile, {
  foreignKey: 'userId',
  onDelete: 'CASCADE'
});

PrimaryProfile.hasMany(Note, {
  foreignKey: 'profileId',
  onDelete: 'CASCADE'
});

Note.belongsTo(PrimaryProfile, {
  foreignKey: 'profileId',
  onDelete: 'CASCADE'
});

PrimaryProfile.hasMany(Monthly, {
  foreignKey: 'profileId',
  onDelete: 'CASCADE'
});

Monthly.belongsTo(PrimaryProfile, {
  foreignKey: 'profileId',
  onDelete: 'CASCADE'
});

PrimaryProfile.hasMany(Yearly, {
  foreignKey: 'profileId',
  onDelete: 'CASCADE'
});

Yearly.belongsTo(PrimaryProfile, {
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

app.listen(process.env.PORT || 3000, () => {
  console.log('Server listening on port 3000');
});
