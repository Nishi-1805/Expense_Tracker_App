const express = require('express');
const router = express.Router();
const controllers = require('../controllers/apps');

router.get('/', controllers.getAppPage);
router.get('/currencies', controllers.getCurrencies);
router.get('/new-user', controllers.getNewUser);
router.get('/notes', controllers.getNotesPage);
router.get('/daily', controllers.getDailyExpensePage);
router.get('/monthly', controllers.getMonthlyExpensePage);
router.get('/yearly', controllers.getYearlyExpensePage);

module.exports = router;
