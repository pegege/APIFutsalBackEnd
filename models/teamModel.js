const mongoose = require('mongoose');

const teamsSchema = new mongoose.Schema({
    id: String,
    name: String,
    slug: String,
    shortName: String,
    logoLink: String,
    season: Number, // Temporada, ej: 2025
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }]
});


module.exports = mongoose.model('Team', teamsSchema);

