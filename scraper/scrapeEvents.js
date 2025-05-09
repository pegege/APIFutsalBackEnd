const axios = require('axios');
const cheerio = require('cheerio');
const Player = require('../models/playerModel');
const Event = require('../models/eventModel');
const Match = require('../models/matchModel');

function normalize(str) {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

async function scrapeEventsForMatch(matchUrl, matchId, season) {
  try {
    console.log(`✨ Scrapeando eventos de: ${matchUrl}`);

    const match = await Match.findById(matchId).populate('homeTeam awayTeam');
    if (!match) {
      console.error(`❌ Partido no encontrado: ${matchId}`);
      return;
    }

    const { data } = await axios.get(matchUrl);
    const $ = cheerio.load(data);

    let totalEvents = 0;
    const eventBatch = [];
    const playerUpdates = new Map();

    const getAllPlayers = async (teamObj) => {
      return await Player.find({
        seasons: {
          $elemMatch: {
            team: teamObj._id.toString(),
            season
          }
        }
      });
    };

    const processPlayerEvents = async (playerBlock, teamObj, teamLabel, allPlayers) => {
      const playerNameRaw = $(playerBlock).find('.name p.bold').text().trim();
      const normalizedTarget = normalize(playerNameRaw);
      const actionBlocks = $(playerBlock).find('.ico-actions');
      if (!playerNameRaw || actionBlocks.length === 0) return;

      const player = allPlayers.find(p => {
        const nameNorm = normalize(p.name || '');
        const nickNorm = normalize(p.nickname || '');
        return nameNorm === normalizedTarget || nickNorm === normalizedTarget ||
               nameNorm.includes(normalizedTarget) || nickNorm.includes(normalizedTarget);
      });

      if (!player) {
        console.warn(`⚠️ Jugador no encontrado: "${playerNameRaw}" en ${teamLabel} (${teamObj.name})`);
        return;
      }

      for (const action of actionBlocks) {
        const img = $(action).find('img').attr('src') || '';
        const minuteText = $(action).find('.minute-actions').text().replace("'", '').trim();
        const minute = parseInt(minuteText) || null;

        let type = null;
        if (img.includes('accion1.png')) type = 'goal';
        else if (img.includes('accion5.png')) type = 'yellow';
        else if (img.includes('accion6.png')) type = 'red';

        if (!type) continue;

        const key = player._id.toString();
        if (!playerUpdates.has(key)) {
          playerUpdates.set(key, { goals: [], yellowCards: [], redCards: [], doc: player });
        }

        const update = playerUpdates.get(key);
        if (type === 'goal') update.goals.push({ match: matchId, minute });
        if (type === 'yellow') update.yellowCards.push({ match: matchId, minute });
        if (type === 'red') update.redCards.push({ match: matchId, minute });

        eventBatch.push({
          insertOne: {
            document: {
              match: matchId,
              player: player._id,
              minute,
              type,
              season
            }
          }
        });
        

        totalEvents++;
      }
    };

      
    

    const localPlayers = $('.team_local .block').toArray().filter(el => {
      const name = $(el).find('.name p.bold').text().trim();
      const hasEvents = $(el).find('.ico-actions').length > 0;
      return name && hasEvents;
    });

    const visitorPlayers = $('.team_visitor .block').toArray().filter(el => {
      const name = $(el).find('.name p.bold').text().trim();
      const hasEvents = $(el).find('.ico-actions').length > 0;
      return name && hasEvents;
    });

    const [allLocalPlayers, allVisitorPlayers] = await Promise.all([
      getAllPlayers(match.homeTeam),
      getAllPlayers(match.awayTeam)
    ]);

    await Promise.all(localPlayers.map(block =>
      processPlayerEvents(block, match.homeTeam, 'Local', allLocalPlayers)
    ));

    await Promise.all(visitorPlayers.map(block =>
      processPlayerEvents(block, match.awayTeam, 'Visitante', allVisitorPlayers)
    ));

    await Promise.all(Array.from(playerUpdates.values()).map(async ({ goals, yellowCards, redCards, doc }) => {
  
      for (const goal of goals) {
        const alreadyExists = doc.goals.some(g => g.match.toString() === goal.match.toString() && g.minute === goal.minute);
        if (!alreadyExists) {
          doc.goals.push(goal);
        }
      }
    
      for (const yellow of yellowCards) {
        const alreadyExists = doc.yellowCards.some(y => y.match.toString() === yellow.match.toString() && y.minute === yellow.minute);
        if (!alreadyExists) {
          doc.yellowCards.push(yellow);
        }
      }
    
      for (const red of redCards) {
        const alreadyExists = doc.redCards.some(r => r.match.toString() === red.match.toString() && r.minute === red.minute);
        if (!alreadyExists) {
          doc.redCards.push(red);
        }
      }
    
      await doc.save();
    }));
    

    let insertedEvents = [];

    if (eventBatch.length > 0) {
      const rawEvents = eventBatch.map(e => e.insertOne.document);
    
      const nonDuplicateEvents = [];
    
      for (const event of rawEvents) {
        const exists = await Event.findOne({
          match: event.match,
          player: event.player,
          minute: event.minute,
          type: event.type
        });
    
        if (!exists) {
          nonDuplicateEvents.push(event);
        }
      }
    
      if (nonDuplicateEvents.length > 0) {
        insertedEvents = await Event.insertMany(nonDuplicateEvents);
    
        match.events.push(...insertedEvents.map(e => e._id));
        await match.save();
      }
    }
    


    console.log(`🚀 Total eventos guardados: ${totalEvents}`);
  } catch (error) {
    console.error('❌ Error en scrapeEventsForMatch:', error.message);
  }
}

module.exports = { scrapeEventsForMatch };
