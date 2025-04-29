const Player = require('../models/playerModel');
const Team = require('../models/teamModel');

// GET ALL PLAYERS (con paginación)
exports.getAllPlayers = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const players = await Player.find()
            .populate('seasons.team', 'name logoLink')
            .populate('goals')
            .populate('matches')
            .populate('yellowCards')
            .populate('redCards')
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Player.countDocuments();

        res.status(200).json({
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            data: players
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching players', error });
    }
};

// ADD new player
exports.addPlayer = async (req, res) => {
    console.log(req.body);

    try {
        const { name, position, team, age } = req.body;
        const newPlayer = await Player.create({ name, position, team, age });
        res.status(201).json(newPlayer);
    } catch (error) {
        res.status(500).json({ message: 'Error adding player', error });
    }
};

// GET player by ID
exports.getPlayerById = async (req, res) => {
    try {
        const player = await Player.findById(req.params.id)
            .populate('seasons.team', 'name logoLink')
            .populate('goals')
            .populate('matches')
            .populate('yellowCards')
            .populate('redCards');
        if (!player) {
            return res.status(404).json({ message: 'Player not found' });
        }

        res.status(200).json(player);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching player', error });
    }
};

// GET players by team name
exports.getPlayerByTeam = async (req, res) => {
    try {
        const teamName = req.params.team;
        const { page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const team = await Team.findOne({ name: new RegExp(teamName, 'i') });

        if (!team) {
            return res.status(404).json({ message: `No se encontró el equipo con nombre parecido a '${teamName}'` });
        }

        const players = await Player.find({ 'seasons.team': team._id })
            .populate('seasons.team')
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Player.countDocuments({ 'seasons.team': team._id });

        if (!players || players.length === 0) {
            return res.status(404).json({ message: `No se encontraron jugadores para el equipo '${teamName}'` });
        }

        res.status(200).json({
            team: team.name,
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            data: players
        });
    } catch (error) {
        console.error('Error interno:', error.message);
        res.status(500).json({ message: 'Error fetching player', error: error.message });
    }
};


//Buscar jugador por nombre
exports.getPlayerByName = async (req, res) => {
    try{
        const playerName = req.params.name;
        const player = await Player.findOne({name: new RegExp(playerName, 'i')});
        if(!player){
            return res.status(404).json({message: `No se encontró un jugador con el nombre parecido a '${playerName}'`});
        }
        res.status(200).json(player);
    } catch (error) {
        res.status(500).json({message: 'Error fetching player', error: error.message});
    }
}

