const mongoose = require('mongoose');
const { aggregate } = require('./matchModel');

const playerSchema = new mongoose.Schema({
    id: String,
    name: String,
    position: String,
    nickname: String,
    seasons: [
        {
            season: Number, // Temporada, ej: 2025
            team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }
        }
    ],
    goals: [{ match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' }, minute: Number }],
    yellowCards: [{ match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' }, minute: Number }],
    redCards: [{ match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' }, minute: Number }],
    matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }],
    birthDate: Date,
})

module.exports = mongoose.model('Player', playerSchema);