const express = require('express');
const app = express();
const path = require('path');
const routes = require('./routes/app');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/app.html'));
});

app.get('/new-user', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/new-user.html'));
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

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
