const Match = require('../models/matchModel.js');
const Team = require('../models/teamModel');

// GET ALL MATCHES with filters + pagination
exports.getAllMatches = async (req, res) => {
    try {
        const { team, season, jornada, page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = {};

        if (jornada) query.jornada = Number(jornada);
        if (season) query.season = Number(season);


        const matchesQuery = Match.find(query)
            .populate('homeTeam', 'name')
            .populate('awayTeam', 'name')
            .skip(skip)
            .limit(parseInt(limit));

        let matches = await matchesQuery.exec();
        let total = await Match.countDocuments(query);

        // Team filtering (regex on populated team names)
        if (team) {
            const teamRegex = new RegExp(team, 'i');
            matches = matches.filter(match =>
                (match.homeTeam && teamRegex.test(match.homeTeam.name)) ||
                (match.awayTeam && teamRegex.test(match.awayTeam.name))
            );
            total = matches.length;
        }

        res.status(200).json({
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            data: matches
        });

    } catch (error) {
        console.error('❌ Error fetching matches:', error);
        res.status(500).json({ message: 'Error fetching matches', error });
    }
};

exports.addMatch = async (req, res) => {
    try {
      const { homeTeam, awayTeam, score, date, competition } = req.body;
  
      const newMatch = await Match.create({
        homeTeam: new mongoose.Types.ObjectId(homeTeam),
        awayTeam: new mongoose.Types.ObjectId(awayTeam),
        score,
        date,
        competition
      });
  
      res.status(201).json(newMatch);
    } catch (error) {
      res.status(500).json({ message: 'Error adding match', error });
    }
  };

// GET matches by team name (with players)
exports.getMatchByTeam = async (req, res) => {
    try {
        const teamName = String(req.params.teamName || '');
        const regex = new RegExp(teamName, 'i');

        const matches = await Match.find()
            .populate('homeTeam awayTeam')
            .populate('homePlayers awayPlayers startingPlayersHome startingPlayersAway substitutesHome substitutesAway notPlayedHome notPlayedAway');

        const filtered = matches.filter(m =>
            (m.homeTeam && regex.test(m.homeTeam.name)) ||
            (m.awayTeam && regex.test(m.awayTeam.name))
        );

        res.status(200).json(filtered);
    } catch (error) {
        console.error('❌ Error en getMatchByTeam:', error.message);
        res.status(500).json({ message: 'Error fetching matches', error });
    }
};

// GET match by ID
exports.getMatchById = async (req, res) => {
    try {
        const matchId = req.params.id;

        const match = await Match.findById(matchId)
            .populate('startingPlayersHome', 'name nickname')
            .populate('startingPlayersAway', 'name nickname')
            .populate('substitutesHome', 'name nickname')
            .populate('substitutesAway', 'name nickname')
            .populate('notPlayedHome', 'name nickname')
            .populate('notPlayedAway', 'name nickname')
            .populate('homeTeam', 'name logoLink')
            .populate('awayTeam', 'name logoLink');

        if (!match) {
            return res.status(404).json({ message: 'Partido no encontrado' });
        }

        res.status(200).json(match);
    } catch (error) {
        console.error('❌ Error al obtener el partido por ID:', error.message);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// GET matches by season (optional pagination)
exports.getSeasonMatches = async (req, res) => {
    try {
        const { season } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const matches = await Match.find({ season })
            .populate('homePlayers awayPlayers startingPlayersHome startingPlayersAway substitutesHome substitutesAway notPlayedHome notPlayedAway')
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Match.countDocuments({ season });

        res.status(200).json({
            season,
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            data: matches
        });
    } catch (error) {
        console.error('❌ Error al obtener partidos por temporada:', error.message);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// GET matches by season & team (by ID or name)
exports.getMatchBySeasonByTeam = async (req, res) => {
    try {
        const { season, teamId } = req.params;

        const team = await Team.findById(teamId).catch(() => null)
            || await Team.findOne({ name: new RegExp(teamId, 'i') });

        if (!team) return res.status(404).json({ message: 'Equipo no encontrado' });

        const matches = await Match.find({
            $or: [{ homeTeam: team._id }, { awayTeam: team._id }],
            season
        }).populate('homePlayers awayPlayers startingPlayersHome startingPlayersAway substitutesHome substitutesAway notPlayedHome notPlayedAway');

        res.status(200).json(matches);
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};
