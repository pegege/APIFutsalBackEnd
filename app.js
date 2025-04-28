require('dotenv').config();
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');

const matchRoutes = require('./routes/matchRoutes.js');
const playerRoutes = require('./routes/playerRoutes.js');
const teamRoutes = require('./routes/teamRoutes.js');
const eventRoutes = require('./routes/eventRoutes.js');
const searchRoutes = require('./routes/searchRoutes.js');

const {
    scrapeMatches,
    scrapeTeams,
    scrapePlayers,
    scrapeAndLinkPlayers,
    scrapeConvocados,
    scrapeEventsForMatch
} = require('./scraper/scrape.js');

const Match = require('./models/matchModel.js');
const Team = require('./models/teamModel.js');
const Player = require('./models/playerModel.js');
const Event = require('./models/eventModel.js');

const app = express();
const PORT = process.env.PORT || 3000;
const CURRENT_SEASON = 2025; // 🎯 Solo esta se actualizará automáticamente

app.use(cors());
app.use(express.json());

// 🔐 Middleware de seguridad
const ALLOWED_API_KEY = process.env.API_KEY || 'PABLO_SUPER_API_2025';

/*
app.use((req, res, next) => {
    const userKey = req.headers['x-api-key'];
    if (!userKey || userKey !== ALLOWED_API_KEY) {
        return res.status(403).json({ message: '🚫 Acceso denegado: clave inválida' });
    }
    next();
});
*/

// 📦 Rutas protegidas
app.use('/api/matches', matchRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/search', searchRoutes);

// 🔁 Scrapeo completo manual (primera vez)
async function fullScrape() {
    try {
        console.log('🔄 Iniciando scrapeo COMPLETO (todas las temporadas)');

        console.log('⚽ Equipos');
        //await scrapeTeams();

        console.log('🏃 Jugadores y vinculación');
        const teams = await Team.find();
        //await scrapeAndLinkPlayers(teams);

        console.log('🏆 Partidos');
        //await scrapeMatches();

        console.log('📝 Convocados');
        //await scrapeConvocados();

        console.log('📋 Eventos');
        
        const matches = await Match.find();
        
        for (const match of matches) {
            await scrapeEventsForMatch(match.link, match._id, match.season);
        }
        

        console.log('✅ Scrapeo completo terminado');
    } catch (error) {
        console.error('❌ Error en fullScrape:', error);
    }
}

// 🔄 Scrapeo automático de SOLO la temporada actual
async function updateCurrentSeasonOnly() {
    try {
        console.log(`🔁 Actualizando temporada ${CURRENT_SEASON}`);

        await scrapeMatches(); // Esto actualizará todos los partidos (el scraper ya evita duplicados)
        await scrapeConvocados();

        const matches = await Match.find({ season: CURRENT_SEASON });

        for (const match of matches) {
            await scrapeEventsForMatch(match.link, match._id, match.season);
        }

        console.log(`✅ Actualización de temporada ${CURRENT_SEASON} completa`);
    } catch (error) {
        console.error(`❌ Error actualizando temporada ${CURRENT_SEASON}:`, error);
    }
}

async function wipeDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('🧨 Borrando datos...');
        await Match.deleteMany({});
        await Player.deleteMany({});
        await Team.deleteMany({});
        await Event.deleteMany({}); 

        console.log('✅ Base de datos limpia');
    } catch (err) {
        console.error('❌ Error borrando datos:', err);
        process.exit(1);
    }
}

// 🔌 Conexión a Mongo + ejecución inicial + cron
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log('✅ MongoDB connected');
    //wipeDatabase(); // Descomentar para limpiar la base de datos

    //await updateCurrentSeasonOnly(); // Actualiza la temporada actual al iniciar

    // Primera vez: full scrape
    //await fullScrape();

    // Luego: solo temporada actual cada 2h

    //cron.schedule('*/30 * * * * ', async () => {
    /*
    console.log('⏰ CRON: actualizando solo temporada actual');
    await updateCurrentSeasonOnly();
    });
    */

}).catch(err => console.error('❌ MongoDB connection error:', err));

// 🧠 Ruta opcional de bienvenida
app.get('/', (req, res) => {
    res.send('🚀 API Futsal Pablo funcionando correctamente.');
});

// 🎯 Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
