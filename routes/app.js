const express = require('express');
const router = express.Router();
const controllers = require('../controllers/apps');
const userauthentication = require('../middleware/auth');

router.get('/', controllers.getAppPage);
router.get('/currencies', controllers.getCurrencies);
router.get('/login', controllers.getloginPage);
router.post('/login',controllers.login);
router.post('/password/forgotpassword', controllers.forgotPassword);
router.get('/reset-password/:forgotPasswordRequestId', controllers.getResetPasswordPage);
router.post('/reset-password/:forgotPasswordRequestId', controllers.resetPassword);
router.get('/new-user', controllers.getNewUser);

router.get('/note', controllers.getNotesPage);
router.post('/notes', userauthentication.authenticate, controllers.createNote);
router.get('/notes', userauthentication.authenticate, controllers.getNotes);
router.get('/daily', userauthentication.authenticate, controllers.getDailyExpensePage);
router.get('/buy-premium', userauthentication.authenticate, controllers.buyPremiumMembership);
router.get('/check-premium', userauthentication.authenticate, controllers.checkPremiumStatus);
router.post('/buy-premium', userauthentication.authenticate, controllers.handlePaymentResponse);
router.get('/leaderboard', userauthentication.authenticate, controllers.getLeaderboard);
router.get('/transactions', userauthentication.authenticate, controllers.getDailyExpenses);
router.post('/transactions', userauthentication.authenticate, controllers.addTransaction);
router.delete('/transactions/:transactionId', userauthentication.authenticate, controllers.deleteTransaction);
router.get('/monthly',userauthentication.authenticate, controllers.getMonthlyExpensePage);
router.post('/monthly', userauthentication.authenticate, controllers.createMonthlyExpense);
router.get('/monthly-summary', userauthentication.authenticate, controllers.getMonthlyExpenses);
router.get('/download', userauthentication.authenticate, controllers.downloadallexpense);
router.get('/yearly',userauthentication.authenticate, controllers.getYearlyExpensePage);
router.post('/yearly', userauthentication.authenticate, controllers.createYearlyExpense);
router.get('/yearly-summary', userauthentication.authenticate, controllers.getYearlyExpenses);
router.post('/users', controllers.createUser);

module.exports = router;
