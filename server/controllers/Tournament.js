const models = require('../models');

const makerPage = (req, res) => {
  res.render('app');
};

const createTournament = async (req, res) => {
  console.log('=== CREATE TOURNAMENT REQUEST ===');
  console.log('Request body:', req.body);
  console.log('Session:', req.session);

  const accountId = req.session && req.session.account && req.session.account._id;
  console.log('Account ID:', accountId);

  if (!req.body.name || !req.body.game || !req.body.maxParticipants) {
    console.log('Missing fields:', {
      name: req.body.name,
      game: req.body.game,
      maxParticipants: req.body.maxParticipants,
    });
    return res.status(400).json({ error: 'All fields are required!' });
  }

  try {
    // Generate initial participants
    const participants = [];
    const maxParticipants = parseInt(req.body.maxParticipants, 10);
    console.log('Max participants (parsed):', maxParticipants);

    const participantCount = Math.min(maxParticipants, 8);
    console.log('Creating participants:', participantCount);

    for (let i = 1; i <= participantCount; i++) {
      participants.push(`Player ${i}`);
    }
    console.log('Participants array:', participants);

    // Generate bracket matches
    const bracketType = req.body.bracketType || 'single-elimination';
    console.log('Bracket type:', bracketType);

    console.log('Generating bracket...');
    const matches = models.Tournament.generateBracket(participants, bracketType);
    console.log('Generated matches:', matches.length);
    console.log('Match structure (first match):', matches[0]);

    const tournamentData = {
      name: req.body.name,
      game: req.body.game,
      maxParticipants,
      bracketType,
      participants,
      matches,
      owner: req.session.account._id,
    };

    console.log('Tournament data to save:', tournamentData);

    const newTournament = new models.Tournament(tournamentData);
    console.log('Attempting to save tournament...');

    await newTournament.save();
    console.log('Tournament saved successfully! ID:', newTournament._id);

    return res.json({
      tournament: newTournament,
      redirect: '/maker',
    });
  } catch (err) {
    console.error('=== ERROR CREATING TOURNAMENT ===');
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);

    // Check for specific MongoDB validation errors
    if (err.name === 'ValidationError') {
      console.error('Validation errors:', err.errors);
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
    console.log('Fetching tournaments for user:', req.session.account._id);
    const tournaments = await models.Tournament.find({ owner: req.session.account._id })
      .sort({ createdAt: -1 })
      .exec();

    console.log('Found tournaments:', tournaments.length);
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

    if (!matchId) {
      return res.status(400).json({ error: 'Match ID required' });
    }

    // Find tournament containing this match
    const tournament = await models.Tournament.findOne({
      'matches._id': matchId,
      owner: req.session.account._id,
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Update the match
    const matchIndex = tournament.matches.findIndex((match) => match._id.toString() === matchId);
    if (matchIndex === -1) {
      return res.status(404).json({ error: 'Match not found' });
    }

    tournament.matches[matchIndex].score1 = score1;
    tournament.matches[matchIndex].score2 = score2;
    tournament.matches[matchIndex].winner = winner;
    tournament.matches[matchIndex].status = winner ? 'completed' : 'live';

    // Update tournament status
    await tournament.save();

    return res.json({
      message: 'Match updated successfully',
      tournament,
    });
  } catch (err) {
    console.error('Error updating match:', err);
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
