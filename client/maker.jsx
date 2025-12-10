const helper = require('./helper.js');
const React = require('react');
const { useState, useEffect, useCallback } = React;
const { createRoot } = require('react-dom/client');

// Toast pop up for updates
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
            'bg-blue-500';

    return (
        <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300`}>
            <div className="flex items-center justify-between">
                <span className="font-medium">{message}</span>
                <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
                    ✕
                </button>
            </div>
        </div>
    );
};

// Component for inserting players
const ParticipantInputs = ({ maxParticipants, participants, setParticipants }) => {
    const getGridColsClass = (count) => {
        if (count <= 8) return "md:grid-cols-2";
        if (count <= 16) return "md:grid-cols-2 lg:grid-cols-3";
        if (count <= 32) return "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
        return "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";
    };

    const handleParticipantChange = (index, value) => {
        const newParticipants = [...participants];
        newParticipants[index] = value;
        setParticipants(newParticipants);
    };

    const slots = Array.from({ length: maxParticipants }, (_, i) => i);

    return (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Participants ({participants.filter(p => p.trim()).length}/{maxParticipants})
            </h3>
            <p className="text-sm text-gray-500 mb-4">
                Enter participant names. Empty slots will be filled with default names.
            </p>

            <div className={`grid grid-cols-1 ${getGridColsClass(maxParticipants)} gap-4`}>
                {slots.map((index) => (
                    <div key={index} className="flex items-center">
                        <span className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-full text-sm font-medium mr-3">
                            {index + 1}
                        </span>
                        <input
                            type="text"
                            value={participants[index] || ''}
                            onChange={(e) => handleParticipantChange(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={`Player ${index + 1}`}
                        />
                    </div>
                ))}
            </div>

        </div>
    );
};

// Component for the actual form itself
const TournamentForm = ({ triggerReload, showToast }) => {
    const [formData, setFormData] = useState({
        name: '',
        game: '',
        maxParticipants: 8,
        bracketType: 'single-elimination',
    });

    const [participants, setParticipants] = useState(Array(8).fill(''));
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const newLength = parseInt(formData.maxParticipants) || 8;
        const newParticipants = [...participants];

        if (newLength > participants.length) {
            const toAdd = newLength - participants.length;
            newParticipants.push(...Array(toAdd).fill(''));
        } else if (newLength < participants.length) {
            newParticipants.length = newLength;
        }

        setParticipants(newParticipants);
    }, [formData.maxParticipants]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'maxParticipants' ? parseInt(value) || 8 : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        helper.hideError();

        const processedParticipants = participants.map((name, index) =>
            name.trim() || `Player ${index + 1}`
        );

        const tournamentData = {
            ...formData,
            participants: processedParticipants
        };

        try {
            await helper.sendPost('/maker', tournamentData, () => {
                showToast('Tournament created successfully!', 'success');
                setFormData({
                    name: '',
                    game: '',
                    maxParticipants: 8,
                    bracketType: 'single-elimination',
                });
                setParticipants(Array(8).fill(''));
                triggerReload();
            });
        } catch (error) {
            showToast(error.message || 'Failed to create tournament', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const games = ['Valorant', 'League of Legends', 'CS:GO', 'Dota 2', 'Street Fighter 6', 'Tekken 8', 'Super Smash Bros', 'Rocket League', 'Overwatch 2', 'Fortnite'];

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 ml-3">Create New Tournament</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tournament Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="e.g., Winter Championship"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Game *
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                name="game"
                                value={formData.game}
                                onChange={handleChange}
                                list="gameSuggestions"
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="Select or type a game"
                            />
                            <datalist id="gameSuggestions">
                                {games.map(game => (
                                    <option key={game} value={game} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Participants *
                        </label>
                        <div className="relative">
                            <select
                                name="maxParticipants"
                                value={formData.maxParticipants}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white"
                            >
                                <option value="2">2 Players</option>
                                <option value="4">4 Players</option>
                                <option value="8">8 Players</option>
                                <option value="16">16 Players</option>
                                <option value="32">32 Players</option>
                                <option value="64">64 Players</option>
                                <option value="128">128 Players</option>
                            </select>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                            Must be a power of 2 for elimination brackets
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bracket Type *
                        </label>
                        <select
                            name="bracketType"
                            value={formData.bracketType}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white"
                        >
                            <option value="single-elimination">🏆 Single Elimination</option>
                            <option value="double-elimination">🥈 Double Elimination</option>
                        </select>
                    </div>
                </div>

                <ParticipantInputs
                    maxParticipants={formData.maxParticipants}
                    participants={participants}
                    setParticipants={setParticipants}
                />

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-300 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Creating...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Create Tournament
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Create bracket rounds based on the inputed tournment params
const generateBracketRounds = (matches, maxParticipants, bracketType) => {
    const rounds = {};

    if (!matches || matches.length === 0) {
        return rounds;
    }

    const sortedMatches = [...matches].sort((a, b) => {
        if (a.round !== b.round) return a.round - b.round;
        return a.matchNumber - b.matchNumber;
    });

    sortedMatches.forEach(match => {
        if (!rounds[match.round]) {
            let roundName = `Round ${match.round}`;
            let isLosersBracket = false;

            const matchBracketType = match.bracketType || 'winners';
            
            if (bracketType === 'single-elimination') {
                const totalRounds = Math.ceil(Math.log2(maxParticipants));
                if (match.round === totalRounds) roundName = 'Finals';
                else if (match.round === totalRounds - 1) roundName = 'Semi-Finals';
                else if (match.round === totalRounds - 2) roundName = 'Quarter-Finals';
                isLosersBracket = false;
            } else if (bracketType === 'double-elimination') {
                if (matchBracketType === 'losers') {
                    isLosersBracket = true;
                    const losersRoundNum = match.round;
                    
                    const winnersRounds = Math.ceil(Math.log2(maxParticipants));
                    const losersActualRound = losersRoundNum - winnersRounds;
                    
                    if (losersRoundNum === Math.max(...matches.map(m => m.round))) {
                        roundName = 'Grand Finals';
                    } else if (losersActualRound === 1) {
                        roundName = 'Losers Round 1';
                    } else if (losersActualRound === 2) {
                        roundName = 'Losers Round 2';
                    } else {
                        roundName = `Losers Round ${losersActualRound}`;
                    }
                } else if (matchBracketType === 'grand-finals') {
                    isLosersBracket = true;
                    roundName = 'Grand Finals';
                } else {
                    isLosersBracket = false;
                    const winnersRounds = Math.ceil(Math.log2(maxParticipants));
                    
                    if (match.round === winnersRounds) roundName = 'Winners Finals';
                    else if (match.round === winnersRounds - 1) roundName = 'Winners Semi-Finals';
                    else if (match.round === winnersRounds - 2) roundName = 'Winners Quarter-Finals';
                    else roundName = `Winners Round ${match.round}`;
                }
            }

            rounds[match.round] = {
                name: roundName,
                matches: [],
                isLosersBracket: isLosersBracket
            };
        }
        rounds[match.round].matches.push(match);
    });

    return rounds;
};

// Match component that includes 2 players and result
const Match = ({ match, onUpdateScore, isFirstInRound, isLastInRound, showToast }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [scores, setScores] = useState({
        score1: match.score1 || '',
        score2: match.score2 || ''
    });

    const handleSave = () => {
        const score1 = parseInt(scores.score1) || 0;
        const score2 = parseInt(scores.score2) || 0;

        if (score1 === score2) {
            showToast('Scores cannot be equal!', 'error');
            return;
        }

        let winner = score1 > score2 ? match.player1 : match.player2;

        onUpdateScore(match._id, score1, score2, winner);
        setIsEditing(false);
    };

    const getBracketTypeLabel = () => {
        const bracketType = match.bracketType || 'winners';
        if (bracketType === 'winners') return 'W';
        if (bracketType === 'losers') return 'L';
        if (bracketType === 'grand-finals') return 'GF';
        return 'W';
    };

    return (
        <div className={`relative ${isFirstInRound ? 'mt-0' : 'mt-8'}`}>
            {!isLastInRound && (
                <div className="absolute left-6 top-full h-8 w-0.5 bg-gray-300"></div>
            )}

            {match.round > 1 && (
                <div className="absolute -left-8 top-1/2 w-8 h-0.5 bg-gray-300"></div>
            )}

            <div className={`bg-white rounded-lg border-2 ${match.winner ? 'border-green-500 shadow-lg' : 'border-gray-200 shadow'} p-4 min-w-[280px] transition-all hover:shadow-md`}>
                <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {getBracketTypeLabel()} • Round {match.round} • Match {match.matchNumber}
                    </span>
                    {match.status === 'completed' && (
                        <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                            Completed
                        </span>
                    )}
                </div>

                <div className="space-y-3">
                    <div className={`flex items-center justify-between p-3 rounded-lg ${match.winner === match.player1 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                                1
                            </div>
                            <span className={`font-medium ${match.winner === match.player1 ? 'text-green-700' : 'text-gray-700'}`}>
                                {match.player1 || 'TBD'}
                            </span>
                        </div>
                        {isEditing ? (
                            <input
                                type="number"
                                value={scores.score1}
                                onChange={(e) => setScores(prev => ({ ...prev, score1: e.target.value }))}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                min="0"
                            />
                        ) : (
                            <span className={`text-xl font-bold ${match.winner === match.player1 ? 'text-green-600' : 'text-gray-600'}`}>
                                {match.score1 !== null && match.score1 !== undefined ? match.score1 : '-'}
                            </span>
                        )}
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-3 bg-white text-sm text-gray-500 font-semibold">VS</span>
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-lg ${match.winner === match.player2 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                                2
                            </div>
                            <span className={`font-medium ${match.winner === match.player2 ? 'text-green-700' : 'text-gray-700'}`}>
                                {match.player2 || 'TBD'}
                            </span>
                        </div>
                        {isEditing ? (
                            <input
                                type="number"
                                value={scores.score2}
                                onChange={(e) => setScores(prev => ({ ...prev, score2: e.target.value }))}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                min="0"
                            />
                        ) : (
                            <span className={`text-xl font-bold ${match.winner === match.player2 ? 'text-green-600' : 'text-gray-600'}`}>
                                {match.score2 !== null && match.score2 !== undefined ? match.score2 : '-'}
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                    {!isEditing ? (
                        !match.winner && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition flex items-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Enter Score
                            </button>
                        )
                    ) : (
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition"
                            >
                                Save Score
                            </button>
                        </div>
                    )}
                </div>

                {match.winner && (
                    <div className="mt-3 p-2 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg">
                        <div className="flex items-center justify-center">
                            <svg className="w-4 h-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-semibold text-yellow-700">
                                Winner: <span className="text-yellow-800">{match.winner}</span>
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Each individual round of bracket
const BracketRound = ({ round, matches, onUpdateScore, showToast }) => {
    const bracketType = round.isLosersBracket ? 'losers' : 'winners';

    return (
        <div className="flex flex-col">
            <div className="mb-4">
                <div className="flex items-center">
                    <h3 className={`text-lg font-bold ${bracketType === 'losers' ? 'text-red-700' : 'text-gray-800'}`}>
                        {round.name}
                    </h3>
                    {bracketType === 'losers' && (
                        <span className="ml-2 px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
                            Losers Bracket
                        </span>
                    )}
                </div>
                <p className="text-sm text-gray-500">{matches.length} matches</p>
            </div>
            <div className="space-y-0">
                {matches.map((match, index) => (
                    <Match
                        key={match._id}
                        match={match}
                        onUpdateScore={onUpdateScore}
                        isFirstInRound={index === 0}
                        isLastInRound={index === matches.length - 1}
                        showToast={showToast}
                    />
                ))}
            </div>
        </div>
    );
};

// Visual card for tournments that displays information about bracket
const TournamentCard = ({ tournament, onDelete, onUpdateScore, showToast }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (isExpanded) {
            console.log('=== TOURNAMENT DEBUG INFO ===');
            console.log('Tournament name:', tournament.name);
            console.log('Bracket type:', tournament.bracketType);
            console.log('Max participants:', tournament.maxParticipants);
            console.log('Total matches:', tournament.matches?.length || 0);
            
            const matchesByBracket = {};
            tournament.matches?.forEach(match => {
                const type = match.bracketType || 'winners';
                if (!matchesByBracket[type]) matchesByBracket[type] = [];
                matchesByBracket[type].push(match);
            });
            console.log('Matches by bracket type:', matchesByBracket);
            
            const matchesByRound = {};
            tournament.matches?.forEach(match => {
                if (!matchesByRound[match.round]) matchesByRound[match.round] = [];
                matchesByRound[match.round].push(match);
            });
            console.log('Matches by round:', matchesByRound);
        }
    }, [isExpanded, tournament]);

    const rounds = generateBracketRounds(
        tournament.matches,
        tournament.maxParticipants,
        tournament.bracketType
    );

    const winnersRounds = {};
    const losersRounds = {};

    Object.entries(rounds).forEach(([roundNumber, roundData]) => {
        if (roundData.isLosersBracket) {
            losersRounds[roundNumber] = roundData;
        } else {
            winnersRounds[roundNumber] = roundData;
        }
    });

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">{tournament.name}</h3>
                            <span className="ml-3 px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800">
                                {tournament.bracketType.replace('-', ' ').toUpperCase()}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center text-gray-600">
                                <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span className="font-medium">{tournament.game}</span>
                            </div>

                            <div className="flex items-center text-gray-600">
                                <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-6.75a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z" />
                                </svg>
                                <span className="font-medium">{tournament.participants?.length || 0}/{tournament.maxParticipants} Players</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-medium rounded-lg hover:from-gray-200 hover:to-gray-300 transition flex items-center"
                        >
                            {isExpanded ? (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                    Hide Bracket
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    View Bracket
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => onDelete(tournament._id)}
                            className="px-4 py-2 bg-gradient-to-r from-red-100 to-red-200 text-red-700 font-medium rounded-lg hover:from-red-200 hover:to-red-300 transition flex items-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
                    {Object.keys(rounds).length > 0 ? (
                        <div>
                            {Object.keys(winnersRounds).length > 0 && (
                                <div className="mb-8">
                                    <h4 className="text-xl font-bold text-gray-800 mb-4">
                                        {tournament.bracketType === 'double-elimination' ? 'Winners Bracket' : 'Main Bracket'}
                                    </h4>
                                    <div className="overflow-x-auto">
                                        <div className="flex space-x-8 min-w-max pb-4">
                                            {Object.entries(winnersRounds).map(([roundNumber, roundData]) => (
                                                <BracketRound
                                                    key={`winners-${roundNumber}`}
                                                    round={roundData}
                                                    matches={roundData.matches}
                                                    onUpdateScore={onUpdateScore}
                                                    showToast={showToast}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {Object.keys(losersRounds).length > 0 && (
                                <div>
                                    <h4 className="text-xl font-bold text-gray-800 mb-4">Losers Bracket</h4>
                                    <div className="overflow-x-auto">
                                        <div className="flex space-x-8 min-w-max pb-4">
                                            {Object.entries(losersRounds).map(([roundNumber, roundData]) => (
                                                <BracketRound
                                                    key={`losers-${roundNumber}`}
                                                    round={roundData}
                                                    matches={roundData.matches}
                                                    onUpdateScore={onUpdateScore}
                                                    showToast={showToast}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-700 mb-2">No Bracket Generated</h4>
                            <p className="text-gray-500">The bracket will be generated when the tournament starts.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// List of all current and previous tournments
const TournamentList = ({ reloadTournaments, triggerReload, showToast }) => {
    const [tournaments, setTournaments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        loadTournaments();
    }, [reloadTournaments]);

    const loadTournaments = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/getTournaments');
            const data = await response.json();
            if (data.tournaments) {
                setTournaments(data.tournaments);
            }
        } catch (err) {
            console.error('Error loading tournaments:', err);
            showToast('Failed to load tournaments', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const deleteTournament = async (tournamentId) => {
        if (!window.confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch('/deleteTournament', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId }),
            });

            const result = await response.json();
            if (result.error) {
                showToast(result.error, 'error');
            } else {
                showToast('Tournament deleted successfully', 'success');
                triggerReload();
            }
        } catch (err) {
            console.error('Error deleting tournament:', err);
            showToast('Failed to delete tournament', 'error');
        }
    };

    const updateMatchScore = async (matchId, score1, score2, winner) => {
        try {
            const response = await fetch('/updateMatch', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, score1, score2, winner }),
            });

            const result = await response.json();
            if (result.error) {
                showToast(result.error, 'error');
            } else {
                showToast('Score updated successfully!', 'success');
                
                const updatedTournament = result.tournament;
                
                setTournaments(prevTournaments => 
                    prevTournaments.map(t => 
                        t._id === updatedTournament._id ? updatedTournament : t
                    )
                );
            }
        } catch (err) {
            console.error('Error updating match:', err);
            showToast('Failed to update score', 'error');
        }
    };

    const filteredTournaments = tournaments.filter(tournament => {
        const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tournament.game.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || tournament.bracketType === filterType;
        return matchesSearch && matchesType;
    });

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600">Loading tournaments...</p>
            </div>
        );
    }

    if (tournaments.length === 0) {
        return (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mb-6">
                    <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-3">No Tournaments Yet</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                    Create your first tournament to start organizing competitive events. Set up brackets, manage participants, and track scores all in one place.
                </p>
            </div>
        );
    }

    return (
        <div>
            <div className="bg-white rounded-xl shadow p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search tournaments..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                            <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        >
                            <option value="all">All Types</option>
                            <option value="single-elimination">Single Elimination</option>
                            <option value="double-elimination">Double Elimination</option>
                        </select>

                        <button
                            onClick={loadTournaments}
                            className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-medium rounded-lg hover:from-gray-200 hover:to-gray-300 transition flex items-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <p className="text-gray-600">
                        Showing <span className="font-bold">{filteredTournaments.length}</span> of <span className="font-bold">{tournaments.length}</span> tournaments
                    </p>
                </div>
            </div>

            <div>
                {filteredTournaments.map(tournament => (
                    <TournamentCard
                        key={tournament._id}
                        tournament={tournament}
                        onDelete={deleteTournament}
                        onUpdateScore={updateMatchScore}
                        showToast={showToast}
                    />
                ))}
            </div>
        </div>
    );
};

const App = () => {
    const [reloadTournaments, setReloadTournaments] = useState(false);
    const [toast, setToast] = useState(null);

    const triggerReload = useCallback(() => {
        setReloadTournaments(prev => !prev);
    }, []);

    const showToast = useCallback((message, type) => {
        setToast({ message, type });
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {toast && (
                <div className="fixed top-4 right-4 z-50 max-w-sm">
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                </div>
            )}

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Tournament Dashboard</h1>
                    <p className="text-gray-600">Create and manage competitive gaming tournaments</p>
                </div>

                <TournamentForm
                    triggerReload={triggerReload}
                    showToast={showToast}
                />

                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Tournaments</h2>
                    <TournamentList
                        reloadTournaments={reloadTournaments}
                        triggerReload={triggerReload}
                        showToast={showToast}
                    />
                </div>
            </div>
        </div>
    );
};

const init = () => {
    const root = createRoot(document.getElementById('app'));
    root.render(<App />);
};

window.onload = init;