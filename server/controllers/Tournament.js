const models = require('../models');

const makerPage = (req, res) => {
  res.render('app');
};

// Helper function to update subsequent matches
const updateSubsequentMatches = async (tournament, match, winner) => {
  const { round, matchNumber, bracketType } = match;

  console.log('\n=== UPDATE SUBSEQUENT MATCHES ===');
  console.log(`Current: ${bracketType} R${round} M${matchNumber}`);
  console.log(`Winner: ${winner}`);

  if (tournament.bracketType === 'single-elimination') {
    const nextRound = round + 1;
    const nextMatchNum = Math.ceil(matchNumber / 2);
    const slot = (matchNumber % 2 === 1) ? 'player1' : 'player2';

    console.log(`Next match: R${nextRound} M${nextMatchNum} (${slot} slot)`);

    const nextMatch = tournament.matches.find((m) => m.round === nextRound
      && m.matchNumber === nextMatchNum
      && m.bracketType === 'winners');

    if (nextMatch) {
      console.log(`Found next match. Setting ${slot} to ${winner}`);

      if (slot === 'player1') {
        nextMatch.player1 = winner;
      } else {
        nextMatch.player2 = winner;
      }

      if (nextMatch.player1 !== 'TBD' && nextMatch.player2 !== 'TBD') {
        nextMatch.status = 'pending';
        console.log('Match is now pending');
      }

      console.log(`Updated: ${nextMatch.player1} vs ${nextMatch.player2}`);
    } else {
      console.log('No next match found. Tournament might be complete.');
    }
  } else if (tournament.bracketType === 'double-elimination') {
    console.log('Double elimination update');

    if (bracketType === 'winners') {
      const loser = match.player1 === winner ? match.player2 : match.player1;
      console.log(`Winner: ${winner}, Loser: ${loser}`);

      // 1. Winner advances in winners bracket
      const nextWinnersRound = round + 1;
      const nextWinnersMatchNum = Math.ceil(matchNumber / 2);
      const winnersSlot = (matchNumber % 2 === 1) ? 'player1' : 'player2';

      console.log(`Winner goes to: Winners R${nextWinnersRound} M${nextWinnersMatchNum} (${winnersSlot})`);

      const nextWinnersMatch = tournament.matches.find((m) => m.round === nextWinnersRound
        && m.matchNumber === nextWinnersMatchNum
        && m.bracketType === 'winners');

      if (nextWinnersMatch) {
        if (winnersSlot === 'player1') {
          nextWinnersMatch.player1 = winner;
        } else {
          nextWinnersMatch.player2 = winner;
        }
        console.log(`Set winners ${winnersSlot} to ${winner}`);

        if (nextWinnersMatch.player1 !== 'TBD' && nextWinnersMatch.player2 !== 'TBD') {
          nextWinnersMatch.status = 'pending';
        }
      } else {
        // No next winners match - this is Winners Finals winner, goes to Grand Finals
        console.log(`No next winners match found. ${winner} is Winners Finals champion!`);
        const grandFinalsMatch = tournament.matches.find((m) => m.bracketType === 'grand-finals');

        if (grandFinalsMatch) {
          grandFinalsMatch.player1 = winner; 
          console.log(`Set Grand Finals player1 to ${winner}`);

          if (grandFinalsMatch.player1 !== 'TBD' && grandFinalsMatch.player2 !== 'TBD') {
            grandFinalsMatch.status = 'pending';
          }
        }
      }

      // 2. Loser goes to losers bracket
      if (loser && loser !== 'TBD') {
        console.log(`Sending loser ${loser} to losers bracket`);

         let targetLosersRound
        // Goofy formula to determine late winner's side loser's placement
        // LosersRound = winnersRound + (winnersRound - 2), minimum 1
        if (round < 3) {
          targetLosersRound = -round;
        }
        else {
          targetLosersRound = (round + (round - 2))*-1;
        }
        
        console.log(`Looking for losers match in Round ${targetLosersRound} (display: ${Math.abs(targetLosersRound)})`);
        const losersMatch = tournament.matches.find((m) => m.bracketType === 'losers'
          && m.round === targetLosersRound
          && (m.player1 === 'TBD' || m.player2 === 'TBD'));

        if (losersMatch) {
          console.log(`Found losers match: R${losersMatch.round} M${losersMatch.matchNumber}`);

          if (losersMatch.player1 === 'TBD') {
            losersMatch.player1 = loser;
            console.log(`Set player1 to ${loser}`);
          } else if (losersMatch.player2 === 'TBD') {
            losersMatch.player2 = loser;
            console.log(`Set player2 to ${loser}`);
          }

          if (losersMatch.player1 !== 'TBD' && losersMatch.player2 !== 'TBD') {
            losersMatch.status = 'pending';
            console.log('Losers match is now pending');
          }
        } else {
          console.log(`No available losers match found in round ${round}`);

          // Fallback: Find any available losers match
          const anyLosersMatch = tournament.matches.find((m) => m.bracketType === 'losers'
            && (m.player1 === 'TBD' || m.player2 === 'TBD'));

          if (anyLosersMatch) {
            console.log(`Found fallback losers match: R${anyLosersMatch.round} M${anyLosersMatch.matchNumber}`);
            if (anyLosersMatch.player1 === 'TBD') {
              anyLosersMatch.player1 = loser;
            } else {
              anyLosersMatch.player2 = loser;
            }
          }
        }
      }
    } else if (bracketType === 'losers') {
      // Winner advances in losers bracket
      console.log(`Losers bracket winner: ${winner}, Current round: ${round}`);

      const nextLosersRound = round - 1;
      const nextLosersMatchNum = Math.ceil(matchNumber / 2);
      const losersSlot = (matchNumber % 2 === 1) ? 'player1' : 'player2';

      console.log(`Winner should go to: Losers R${nextLosersRound} M${nextLosersMatchNum} (${losersSlot})`);

      const nextLosersMatch = tournament.matches.find((m) => m.bracketType === 'losers'
        && m.round === nextLosersRound
        && m.matchNumber === nextLosersMatchNum);

      if (nextLosersMatch) {
        if (losersSlot === 'player1' && nextLosersMatch.player1 === 'TBD') {
          nextLosersMatch.player1 = winner;
        } else {
          nextLosersMatch.player2 = winner;
        }
        console.log(`Set next losers match ${losersSlot} to ${winner}`);

        if (nextLosersMatch.player1 !== 'TBD' && nextLosersMatch.player2 !== 'TBD') {
          nextLosersMatch.status = 'pending';
        }
      } else {
        console.log(`No next losers match found at round ${nextLosersRound}. ${winner} might go to Grand Finals`);

        // Check if this is Losers Finals (most negative round)
        const allLosersMatches = tournament.matches.filter((m) => m.bracketType === 'losers');
        const minLosersRound = Math.min(...allLosersMatches.map((m) => m.round));

        if (round === minLosersRound) {
          // This is Losers Finals winner, goes to Grand Finals
          console.log(`${winner} is Losers Finals winner, going to Grand Finals`);
          const grandFinalsMatch = tournament.matches.find((m) => m.bracketType === 'grand-finals');

          if (grandFinalsMatch) {
            // Losers bracket winner goes to player2 slot in Grand Finals
            grandFinalsMatch.player2 = winner;
            console.log(`Set Grand Finals player2 to ${winner}`);

            if (grandFinalsMatch.player1 !== 'TBD' && grandFinalsMatch.player2 !== 'TBD') {
              grandFinalsMatch.status = 'pending';
            }
          }
        } else {
          console.log('ERROR: No next match found but this isn\'t Losers Finals!');
        }
      }
    }
  }

  console.log('\n=== UPDATE COMPLETE ===');
  return tournament;
};

