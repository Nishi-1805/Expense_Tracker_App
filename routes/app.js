const express = require('express');
const router = express.Router();
const controllers = require('../controllers/apps');

router.get('/', controllers.getAppPage);
router.get('/currencies', controllers.getCurrencies);
router.get('/login', controllers.getloginPage);
router.post('/login',controllers.login);
router.get('/new-user', controllers.getNewUser);

router.get('/notes', controllers.getNotesPage);
router.get('/daily', controllers.getDailyExpensePage);

router.get('/transactions', controllers.getDailyExpenses);
router.post('/transactions', controllers.addTransaction);
router.delete('/transactions/:transactionId', controllers.deleteTransaction);
router.get('/monthly', controllers.getMonthlyExpensePage);
router.get('/yearly', controllers.getYearlyExpensePage);
router.post('/users', controllers.createUser);

module.exports = router;
