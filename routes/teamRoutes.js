const express = require('express');

const router = express.Router();
const teamController = require('../controllers/teamController.js');

router.get('/', teamController.getAllTeams);
router.post('/', teamController.addTeam);
router.get('/:teamId/players', teamController.getTeamPlayers);
router.get('/:id', teamController.getTeamById);

module.exports = router;