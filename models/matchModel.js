const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    homeTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    awayTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    score: String,
    date: Date,
    competition: String,
    link: String,
    status: String,
    jornada: Number, // Jornada, ej: 1, 2, 3, etc.
    season: Number, // Temporada, ej: 2025
    startingPlayersHome: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    startingPlayersAway: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    substitutesHome: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    substitutesAway: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    notPlayedHome: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    notPlayedAway: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    events: [{type: mongoose.Schema.Types.ObjectId, ref: 'Event'}],
}, {
    timestamps: true
});

module.exports = mongoose.model('Match', matchSchema);
