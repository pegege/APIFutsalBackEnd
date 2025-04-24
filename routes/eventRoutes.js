const express = require('express');
const router = express.Router();
const { getAllEvents, addEvent, getEventbyMatch } = require('../controllers/eventController');

router.get('/', getAllEvents);
router.post('/', addEvent);
router.get('/:matchId', getEventbyMatch);


module.exports = router;