// --- scraper/index.js ---
const { scrapeMatches } = require('./scrapeMatches.js');
const { scrapeTeams } = require('./scrapeTeams.js');
const { scrapePlayers, scrapeAndLinkPlayers } = require('./scrapePlayers.js');
const { scrapeConvocados } = require('./scrapeConvocados.js');
const { scrapeEventsForMatch } = require('./scrapeEvents.js');

module.exports = {
    scrapeMatches,
    scrapeTeams,
    scrapePlayers,
    scrapeAndLinkPlayers,
    scrapeConvocados,
    scrapeEventsForMatch
};