const createTournament = async (req, res) => {
  if (!req.body.name || !req.body.game || !req.body.maxParticipants) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  try {
    let participants = [];
    const maxParticipants = parseInt(req.body.maxParticipants, 10);

    if (req.body.participants && Array.isArray(req.body.participants)) {
      participants = req.body.participants.map((name, index) => {
        if (!name || name.trim() === '') {
          return `Player ${index + 1}`;
        }
        return name.trim();
      });

      if (participants.length > maxParticipants) {
        participants = participants.slice(0, maxParticipants);
      } else if (participants.length < maxParticipants) {
        for (let i = participants.length; i < maxParticipants; i++) {
          participants.push(`Player ${i + 1}`);
        }
      }
    } else {
      for (let i = 1; i <= maxParticipants; i++) {
        participants.push(`Player ${i}`);
      }
    }

    const bracketType = req.body.bracketType || 'single-elimination';
    const matches = models.Tournament.generateBracket(participants, bracketType);

    // Debug logging for bracket generation
    console.log('=== BRACKET GENERATION DEBUG ===');
    console.log(`Tournament: ${req.body.name}`);
    console.log(`Participants: ${participants.length} (${participants.join(', ')})`);
    console.log(`Bracket type: ${bracketType}`);
    console.log(`Total matches generated: ${matches.length}`);
    matches.forEach((match, index) => {
      console.log(`${index + 1}. Round ${match.round} Match ${match.matchNumber} (${match.bracketType}): ${match.player1} vs ${match.player2}`);
    });

    const tournamentData = {
      name: req.body.name,
      game: req.body.game,
      maxParticipants,
      bracketType,
      participants,
      matches,
      owner: req.session.account._id,
    };

    const newTournament = new models.Tournament(tournamentData);
    await newTournament.save();

    return res.json({
      tournament: newTournament,
      redirect: '/maker',
    });
  } catch (err) {
    console.error('Error creating tournament:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: Object.values(err.errors).map((e) => e.message).join(', '),
      });
    }

    return res.status(400).json({
      error: 'An error occurred',
      details: err.message,
    });
  }
};

