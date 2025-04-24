const express = require('express');
const router = express.Router();
const { getAllMatches, addMatch, getMatchByTeam, getMatchById, getSeasonMatches, getMatchBySeasonByTeam } = require('../controllers/matchController');

router.get('/', getAllMatches);
router.post('/', addMatch);

router.get('/team/:teamName/season/:season', getMatchBySeasonByTeam);
router.get('/team/:teamName', getMatchByTeam);
router.get('/season/:season', getSeasonMatches);

router.get('/:id', getMatchById);


module.exports = router;
