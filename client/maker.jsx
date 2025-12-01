const helper = require('./helper.js');
const React = require('react');
const { useState, useEffect } = React;
const { createRoot } = require('react-dom/client');

const handleTournament = (e, onTournamentAdded) => {
    e.preventDefault();
    helper.hideError();

    const name = e.target.querySelector('#tournamentName').value;
    const game = e.target.querySelector('#tournamentGame').value;
    const maxParticipants = e.target.querySelector('#maxParticipants').value;
    const bracketType = e.target.querySelector('#bracketType').value;

    if (!name || !game || !maxParticipants) {
        helper.handleError('All fields are required!');
        return false;
    }

    helper.sendPost(e.target.action, { 
        name, 
        game, 
        maxParticipants: parseInt(maxParticipants),
        bracketType 
    }, onTournamentAdded);
    
    return false;
};

const TournamentForm = (props) => {
    return (
        <form id='tournamentForm'
            onSubmit={(e) => handleTournament(e, props.triggerReload)}
            name='tournamentForm'
            action='/maker'
            method='POST'
            className='tournamentForm'
        >
            <h2>Create New Tournament</h2>
            <label htmlFor='name'>Tournament Name: </label>
            <input id='tournamentName' type="text" name='name' placeholder='Enter tournament name' />
            
            <label htmlFor='game'>Game: </label>
            <input id='tournamentGame' type="text" name='game' placeholder='e.g., Street Fighter, Valorant' />
            
            <label htmlFor='maxParticipants'>Max Participants: </label>
            <input id='maxParticipants' type="number" min='2' max='128' name='maxParticipants' defaultValue='8' />
            
            <label htmlFor='bracketType'>Bracket Type: </label>
            <select id='bracketType' name='bracketType'>
                <option value='single-elimination'>Single Elimination</option>
                <option value='double-elimination'>Double Elimination</option>
                <option value='round-robin'>Round Robin</option>
            </select>
            
            <input className='makeTournamentSubmit' type='submit' value='Create Tournament' />
        </form>
    );
};

const Match = ({ match, onUpdateScore }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [score1, setScore1] = useState(match.score1 || '');
    const [score2, setScore2] = useState(match.score2 || '');

    const handleSave = () => {
        const numScore1 = parseInt(score1) || 0;
        const numScore2 = parseInt(score2) || 0;
        let winner = null;

        if (numScore1 > numScore2) {
            winner = match.player1;
        } else if (numScore2 > numScore1) {
            winner = match.player2;
        }

        onUpdateScore(match._id, numScore1, numScore2, winner);
        setIsEditing(false);
    };

    return (
        <div className={`match ${match.status}`}>
            <div className="match-info">
                <span className="match-id">Match {match.matchNumber} - Round {match.round}</span>
            </div>
            <div className="match-players">
                <div className={`player ${match.winner === match.player1 ? 'winner' : ''}`}>
                    <span className="player-name">{match.player1 || 'TBD'}</span>
                    {!isEditing ? (
                        <span className="score">{match.score1 !== null && match.score1 !== undefined ? match.score1 : '-'}</span>
                    ) : (
                        <input 
                            type="number" 
                            value={score1} 
                            onChange={(e) => setScore1(e.target.value)}
                            className="score-input"
                        />
                    )}
                </div>
                <div className="vs">VS</div>
                <div className={`player ${match.winner === match.player2 ? 'winner' : ''}`}>
                    <span className="player-name">{match.player2 || 'TBD'}</span>
                    {!isEditing ? (
                        <span className="score">{match.score2 !== null && match.score2 !== undefined ? match.score2 : '-'}</span>
                    ) : (
                        <input 
                            type="number" 
                            value={score2} 
                            onChange={(e) => setScore2(e.target.value)}
                            className="score-input"
                        />
                    )}
                </div>
            </div>
            <div className="match-actions">
                {!isEditing ? (
                    <button type="button" onClick={() => setIsEditing(true)}>Enter Score</button>
                ) : (
                    <button type="button" onClick={handleSave}>Save</button>
                )}
            </div>
        </div>
    );
};

