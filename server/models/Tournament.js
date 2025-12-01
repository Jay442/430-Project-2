const mongoose = require('mongoose');

// Match Schema
const MatchSchema = new mongoose.Schema({
  player1: {
    type: String,
    default: null
  },
  player2: {
    type: String,
    default: null
  },
  score1: {
    type: Number,
    default: null
  },
  score2: {
    type: Number,
    default: null
  },
  winner: {
    type: String,
    default: null
  },
  round: {
    type: Number,
    required: true
  },
  matchNumber: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'live', 'completed'],
    default: 'pending'
  },
  nextMatch: {
    type: mongoose.Schema.ObjectId,
    default: null
  }
}, {
  timestamps: true
});

// Tournament Schema
const TournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  game: {
    type: String,
    required: true,
    trim: true
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 2,
    max: 128
  },
  bracketType: {
    type: String,
    enum: ['single-elimination', 'double-elimination', 'round-robin'],
    default: 'single-elimination'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed'],
    default: 'pending'
  },
  participants: [{
    type: String,
    trim: true
  }],
  matches: [MatchSchema],
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'Account',
    required: true
  }
}, {
  timestamps: true
});

// Static method to generate bracket matches
TournamentSchema.statics.generateBracket = function(participants, bracketType) {
  const matches = [];
  
  if (bracketType === 'single-elimination') {
    // Calculate number of rounds needed
    const participantCount = participants.length;
    const totalSlots = Math.pow(2, Math.ceil(Math.log2(participantCount)));
    
    let round = 1;
    let currentRoundParticipants = [...participants];
    
    // Add byes
    while (currentRoundParticipants.length < totalSlots) {
      currentRoundParticipants.push(null);
    }
    
    // Generate first round matches
    let matchNumber = 1;
    for (let i = 0; i < currentRoundParticipants.length; i += 2) {
      matches.push({
        player1: currentRoundParticipants[i],
        player2: currentRoundParticipants[i + 1],
        round: round,
        matchNumber: matchNumber++,
        status: currentRoundParticipants[i] && currentRoundParticipants[i + 1] ? 'pending' : 'completed'
      });
    }
    
    // Generate subsequent rounds
    let nextRoundMatchCount = matches.length / 2;
    round++;
    
    while (nextRoundMatchCount >= 1) {
      for (let i = 0; i < nextRoundMatchCount; i++) {
        matches.push({
          player1: null,
          player2: null,
          round: round,
          matchNumber: matchNumber++,
          status: 'pending'
        });
      }
      nextRoundMatchCount = Math.floor(nextRoundMatchCount / 2);
      round++;
    }
  }
  
  return matches;
};

// Method to update tournament status
TournamentSchema.methods.updateStatus = function() {
  const hasStarted = this.matches.some(match => 
    match.status === 'live' || match.status === 'completed'
  );
  
  const allCompleted = this.matches.every(match => 
    match.status === 'completed' || !match.player1 || !match.player2
  );
  
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