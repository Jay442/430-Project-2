const mongoose = require('mongoose');

// Match Schema
const MatchSchema = new mongoose.Schema({
  player1: {
    type: String,
    default: null,
  },
  player2: {
    type: String,
    default: null,
  },
  score1: {
    type: Number,
    default: null,
  },
  score2: {
    type: Number,
    default: null,
  },
  winner: {
    type: String,
    default: null,
  },
  round: {
    type: Number,
    required: true,
  },
  matchNumber: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'live', 'completed'],
    default: 'pending',
  },
  nextMatch: {
    type: mongoose.Schema.ObjectId,
    default: null,
  },
  bracketType: {
    type: String,
    enum: ['winners', 'losers', 'grand-finals'],
    default: 'winners',
  },
}, {
  timestamps: true,
});

// Tournament Schema
const TournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  game: {
    type: String,
    required: true,
    trim: true,
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 2,
    max: 128,
  },
  bracketType: {
    type: String,
    enum: ['single-elimination', 'double-elimination'],
    default: 'single-elimination',
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed'],
    default: 'pending',
  },
  participants: [{
    type: String,
    trim: true,
  }],
  matches: [MatchSchema],
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'Account',
    required: true,
  },
}, {
  timestamps: true,
});

// Helper function for single elimination bracket
const generateSingleEliminationBracket = function (validParticipants) {
  const matches = [];
  const participantCount = validParticipants.length;
  const totalRounds = Math.ceil(Math.log2(participantCount));
  const totalSlots = 2 ** totalRounds;

  // Winners side only due to single elim
  const shuffled = [...validParticipants];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const bracketParticipants = [...shuffled];
  while (bracketParticipants.length < totalSlots) {
    bracketParticipants.push(null);
  }

  let matchNumber = 1;
  for (let i = 0; i < bracketParticipants.length; i += 2) {
    const match = {
      player1: bracketParticipants[i],
      player2: bracketParticipants[i + 1],
      round: 1,
      matchNumber: matchNumber++,
      status: bracketParticipants[i] && bracketParticipants[i + 1] ? 'pending' : 'completed',
      bracketType: 'winners',
    };

    if (!bracketParticipants[i] || !bracketParticipants[i + 1]) {
      match.winner = bracketParticipants[i] || bracketParticipants[i + 1];
      match.status = 'completed';
    }

    matches.push(match);
  }

  let currentRoundMatches = matches.filter((m) => m.round === 1).length;
  let round = 2;

  while (currentRoundMatches > 1) {
    const matchesInRound = currentRoundMatches / 2;

    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        player1: 'TBD',
        player2: 'TBD',
        round,
        matchNumber: matchNumber++,
        status: 'pending',
        bracketType: 'winners',
      });
    }

    currentRoundMatches = matchesInRound;
    round++;
  }

  return matches;
};

// Helper function for double elimination bracket
const generateDoubleEliminationBracket = function (validParticipants) {
  const matches = [];
  const participantCount = validParticipants.length;
  const winnersRounds = Math.ceil(Math.log2(participantCount));
  const totalSlots = 2 ** winnersRounds;

  const shuffled = [...validParticipants];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const bracketParticipants = [...shuffled];
  while (bracketParticipants.length < totalSlots) {
    bracketParticipants.push(null);
  }

  let matchNumber = 1;
  const firstRoundMatches = [];

  for (let i = 0; i < bracketParticipants.length; i += 2) {
    const match = {
      player1: bracketParticipants[i],
      player2: bracketParticipants[i + 1],
      round: 1,
      matchNumber: matchNumber++,
      status: bracketParticipants[i] && bracketParticipants[i + 1] ? 'pending' : 'completed',
      bracketType: 'winners',
    };

    if (!bracketParticipants[i] || !bracketParticipants[i + 1]) {
      match.winner = bracketParticipants[i] || bracketParticipants[i + 1];
      match.status = 'completed';
    }

    firstRoundMatches.push(match);
    matches.push(match);
  }

  let currentWinnersMatches = firstRoundMatches.length;
  let round = 2;

  while (currentWinnersMatches > 1) {
    const matchesInRound = currentWinnersMatches / 2;

    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        player1: 'TBD',
        player2: 'TBD',
        round,
        matchNumber: matchNumber++,
        status: 'pending',
        bracketType: 'winners',
      });
    }

    currentWinnersMatches = matchesInRound;
    round++;
  }

  // Losers bracket
  const losersStartRound = round;
  const losersRound1Matches = Math.max(1, firstRoundMatches.length / 2);
  for (let i = 0; i < losersRound1Matches; i++) {
    matches.push({
      player1: 'TBD',
      player2: 'TBD',
      round: losersStartRound,
      matchNumber: matchNumber++,
      status: 'pending',
      bracketType: 'losers',
    });
  }

  let currentLosersMatches = losersRound1Matches;
  let losersRound = losersStartRound + 1;

  while (currentLosersMatches > 1) {
    const matchesInRound = Math.ceil(currentLosersMatches / 2);

    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        player1: 'TBD',
        player2: 'TBD',
        round: losersRound,
        matchNumber: matchNumber++,
        status: 'pending',
        bracketType: 'losers',
      });
    }

    currentLosersMatches = matchesInRound;
    losersRound++;
  }

  matches.push({
    player1: 'TBD',
    player2: 'TBD',
    round: losersRound,
    matchNumber: matchNumber++,
    status: 'pending',
    bracketType: 'grand-finals',
  });

  return matches;
};

// Static method to generate bracket matches
TournamentSchema.statics.generateBracket = function (participants, bracketType) {
  const validParticipants = participants.filter((p) => p !== null && p !== undefined);

  if (bracketType === 'single-elimination') {
    return generateSingleEliminationBracket(validParticipants);
  } if (bracketType === 'double-elimination') {
    return generateDoubleEliminationBracket(validParticipants);
  }

  return generateSingleEliminationBracket(validParticipants);
};

// Method to update tournament status
TournamentSchema.methods.updateStatus = function () {
  const hasStarted = this.matches.some((match) => match.status === 'live' || match.status === 'completed');

  const allCompleted = this.matches.every((match) => match.status === 'completed' || !match.player1 || !match.player2);

  if (allCompleted) {
    this.status = 'completed';
  } else if (hasStarted) {
    this.status = 'active';
  } else {
    this.status = 'pending';
  }

  return this.save();
};

const TournamentModel = mongoose.model('Tournament', TournamentSchema);

module.exports = TournamentModel;
