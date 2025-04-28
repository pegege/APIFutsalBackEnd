// --- scraper/scrapePlayers.js ---
const axios = require('axios');
const cheerio = require('cheerio');
const Player = require('../models/playerModel');
const Team = require('../models/teamModel');

const BASE_URL = 'https://www.lnfs.es';

async function scrapePlayers(teamSlug, teamId, season) {
    try {
        const players = [];

        const { data } = await axios.get(`${BASE_URL}/equipo/${teamSlug}/${teamId}/${season}/plantilla`);
        const $ = cheerio.load(data);
        console.log(`📅 Scrapeando jugadores de la temporada ${season} del equipo ${teamSlug}`);

        const dbTeam = await Team.findOne({ id: teamId, season });

        if (!dbTeam) {
            console.warn(`⚠️ No encontrado el equipo ${teamSlug} en la temporada ${season}, saltando...`);
            return [];
        }


        $('tbody tr').each((_, el) => {
            const pBold = $(el).find('.name.ta-l.name-nick p.bold');
            const role = $(el).find('td.bold').eq(0).text().trim();

            if (pBold.length > 0) {
                const name = pBold.text().trim();
                const nickname = $(el).find('.name.ta-l.name-nick p').last().text().trim();
                const img = $(el).find('.ph5.img img').attr('src');

                if (name && nickname) {
                    players.push({
                        name,
                        nickname,
                        img: img ? img : null,
                        position: role,
                        season,
                        teamId: dbTeam._id, 
                    });
                }
            }
        });

        return players;

    } catch (error) {
        console.error(`❌ Error scraping players for ${teamSlug} (${season}):`, error.message);
        return [];
    }
}

async function scrapeAndLinkPlayers(teams) {
    try {
        let totalPlayers = 0;

        for (const team of teams) {
            console.log(`🛠 Scrapeando jugadores de ${team.name} (${team.season})`);

            const playersOfTeam = await scrapePlayers(team.slug, team.id, team.season);

            if (!playersOfTeam.length) {
                console.warn(`⚠️ No se encontraron jugadores para el equipo ${team.name} (${team.season})`);
                continue;
            }

            for (const player of playersOfTeam) {
                let existingPlayer = await Player.findOne({ name: player.name, nickname: player.nickname });

                if (existingPlayer) {
                    const alreadyExists = existingPlayer.seasons.some(
                        (s) => s.season === player.season && s.team && s.team.toString() === player.teamId.toString()
                    );
                
                    if (!alreadyExists) {
                        existingPlayer.seasons.push({ season: player.season, team: player.teamId });
                    }
                
                    // CORRECCIÓN: actualizar posición si no existe
                    if (!existingPlayer.position && player.position) {
                        existingPlayer.position = player.position;
                    }
                
                    await existingPlayer.save();
                    console.log(`Jugador ${existingPlayer.name} actualizado.`);
                }
                

                await Team.updateOne(
                    { _id: player.teamId },
                    { $addToSet: { players: existingPlayer._id } }
                );

                totalPlayers++;
            }

        }

        console.log(`✅ Scrapeo de jugadores completado. Total jugadores relacionados: ${totalPlayers}`);
    } catch (error) {
        console.error('❌ Error en scrapeAndLinkPlayers:', error.message);
    }
}

module.exports = { scrapePlayers, scrapeAndLinkPlayers };
