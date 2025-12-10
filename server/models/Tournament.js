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

  console.log('=== SINGLE ELIMINATION BRACKET ===');
  console.log(`Participants: ${participantCount}, Rounds: ${totalRounds}, Slots: ${totalSlots}`);

  // Shuffle participants
  const shuffled = [...validParticipants];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const bracketParticipants = [...shuffled];
  while (bracketParticipants.length < totalSlots) {
    bracketParticipants.push(null);
  }

  console.log(`Participants: ${bracketParticipants.join(', ')}`);

  // Create bracket rounds
  let round = 1;
  let matchesInRound = totalSlots / 2;

  while (matchesInRound >= 1) {
    console.log(`\nCreating Round ${round} with ${matchesInRound} matches`);

    // Match numbers reset to 1 for each round
    let matchNumber = 1;

    if (round === 1) {
      // Round 1: Create matches with actual participants
      for (let i = 0; i < bracketParticipants.length; i += 2) {
        const match = {
          player1: bracketParticipants[i] || 'TBD',
          player2: bracketParticipants[i + 1] || 'TBD',
          round,
          matchNumber: matchNumber++,
          status: 'pending',
          bracketType: 'winners',
          score1: null,
          score2: null,
          winner: null,
        };

        // Handle byes (if a player gets a bye, they automatically win)
        if (!bracketParticipants[i] || !bracketParticipants[i + 1]) {
          match.winner = bracketParticipants[i] || bracketParticipants[i + 1];
          match.status = 'completed';
          match.score1 = bracketParticipants[i] ? 1 : 0;
          match.score2 = bracketParticipants[i + 1] ? 1 : 0;
        }

        matches.push(match);
        console.log(`Match ${match.matchNumber}: ${match.player1} vs ${match.player2}`);
      }
    } else {
      // Subsequent rounds: Create empty matches
      for (let i = 0; i < matchesInRound; i++) {
        const match = {
          player1: 'TBD',
          player2: 'TBD',
          round,
          matchNumber: matchNumber++,
          status: 'pending',
          bracketType: 'winners',
          score1: null,
          score2: null,
          winner: null,
        };

        matches.push(match);
        console.log(`Match ${match.matchNumber}: ${match.player1} vs ${match.player2}`);
      }
    }

    // Prepare for next round
    matchesInRound /= 2;
    round++;
  }

  console.log(`\nTotal matches created: ${matches.length}`);
  return matches;
};

