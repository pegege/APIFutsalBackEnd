// models/eventModel.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    season: { type: Number, required: true }, // Temporada, ej: 2025
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    minute: { type: Number, required: false },
    type: { type: String, enum: ['goal', 'yellow', 'red'], required: true }, // Evento puede ser gol, amarilla, roja
}, {
    timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);
