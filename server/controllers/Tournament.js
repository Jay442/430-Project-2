const models = require('../models');

const makerPage = (req, res) => {
  res.render('app');
};

const createTournament = async (req, res) => {
  if (!req.body.name || !req.body.game || !req.body.maxParticipants) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  try {
    // Generate initial participants
    const participants = [];
    const participantCount = Math.min(req.body.maxParticipants, 8);
    for (let i = 1; i <= participantCount; i++) {
      participants.push(`Player ${i}`);
    }

    // Generate bracket matches
    const matches = models.Tournament.generateBracket(participants, req.body.bracketType);

    const tournamentData = {
      name: req.body.name,
      game: req.body.game,
      maxParticipants: req.body.maxParticipants,
      bracketType: req.body.bracketType,
      participants: participants,
      matches: matches,
      owner: req.session.account._id
    };

    const newTournament = new models.Tournament(tournamentData);
    await newTournament.save();

    return res.json({ 
      tournament: newTournament,
      redirect: `/maker`
    });
  } catch (err) {
    console.error('Error creating tournament:', err);
    return res.status(400).json({ error: 'An error occurred' });
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
      owner: req.session.account._id
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
    const { matchId, score1, score2, winner } = req.body;

    if (!matchId) {
      return res.status(400).json({ error: 'Match ID required' });
    }

    // Find tournament containing this match
    const tournament = await models.Tournament.findOne({
      'matches._id': matchId,
      owner: req.session.account._id
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Update the match
    const matchIndex = tournament.matches.findIndex(match => match._id.toString() === matchId);
    if (matchIndex === -1) {
      return res.status(404).json({ error: 'Match not found' });
    }

    tournament.matches[matchIndex].score1 = score1;
    tournament.matches[matchIndex].score2 = score2;
    tournament.matches[matchIndex].winner = winner;
    tournament.matches[matchIndex].status = winner ? 'completed' : 'live';

    // Update tournament status
    await tournament.updateStatus();

    return res.json({ 
      message: 'Match updated successfully',
      tournament: tournament
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
  updateMatch
};