// Helper function for double elimination bracket
const generateDoubleEliminationBracket = function (validParticipants) {
  const matches = [];
  const participantCount = validParticipants.length;
  const winnersRounds = Math.ceil(Math.log2(participantCount));
  const totalSlots = 2 ** winnersRounds;

  console.log('=== DOUBLE ELIMINATION BRACKET ===');
  console.log(`Participants: ${participantCount}, Winners Rounds: ${winnersRounds}, Total Slots: ${totalSlots}`);

  // Shuffle participants
  const shuffled = [...validParticipants];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const bracketParticipants = [...shuffled];
  while (bracketParticipants.length < totalSlots) {
    bracketParticipants.push(null);
  }

  console.log(`Participants: ${bracketParticipants.join(', ')}`);

  // 1. CREATE WINNERS BRACKET (positive round numbers)
  console.log('\n=== CREATING WINNERS BRACKET ===');

  // Create winners bracket rounds
  let winnersRound = 1;
  let matchesInRound = totalSlots / 2;

  while (matchesInRound >= 1) {
    console.log(`\nWinners Round ${winnersRound}: ${matchesInRound} matches`);

    let matchNumber = 1; // Reset for each round

    if (winnersRound === 1) {
      // Round 1: Create matches with participants
      for (let i = 0; i < bracketParticipants.length; i += 2) {
        const match = {
          player1: bracketParticipants[i] || 'TBD',
          player2: bracketParticipants[i + 1] || 'TBD',
          round: winnersRound,
          matchNumber: matchNumber++,
          status: 'pending',
          bracketType: 'winners',
          score1: null,
          score2: null,
          winner: null,
        };

        // Handle byes
        if (!bracketParticipants[i] || !bracketParticipants[i + 1]) {
          match.winner = bracketParticipants[i] || bracketParticipants[i + 1];
          match.status = 'completed';
          match.score1 = bracketParticipants[i] ? 1 : 0;
          match.score2 = bracketParticipants[i + 1] ? 1 : 0;
        }

        matches.push(match);
        console.log(`Match ${match.matchNumber}: ${match.player1} vs ${match.player2}`);
      }
    } else {
      // Other rounds: Create empty matches
      for (let i = 0; i < matchesInRound; i++) {
        const match = {
          player1: 'TBD',
          player2: 'TBD',
          round: winnersRound,
          matchNumber: matchNumber++,
          status: 'pending',
          bracketType: 'winners',
          score1: null,
          score2: null,
          winner: null,
        };

        matches.push(match);
        console.log(`Match ${match.matchNumber}: ${match.player1} vs ${match.player2}`);
      }
    }

    // Prepare for next round
    matchesInRound /= 2;
    if (matchesInRound >= 1) {
      winnersRound++;
    }
  }

  const lastWinnersRound = winnersRound;
  console.log(`Winners bracket complete. Last round: ${lastWinnersRound}`);

  // 2. CREATE LOSERS BRACKET WITH NEGATIVE NUMBERS
  console.log('\n=== CREATING LOSERS BRACKET ===');

  // Start losers bracket at -1 (negative numbers)
  let losersRound = -1;

  // Calculate losers bracket structure correctly
  // Round 1: totalSlots / 4 matches
  // Each size repeats twice before halving

  let currentSize = totalSlots / 4; // This is correct: totalParticipants/4
  console.log(`Losers Round 1 size: ${currentSize} matches (totalSlots / 4 = ${totalSlots} / 4)`);

  // Keep creating rounds until we have two rounds of 1 match
  while (true) {
    // Create two rounds with current size
    for (let repeat = 0; repeat < 2; repeat++) {
      if (currentSize === 0) break;

      console.log(`\nLosers Round ${Math.abs(losersRound)}: ${currentSize} matches`);

      let matchNumber = 1; // Reset for each round

      // Create matches for current round with NEGATIVE round number
      for (let i = 0; i < currentSize; i++) {
        const match = {
          player1: 'TBD',
          player2: 'TBD',
          round: losersRound, // NEGATIVE number
          matchNumber: matchNumber++,
          status: 'pending',
          bracketType: 'losers',
          score1: null,
          score2: null,
          winner: null,
        };

        matches.push(match);
        console.log(`Match ${match.matchNumber}: ${match.player1} vs ${match.player2}`);
      }

      // Decrement (go more negative: -1, -2, -3, etc.)
      losersRound--;
    }

    // Halve the size for next pair of rounds
    currentSize = Math.floor(currentSize / 2);

    // Stop when we've created the final pair of 1-match rounds (Losers Finals)
    if (currentSize === 0) {
      console.log('\nLosers bracket complete.');
      break;
    }
  }

  const lastLosersRound = losersRound + 1; // Add 1 because we decremented after creating last round

  // 3. CREATE GRAND FINALS (also negative but different bracketType)
  console.log('\n=== CREATING GRAND FINALS ===');

  const grandFinalsMatch = {
    player1: 'TBD', // Winners bracket champion
    player2: 'TBD', // Losers bracket champion
    round: lastLosersRound - 1, // Continue negative sequence
    matchNumber: 1,
    status: 'pending',
    bracketType: 'grand-finals',
    score1: null,
    score2: null,
    winner: null,
  };

  matches.push(grandFinalsMatch);
  console.log(`Grand Finals: ${grandFinalsMatch.player1} vs ${grandFinalsMatch.player2}`);

  // 4. SUMMARY
  console.log('\n=== BRACKET SUMMARY ===');
  console.log(`Total matches: ${matches.length}`);

  // Count matches by bracket type
  const bracketCounts = { winners: 0, losers: 0, 'grand-finals': 0 };
  matches.forEach((match) => {
    bracketCounts[match.bracketType]++;
  });

  console.log(`Winners matches: ${bracketCounts.winners}`);
  console.log(`Losers matches: ${bracketCounts.losers}`);
  console.log(`Grand finals matches: ${bracketCounts['grand-finals']}`);

  // Show bracket structure
  console.log('\n=== BRACKET STRUCTURE ===');

  // Group matches by bracket type and round
  const winnersRoundsMap = {};
  const losersRoundsMap = {};
  const grandFinalsRounds = [];

  matches.forEach((match) => {
    if (match.bracketType === 'winners') {
      if (!winnersRoundsMap[match.round]) winnersRoundsMap[match.round] = [];
      winnersRoundsMap[match.round].push(match);
    } else if (match.bracketType === 'losers') {
      const displayRound = Math.abs(match.round);
      if (!losersRoundsMap[displayRound]) losersRoundsMap[displayRound] = [];
      losersRoundsMap[displayRound].push(match);
    } else if (match.bracketType === 'grand-finals') {
      grandFinalsRounds.push(match);
    }
  });

  console.log('Winners Bracket (positive rounds):');
  Object.keys(winnersRoundsMap).sort((a, b) => a - b).forEach((roundNum) => {
    console.log(`  Round ${roundNum}: ${winnersRoundsMap[roundNum].length} matches`);
  });

  console.log('\nLosers Bracket (negative rounds, displayed as positive):');
  Object.keys(losersRoundsMap).sort((a, b) => a - b).forEach((roundNum) => {
    console.log(`  Round ${roundNum}: ${losersRoundsMap[roundNum].length} matches`);
  });

  if (grandFinalsRounds.length > 0) {
    console.log(`\nGrand Finals: ${grandFinalsRounds.length} match`);
  }

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
