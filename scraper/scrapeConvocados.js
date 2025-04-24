const puppeteer = require('puppeteer');
const Match = require('../models/matchModel');
const Player = require('../models/playerModel');

async function scrapeConvocados() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });


    try {
        const matches = await Match.find({});
        console.log(`🎯 Scrapeando convocados de ${matches.length} partidos...`);

        const batchSize = 5; // 🛠 Procesamos 5 partidos a la vez
        for (let i = 0; i < matches.length; i += batchSize) {
            const batch = matches.slice(i, i + batchSize);

            await Promise.all(batch.map(async (match) => {
                const page = await browser.newPage();
                await page.goto(match.link, { waitUntil: 'domcontentloaded', timeout: 60000 });

                const convocados = await page.evaluate(() => {
                    function getPlayersFromSection(title) {
                        const sectionTitle = Array.from(document.querySelectorAll('.bg3'))
                            .find(el => el.textContent.trim().toLowerCase() === title.toLowerCase());
                        if (!sectionTitle) return { local: [], visitor: [] };

                        const section = sectionTitle.nextElementSibling;
                        if (!section) return { local: [], visitor: [] };

                        const localPlayers = Array.from(section.querySelectorAll('.team_local .block .name p.bold'))
                            .map(p => p.textContent.trim()).filter(Boolean);

                        const visitorPlayers = Array.from(section.querySelectorAll('.team_visitor .block .name p.bold'))
                            .map(p => p.textContent.trim()).filter(Boolean);

                        return { local: localPlayers, visitor: visitorPlayers };
                    }

                    return {
                        startingHome: getPlayersFromSection('Cinco inicial').local,
                        startingAway: getPlayersFromSection('Cinco inicial').visitor,
                        substitutesHome: getPlayersFromSection('Suplentes').local,
                        substitutesAway: getPlayersFromSection('Suplentes').visitor,
                        notPlayedHome: getPlayersFromSection('Convocados').local,
                        notPlayedAway: getPlayersFromSection('Convocados').visitor
                    };
                });

                if (!convocados.startingHome.length && !convocados.startingAway.length) {
                    console.warn(`⚠️ No hay datos de convocados para ${match.homeTeam} vs ${match.awayTeam}`);
                    await page.close();
                    return;
                }

                const findPlayerIds = async (names) => {
                    const players = await Player.find({
                        $or: [
                            { nickname: { $in: names } },
                            { name: { $in: names } }
                        ]
                    }).select('_id nickname name matches');

                    const ids = [];

                    for (const name of names) {
                        const player = players.find(p => p.nickname === name || p.name === name);
                        if (player) {
                            ids.push(player._id);

                            // Actualizar en la base de datos
                            await Player.updateOne(
                                { _id: player._id },
                                { $addToSet: { matches: match._id } } // No duplica, añade solo si no está
                            );

                        } else {
                            console.warn(`⚠️ Jugador no encontrado: ${name}`);
                        }
                    }

                    return ids;
                };


                const [startingHomeIds, startingAwayIds, substitutesHomeIds, substitutesAwayIds, notPlayedHomeIds, notPlayedAwayIds] =
                    await Promise.all([
                        findPlayerIds(convocados.startingHome),
                        findPlayerIds(convocados.startingAway),
                        findPlayerIds(convocados.substitutesHome),
                        findPlayerIds(convocados.substitutesAway),
                        findPlayerIds(convocados.notPlayedHome),
                        findPlayerIds(convocados.notPlayedAway)
                    ]);

                await Match.updateOne(
                    { _id: match._id },
                    {
                        $set: {
                            startingPlayersHome: startingHomeIds,
                            startingPlayersAway: startingAwayIds,
                            substitutesHome: substitutesHomeIds,
                            substitutesAway: substitutesAwayIds,
                            notPlayedHome: notPlayedHomeIds,
                            notPlayedAway: notPlayedAwayIds
                        }
                    }
                );

                console.log(`✅ Convocados actualizados para ${match.homeTeam} vs ${match.awayTeam}`);

                await page.close();
            }));

            console.log(`🚀 Batch de partidos ${i + 1}-${i + batchSize} procesado.`);
            await new Promise(resolve => setTimeout(resolve, 1500)); // ⏳ Pequeña espera entre batch
        }

        console.log('🏁 Scrapeo de convocados completado.');
    } catch (error) {
        console.error('❌ Error en scrapeConvocados:', error.message);
    } finally {
        await browser.close();
    }
}

module.exports = { scrapeConvocados };
