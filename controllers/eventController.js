const Event = require('../models/eventModel');

exports.getAllEvents = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    try {
        const events = await Event.find()
            .populate('match')
            .populate('player')
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Event.countDocuments();

        res.status(200).json({
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            data: events
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events', error });
    }
};

exports.addEvent = async (req, res) => {
    try {
        const { match, player, minute, type } = req.body;
        const newEvent = await Event.create({ match, player, minute, type });
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(500).json({ message: 'Error adding event', error });
    }
};

exports.getEventbyMatch = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    try {
        const { matchId } = req.params;

        const events = await Event.find({ match: matchId })
            .populate('match')
            .populate('player')
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Event.countDocuments({ match: matchId });

        res.status(200).json({
            matchId,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            data: events
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events', error });
    }
};
