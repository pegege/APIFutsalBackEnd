const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController.js');


router.get('/', playerController.getAllPlayers);
router.post('/', playerController.addPlayer);
router.get('/:id', playerController.getPlayerById);
router.get('/team/:team', playerController.getPlayerByTeam);

module.exports = router;