const BracketRound = ({ round, onUpdateScore }) => {
    return (
        <div className="bracket-round">
            <h3>{round.name}</h3>
            <div className="matches">
                {round.matches.map(match => (
                    <Match 
                        key={match._id} 
                        match={match} 
                        onUpdateScore={onUpdateScore}
                    />
                ))}
            </div>
        </div>
    );
};

const TournamentList = (props) => {
    const [tournaments, setTournaments] = useState(props.tournaments);

    useEffect(() => {
        const loadTournamentsFromServer = async () => {
            try {
                const response = await fetch('/getTournaments');
                const data = await response.json();
                if (data.tournaments) {
                    setTournaments(data.tournaments);
                }
            } catch (err) {
                console.error('Error loading tournaments:', err);
                helper.handleError('Error loading tournaments');
            }
        };
        loadTournamentsFromServer();
    }, [props.reloadTournaments]);

    const deleteTournament = async (tournamentId) => {
        if (!confirm('Are you sure you want to delete this tournament?')) {
            return;
        }

        try {
            const response = await fetch('/deleteTournament', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tournamentId }),
            });

            const result = await response.json();

            if (result.error) {
                alert(result.error);
            } else {
                props.triggerReload();
            }
        } catch (err) {
            console.error('Error deleting tournament:', err);
            alert('Error deleting tournament!');
        }
    };

    const updateMatchScore = async (matchId, score1, score2, winner) => {
        try {
            const response = await fetch('/updateMatch', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ matchId, score1, score2, winner }),
            });

            const result = await response.json();

            if (result.error) {
                alert(result.error);
            } else {
                props.triggerReload();
            }
        } catch (err) {
            console.error('Error updating match:', err);
            alert('Error updating match score!');
        }
    };

    if (tournaments.length === 0) {
        return (
            <div className='tournamentList'>
                <h3 className='emptyTournament'>No Tournaments Yet! Create one above to get started.</h3>
            </div>
        );
    }

    const tournamentNodes = tournaments.map(tournament => {
        // Generate bracket rounds
        const rounds = {};
        if (tournament.matches && tournament.matches.length > 0) {
            tournament.matches.forEach(match => {
                if (!rounds[match.round]) {
                    rounds[match.round] = {
                        name: `Round ${match.round}`,
                        matches: []
                    };
                }
                rounds[match.round].matches.push(match);
            });
        }

        const roundNodes = Object.values(rounds).map(round => (
            <BracketRound 
                key={round.name} 
                round={round} 
                onUpdateScore={updateMatchScore}
            />
        ));

        return (
            <div key={tournament._id} className='tournament'>
                <div className="tournament-header">
                    <h3 className='tournamentName'>{tournament.name}</h3>
                    <span className="tournamentGame">Game: {tournament.game}</span>
                    <span className="tournamentType">Type: {tournament.bracketType}</span>
                    <span className="tournamentStatus">Status: {tournament.status}</span>
                    <span className="tournamentParticipants">Participants: {tournament.participants ? tournament.participants.length : 0}</span>
                </div>
                
                {roundNodes.length > 0 ? (
                    <div className="bracket-container">
                        {roundNodes}
                    </div>
                ) : (
                    <div className="no-bracket">
                        <p>No bracket generated yet. This tournament is empty.</p>
                    </div>
                )}
                
                <div className="tournament-actions">
                    <button
                        className='deleteTournamentBtn'
                        onClick={() => deleteTournament(tournament._id)}
                    >
                        Delete Tournament
                    </button>
                </div>
            </div>
        );
    });

    return (
        <div className='tournamentList'>
            {tournamentNodes}
        </div>
    );
};

// Main App component
const App = () => {
    const [reloadTournaments, setReloadTournaments] = useState(false);

    const triggerReload = () => {
        setReloadTournaments(prev => !prev);
    };

    return (
        <div>
            <div id='makeTournament'>
                <TournamentForm triggerReload={triggerReload} />
            </div>
            <div id='tournaments'>
                <TournamentList 
                    tournaments={[]} 
                    reloadTournaments={reloadTournaments} 
                    triggerReload={triggerReload} 
                />
            </div>
        </div>
    );
};

const init = () => {
    const root = createRoot(document.getElementById('app'));
    root.render(<App />);
};

window.onload = init;