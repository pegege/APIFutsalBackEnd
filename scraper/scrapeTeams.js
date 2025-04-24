// --- scraper/scrapeTeams.js ---
const axios = require('axios');
const cheerio = require('cheerio');
const Team = require('../models/teamModel');

async function scrapeTeams() {
    try {
        const allTeams = [];

        for (let season = 2005; season <= 2025; season++) {
            if (season === 2009) {
                console.log(`⚠️ Saltando temporada ${season} (no disponible)`);
                continue; // ❌ salta la temporada 2009 directamente
            }
            console.log(`📅 Scrapeando equipos de la temporada ${season}`);
            const { data } = await axios.get(`https://www.lnfs.es/competicion/primera/${season}/clasificacion`);
            const $ = cheerio.load(data);

            const teams = [];

            $('#ClassificationFullTable tr').each((i, elem) => {
                const nameElement = $(elem).find('td.name.ta-l a');
                const logoElement = $(elem).find('td.ph5.img img');

                if (nameElement.length && logoElement.length) {
                    const name = nameElement.text().trim();
                    const href = nameElement.attr('href');
                    const parts = href.split('/');
                    const slug = parts[2];
                    const id = parts[3];
                    const logoLink = logoElement.attr('src');

                    teams.push({
                        name,
                        slug,
                        id,
                        logoLink,
                        season,
                        players: []
                    });
                }
            });

            // Guardar uno a uno haciendo upsert
            for (const team of teams) {
                await Team.updateOne(
                    { id: team.id, season: team.season }, // buscar por ID y temporada
                    { $set: team },
                    { upsert: true }
                );
            }

            allTeams.push(...teams);
        }

        console.log(`✅ Procesados ${allTeams.length} equipos de todas las temporadas`);
        return allTeams;
    } catch (error) {
        console.error('❌ Error scrapeando equipos:', error.message);
    }
}

module.exports = { scrapeTeams };
