const models = require('../models');

const makerPage = (req, res) => {
  res.render('app');
};

// Helper function to update subsequent matches
const updateSubsequentMatches = async (tournament, match, winner) => {
  const { round } = match;
  const { matchNumber } = match;
  const bracketType = match.bracketType || 'winners';

  if (tournament.bracketType === 'single-elimination') {
    const nextRound = round + 1;
    const nextMatchPosition = Math.ceil(matchNumber / 2);

    const nextMatch = tournament.matches.find((m) => m.round === nextRound
      && Math.ceil(m.matchNumber / 2) === nextMatchPosition);

    if (nextMatch) {
      const isPlayer1Slot = matchNumber % 2 === 1;

      if (isPlayer1Slot) {
        nextMatch.player1 = winner;
      } else {
        nextMatch.player2 = winner;
      }

      if (nextMatch.player1 !== 'TBD' && nextMatch.player2 !== 'TBD') {
        nextMatch.status = 'pending';
      }
    }
  } else if (tournament.bracketType === 'double-elimination') {
    if (bracketType === 'winners') {
      const nextWinnersRound = round + 1;
      const nextMatchPosition = Math.ceil(matchNumber / 2);

      const nextWinnersMatch = tournament.matches.find((m) => m.round === nextWinnersRound
        && m.bracketType === 'winners'
        && Math.ceil(m.matchNumber / 2) === nextMatchPosition);

      if (nextWinnersMatch) {
        const isPlayer1Slot = matchNumber % 2 === 1;
        if (isPlayer1Slot) {
          nextWinnersMatch.player1 = winner;
        } else {
          nextWinnersMatch.player2 = winner;
        }

        if (nextWinnersMatch.player1 !== 'TBD' && nextWinnersMatch.player2 !== 'TBD') {
          nextWinnersMatch.status = 'pending';
        }
      }

      const loser = match.player1 === winner ? match.player2 : match.player1;
      if (loser && loser !== 'TBD' && loser !== null) {
        const losersMatch = tournament.matches.find((m) => m.bracketType === 'losers'
          && m.round === round
          && (m.player1 === 'TBD' || m.player2 === 'TBD'));

        if (losersMatch) {
          if (losersMatch.player1 === 'TBD') {
            losersMatch.player1 = loser;
          } else if (losersMatch.player2 === 'TBD') {
            losersMatch.player2 = loser;
          }

          if (losersMatch.player1 !== 'TBD' && losersMatch.player2 !== 'TBD') {
            losersMatch.status = 'pending';
          }
        }
      }
    } else if (bracketType === 'losers') {
      const nextLosersRound = round + 1;

      const nextLosersMatch = tournament.matches.find((m) => m.bracketType === 'losers'
        && m.round === nextLosersRound
        && (m.player1 === 'TBD' || m.player2 === 'TBD'));

      if (nextLosersMatch) {
        if (nextLosersMatch.player1 === 'TBD') {
          nextLosersMatch.player1 = winner;
        } else if (nextLosersMatch.player2 === 'TBD') {
          nextLosersMatch.player2 = winner;
        }

        if (nextLosersMatch.player1 !== 'TBD' && nextLosersMatch.player2 !== 'TBD') {
          nextLosersMatch.status = 'pending';
        }
      }
    }
  }

  return tournament;
};

const createTournament = async (req, res) => {
  if (!req.body.name || !req.body.game || !req.body.maxParticipants) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  // Check for all required body params
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
    return res.status(400).json({ error: 'Error deleting tournament' });
  }
};

const updateMatch = async (req, res) => {
  try {
    const {
      matchId, score1, score2, winner,
    } = req.body;

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

    // Update match scores
    const match = tournament.matches[matchIndex];
    match.score1 = score1;
    match.score2 = score2;
    match.winner = winner;
    match.status = winner ? 'completed' : 'live';

    await updateSubsequentMatches(tournament, match, winner);

    await tournament.save();

    return res.json({
      message: 'Match updated successfully',
      tournament,
    });
  } catch (err) {
    return res.status(400).json({ error: 'Error updating match' });
  }
};

module.exports = {
  makerPage,
  createTournament,
  getTournaments,
  deleteTournament,
  updateMatch,
};
