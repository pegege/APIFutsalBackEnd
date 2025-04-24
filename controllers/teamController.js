const mongoose = require('mongoose');
const Team = require('../models/teamModel');
const Player = require('../models/playerModel');

exports.getAllTeams = async (req, res) => {
    try {
        const { page = 1, limit = 50, season } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = {};
        if (season) {
            filter.season = Number(season);
        }

        const teams = await Team.find(filter, 'name logoLink shortName slug season')
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Team.countDocuments(filter);

        res.status(200).json({
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            data: teams
        });
    } catch (error) {
        console.error("❌ Error en getAllTeams:", error);
        res.status(500).json({ message: 'Error fetching teams', error });
    }
};



exports.addTeam = async (req, res) => {
    try {
        const { name, shortName, logoLink } = req.body;
        const newTeam = await Team.create({ name, shortName, logoLink });
        res.status(201).json(newTeam);
    } catch (error) {
        res.status(500).json({ message: 'Error adding team', error });
    }
};

exports.getTeamPlayers = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        if (!mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({ message: 'ID de equipo inválido' });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const players = await Player.find({ 'seasons.team': teamId })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Player.countDocuments({ 'seasons.team': teamId });

        res.status(200).json({
            teamId,
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

exports.getTeamById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        const team = await Team.findById(id).populate('players');

        if (!team) {
            return res.status(404).json({ message: 'No se encontró el equipo' });
        }

        res.status(200).json(team);
    } catch (error) {
        console.error('❌ Error al obtener el equipo:', error.message);
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};
