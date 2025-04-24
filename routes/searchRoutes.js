// routes/searchRoutes.js
const express = require('express');
const router = express.Router();
const Player = require('../models/playerModel');
const Team = require('../models/teamModel');

router.get('/', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ message: "Missing query" });

    const players = await Player.find({ name: new RegExp(query, "i") }).limit(10);
    const teams = await Team.find({ name: new RegExp(query, "i") }).limit(10);

    res.json({ players, teams });
});

module.exports = router;