const getTournaments = async (req, res) => {
  try {
    const tournaments = await models.Tournament.find({ owner: req.session.account._id })
      .sort({ createdAt: -1 })
      .exec();

    return res.json({ tournaments });
  } catch (err) {
    console.error('Error fetching tournaments:', err);
    return res.status(400).json({ error: 'Error fetching tournaments' });
  }
};

const deleteTournament = async (req, res) => {
  try {
    if (!req.body.tournamentId) {
      return res.status(400).json({ error: 'Tournament ID required' });
    }

    const tournament = await models.Tournament.findOne({
      _id: req.body.tournamentId,
      owner: req.session.account._id,
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    await models.Tournament.deleteOne({ _id: req.body.tournamentId });
    return res.json({ message: 'Tournament deleted successfully' });
  } catch (err) {
    console.error('Error deleting tournament:', err);
    return res.status(400).json({ error: 'Error deleting tournament' });
  }
};

const updateMatch = async (req, res) => {
  try {
    const {
      matchId, score1, score2, winner,
    } = req.body;

    console.log('=== UPDATE MATCH REQUEST ===');
    console.log(`Match ID: ${matchId}`);
    console.log(`Scores: ${score1} - ${score2}`);
    console.log(`Winner: ${winner}`);

    if (!matchId) {
      return res.status(400).json({ error: 'Match ID required' });
    }

    const tournament = await models.Tournament.findOne({
      'matches._id': matchId,
      owner: req.session.account._id,
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const matchIndex = tournament.matches.findIndex((match) => match._id.toString() === matchId);
    if (matchIndex === -1) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Get the match before updating
    const match = tournament.matches[matchIndex];
    console.log(`Found match: ${match.player1} vs ${match.player2}, Round: ${match.round}, Match#: ${match.matchNumber}, Bracket: ${match.bracketType}`);

    // Check if both players are actually set (not TBD or empty)
    if ((!match.player1 || match.player1 === 'TBD' || !match.player2 || match.player2 === 'TBD')
      && (score1 !== null || score2 !== null)) {
      console.log('ERROR: Cannot set scores when players are not determined!');
      return res.status(400).json({
        error: 'Both players must be determined before setting scores',
      });
    }

    // Update match scores
    match.score1 = score1;
    match.score2 = score2;
    match.winner = winner;
    match.status = 'completed';

    console.log('Match updated. Now updating subsequent matches...');

    // Update subsequent matches
    await updateSubsequentMatches(tournament, match, winner);

    // Log all matches after update
    console.log('=== ALL MATCHES AFTER UPDATE ===');
    tournament.matches.forEach((m, idx) => {
      console.log(`${idx + 1}. Round ${m.round} Match ${m.matchNumber} (${m.bracketType}): ${m.player1 || 'TBD'} vs ${m.player2 || 'TBD'} - Status: ${m.status}`);
    });

    await tournament.save();

    return res.json({
      message: 'Match updated successfully',
      tournament,
    });
  } catch (err) {
    console.error('Error updating match:', err);
    return res.status(400).json({ error: `Error updating match: ${err.message}` });
  }
};

module.exports = {
  makerPage,
  createTournament,
  getTournaments,
  deleteTournament,
  updateMatch,
};
