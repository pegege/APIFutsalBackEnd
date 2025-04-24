const puppeteer = require('puppeteer');
const Match = require('../models/matchModel');
const Team = require('../models/teamModel');

async function scrapeMatches() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        for (let year = 2005; year <= 2025; year++) {
            if (year === 2009) continue; // Saltar 2009 porque no hay datos

            console.log(`✨ Accediendo a https://www.lnfs.es/competicion/primera/${year}/resultados/1`);

            const mainPage = await browser.newPage();
            await mainPage.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            );

            await mainPage.goto(`https://www.lnfs.es/competicion/primera/${year}/resultados/1`, {
                waitUntil: 'domcontentloaded',
                timeout: 60000
            });

            await mainPage.waitForSelector('#select_round_competition');

            const jornadas = await mainPage.$$eval('#select_round_competition option', options =>
                options.map(option => ({
                    value: option.value,
                    jornada: option.textContent.trim()
                }))
            );

            await mainPage.close();

            console.log(`⚡ Total jornadas temporada ${year}: ${jornadas.length}`);

            const batchSize = 5;
            for (let i = 0; i < jornadas.length; i += batchSize) {
                const batch = jornadas.slice(i, i + batchSize);

                await Promise.all(
                    batch.map(async jornada => {
                        const page = await browser.newPage();
                        await page.setUserAgent(
                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
                        );

                        const url = `https://www.lnfs.es/competicion/primera/${year}/resultados/1`;
                        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

                        await page.select('#select_round_competition', jornada.value);
                        await new Promise(resolve => setTimeout(resolve, 1500));

                        const jornadaNumber = parseInt(jornada.jornada.replace(/[^\d]/g, ''), 10);

                        const matches = await page.evaluate((season, jornadaNumber) => {
                            const matches = [];
                            const matchElements = document.querySelectorAll('.match-row');

                            matchElements.forEach(el => {
                                const homeTeam = el.querySelector('.team.ta-r .name')?.textContent.trim();
                                const awayTeam = el.querySelector('.team.ta-l .name')?.textContent.trim();
                                const score = el.querySelector('.marker a')?.textContent.trim();
                                let link = el.querySelector('.marker a')?.getAttribute('href');
                                const status = el.querySelector('.status')?.textContent.trim();

                                if (homeTeam && awayTeam && link) {
                                    if (!link.startsWith('http')) {
                                        link = `https://www.lnfs.es${link}`;
                                    }

                                    matches.push({
                                        homeTeam,
                                        awayTeam,
                                        score,
                                        status,
                                        season,
                                        link,
                                        jornada: jornadaNumber
                                    });
                                }
                            });

                            return matches;
                        }, year, jornadaNumber);

                        for (const match of matches) {
                            const homeTeamDoc = await Team.findOne({ name: new RegExp(`^${match.homeTeam}$`, 'i'), season: match.season });
                            const awayTeamDoc = await Team.findOne({ name: new RegExp(`^${match.awayTeam}$`, 'i'), season: match.season });

                            if (!homeTeamDoc || !awayTeamDoc) {
                                console.warn(`⚠️ Equipos no encontrados: ${match.homeTeam} vs ${match.awayTeam}`);
                                continue;
                            }

                            await Match.updateOne(
                                {
                                    homeTeam: homeTeamDoc._id,
                                    awayTeam: awayTeamDoc._id,
                                    link: match.link,
                                    season: match.season
                                },
                                {
                                    $set: {
                                        score: match.score,
                                        status: match.status,
                                        competition: 'LNFS',
                                        date: new Date(),
                                        jornada: match.jornada
                                    }
                                },
                                { upsert: true }
                            );
                        }

                        console.log(`✅ Jornada ${jornadaNumber} (${year}) procesada.`);
                        await page.close();
                    })
                );

                console.log(`🚀 Batch de jornadas ${i + 1}-${i + batchSize} completado.`);
            }
        }

        console.log('🏁 Scrapeo de partidos completado.');
    } catch (error) {
        console.error('❌ Error scraping matches:', error.message);
    } finally {
        await browser.close();
    }
}

module.exports = { scrapeMatches };
