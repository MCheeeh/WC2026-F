// ⚠️ CONFIGURATION : Remplacez par votre clé API gratuite
const API_KEY = e8f5821229bc8e9810bdec7c401274f1; // Obtenez-la sur https://www.api-football.com
const COMPETITION_ID = 1; // ID de la Coupe du Monde (1 = FIFA World Cup)

/**
 * État de l'application
 */
const state = {
    currentDate: new Date(),
    matches: [],
    bracketData: {
        roundOf16: [],
        quarterFinals: [],
        semiFinals: [],
        thirdPlace: [],
        final: []
    },
    isLoading: true,
    error: null,
    apiAvailable: true
};

/**
 * Liste des équipes participantes (codes FIFA)
 */
const TEAMS = [
    { code: 'ARG', name: 'Argentine', flag: '🇦🇷' },
    { code: 'BRA', name: 'Brésil', flag: '🇧🇷' },
    { code: 'FRA', name: 'France', flag: '🇫🇷' },
    { code: 'ENG', name: 'Angleterre', flag: '🇬🇧' },
    { code: 'ESP', name: 'Espagne', flag: '🇪🇸' },
    { code: 'GER', name: 'Allemagne', flag: '🇩🇪' },
    { code: 'ITA', name: 'Italie', flag: '🇮🇹' },
    { code: 'NED', name: 'Pays-Bas', flag: '🇳🇱' },
    { code: 'POR', name: 'Portugal', flag: '🇵🇹' },
    { code: 'URU', name: 'Uruguay', flag: '🇺🇾' },
    { code: 'MEX', name: 'Mexique', flag: '🇲🇽' },
    { code: 'USA', name: 'États-Unis', flag: '🇺🇸' },
    { code: 'JPN', name: 'Japon', flag: '🇯🇵' },
    { code: 'MAR', name: 'Maroc', flag: '🇲🇦' },
    { code: 'KOR', name: 'Corée du Sud', flag: '🇰🇷' },
    { code: 'AUS', name: 'Australie', flag: '🇦🇺' },
    { code: 'SEN', name: 'Sénégal', flag: '🇸🇳' },
    { code: 'DEN', name: 'Danemark', flag: '🇩🇰' },
    { code: 'SRB', name: 'Serbie', flag: '🇷🇸' },
    { code: 'CRO', name: 'Croatie', flag: '🇭🇷' },
    { code: 'BEL', name: 'Belgique', flag: '🇧🇪' },
    { code: 'SUI', name: 'Suisse', flag: '🇨🇭' },
    { code: 'POL', name: 'Pologne', flag: '🇵🇱' },
    { code: 'CZE', name: 'République tchèque', flag: '🇨🇿' }
];

/**
 * Initialisation de l'application
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Vérifier si l'API est disponible
        if (!API_KEY || API_KEY === 'YOUR_API_FOOTBALL_KEY') {
            throw new Error('Clé API manquante. Veuillez obtenir une clé sur https://www.api-football.com');
        }

        // Charger les données depuis l'API
        await loadDataFromAPI();

        // Mettre à jour l'interface
        updateUI();

        // Configurer les écouteurs d'événements
        setupEventListeners();

        // Démarrer le rafraîchissement automatique
        startAutoRefresh();

    } catch (error) {
        console.error('Erreur:', error);
        state.error = error;
        state.isLoading = false;
        state.apiAvailable = false;

        // Afficher le message d'erreur
        document.getElementById('error-message').style.display = 'block';
        document.querySelector('.loading').style.display = 'none';

        // Charger les données par défaut
        loadDefaultData();
        updateUI();
    }
});

/**
 * Charger les données depuis l'API-FOOTBALL
 */
async function loadDataFromAPI() {
    state.isLoading = true;
    document.querySelector('.loading').style.display = 'block';

    try {
        // Récupérer les matchs de la Coupe du Monde 2026
        const response = await fetch(
            `https://v3.football.api-sports.io/fixtures?competition=${COMPETITION_ID}&season=2026&phase=knockout`,
            {
                headers: {
                    'x-apisports-key': API_KEY
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.response || data.response.length === 0) {
            throw new Error('Aucun match trouvé pour la Coupe du Monde 2026');
        }

        // Convertir les données en format compatible
        state.matches = data.response.map(match => {
            const homeTeam = match.teams.home;
            const awayTeam = match.teams.away;
            const fixture = match.fixture;
            const goals = match.goals;

            return {
                id: fixture.id.toString(),
                date: new Date(fixture.date),
                dateObj: new Date(fixture.date),
                displayTime: new Date(fixture.date).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }),
                venue: fixture.venue.name || 'Inconnu',
                teams: [homeTeam.short, awayTeam.short],
                score: {
                    home: goals.home || 0,
                    away: goals.away || 0
                },
                winner: goals.home > goals.away ? homeTeam.short :
                       goals.away > goals.home ? awayTeam.short : null,
                status: match.fixture.status.short === 'FT' ? 'played' :
                       match.fixture.status.short === 'LIVE' ? 'live' : 'scheduled'
            };
        });

        // Générer les données du bracket
        generateBracketData();

        // Mettre à jour le statut de l'API
        document.getElementById('api-status').textContent = 'API: Connectée ✅';

    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        throw error;
    } finally {
        state.isLoading = false;
        document.querySelector('.loading').style.display = 'none';
    }
}

/**
 * Charger des données par défaut si l'API échoue
 */
function loadDefaultData() {
    console.warn('Utilisation des données par défaut (simulées)');

    // Données par défaut basées sur les pronostics courants
    state.matches = [
        {
            id: 'R16-1',
            date: new Date('2026-07-02T18:00:00Z'),
            dateObj: new Date('2026-07-02T18:00:00Z'),
            displayTime: '20:00',
            venue: 'AT&T Stadium, Dallas',
            teams: ['ARG', 'URU'],
            score: { home: 2, away: 1 },
            winner: 'ARG',
            status: 'played'
        },
        {
            id: 'R16-2',
            date: new Date('2026-07-02T21:00:00Z'),
            dateObj: new Date('2026-07-02T21:00:00Z'),
            displayTime: '23:00',
            venue: 'MetLife Stadium, New York',
            teams: ['FRA', 'GER'],
            score: { home: 3, away: 2 },
            winner: 'FRA',
            status: 'played'
        },
        {
            id: 'R16-3',
            date: new Date('2026-07-03T18:00:00Z'),
            dateObj: new Date('2026-07-03T18:00:00Z'),
            displayTime: '20:00',
            venue: 'SoFi Stadium, Los Angeles',
            teams: ['BRA', 'MEX'],
            score: { home: 1, away: 0 },
            winner: 'BRA',
            status: 'played'
        },
        {
            id: 'R16-4',
            date: new Date('2026-07-03T21:00:00Z'),
            dateObj: new Date('2026-07-03T21:00:00Z'),
            displayTime: '23:00',
            venue: 'Lumen Field, Seattle',
            teams: ['ENG', 'JPN'],
            score: { home: 2, away: 1 },
            winner: 'ENG',
            status: 'played'
        },
        {
            id: 'R16-5',
            date: new Date('2026-07-04T18:00:00Z'),
            dateObj: new Date('2026-07-04T18:00:00Z'),
            displayTime: '20:00',
            venue: 'BMO Field, Toronto',
            teams: ['ESP', 'POR'],
            score: { home: 3, away: 1 },
            winner: 'ESP',
            status: 'played'
        },
        {
            id: 'R16-6',
            date: new Date('2026-07-04T21:00:00Z'),
            dateObj: new Date('2026-07-04T21:00:00Z'),
            displayTime: '23:00',
            venue: 'Arrowhead Stadium, Kansas City',
            teams: ['NED', 'BEL'],
            score: { home: 2, away: 2 },
            winner: null, // Match nul, prolongations ou tirs au but
            status: 'played'
        },
        {
            id: 'R16-7',
            date: new Date('2026-07-05T18:00:00Z'),
            dateObj: new Date('2026-07-05T18:00:00Z'),
            displayTime: '20:00',
            venue: 'Cincinnati Bengals Stadium, Cincinnati',
            teams: ['ITA', 'CRO'],
            score: { home: 1, away: 0 },
            winner: 'ITA',
            status: 'played'
        },
        {
            id: 'R16-8',
            date: new Date('2026-07-05T21:00:00Z'),
            dateObj: new Date('2026-07-05T21:00:00Z'),
            displayTime: '23:00',
            venue: 'Levi\'s Stadium, San Francisco',
            teams: ['USA', 'MAR'],
            score: { home: 2, away: 1 },
            winner: 'USA',
            status: 'played'
        }
    ];

    generateBracketData();
}

/**
 * Générer les données du bracket à partir des matchs
 */
function generateBracketData() {
    // Round of 16
    state.bracketData.roundOf16 = state.matches
        .filter(m => m.id.startsWith('R16-'))
        .sort((a, b) => a.date - b.date);

    // Quarter Finals (basé sur les gagnants du Round of 16)
    state.bracketData.quarterFinals = [
        {
            id: 'QF-1',
            teams: [
                state.bracketData.roundOf16[0].winner || state.bracketData.roundOf16[0].teams[0],
                state.bracketData.roundOf16[1].winner || state.bracketData.roundOf16[1].teams[0]
            ],
            score: { home: 0, away: 0 },
            status: 'scheduled'
        },
        {
            id: 'QF-2',
            teams: [
                state.bracketData.roundOf16[2].winner || state.bracketData.roundOf16[2].teams[0],
                state.bracketData.roundOf16[3].winner || state.bracketData.roundOf16[3].teams[0]
            ],
            score: { home: 0, away: 0 },
            status: 'scheduled'
        },
        {
            id: 'QF-3',
            teams: [
                state.bracketData.roundOf16[4].winner || state.bracketData.roundOf16[4].teams[0],
                state.bracketData.roundOf16[5].winner || state.bracketData.roundOf16[5].teams[0]
            ],
            score: { home: 0, away: 0 },
            status: 'scheduled'
        },
        {
            id: 'QF-4',
            teams: [
                state.bracketData.roundOf16[6].winner || state.bracketData.roundOf16[6].teams[0],
                state.bracketData.roundOf16[7].winner || state.bracketData.roundOf16[7].teams[0]
            ],
            score: { home: 0, away: 0 },
            status: 'scheduled'
        }
    ];

    // Semi Finals
    state.bracketData.semiFinals = [
        {
            id: 'SF-1',
            teams: [
                state.bracketData.quarterFinals[0].winner || '?',
                state.bracketData.quarterFinals[1].winner || '?'
            ],
            score: { home: 0, away: 0 },
            status: 'scheduled'
        },
        {
            id: 'SF-2',
            teams: [
                state.bracketData.quarterFinals[2].winner || '?',
                state.bracketData.quarterFinals[3].winner || '?'
            ],
            score: { home: 0, away: 0 },
            status: 'scheduled'
        }
    ];

    // Third Place
    state.bracketData.thirdPlace = [
        {
            id: '3rd-place',
            teams: ['SF-1-loser', 'SF-2-loser'],
            score: { home: 0, away: 0 },
            status: 'scheduled'
        }
    ];

    // Final
    state.bracketData.final = [
        {
            id: 'final',
            teams: [
                state.bracketData.semiFinals[0].winner || '?',
                state.bracketData.semiFinals[1].winner || '?'
            ],
            score: { home: 0, away: 0 },
            status: 'scheduled'
        }
    ];
}

/**
 * Mettre à jour l'interface utilisateur
 */
function updateUI() {
    updateCurrentDate();
    renderCalendar();
    renderBracket();
}

/**
 * Mettre à jour la date actuelle
 */
function updateCurrentDate() {
    const now = new Date();
    document.getElementById('current-date').textContent =
        now.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }) +
        ' - ' + now.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    document.getElementById('last-update').textContent =
        `Dernière mise à jour: ${now.toLocaleTimeString('fr-FR')}`;
}

/**
 * Configurer les écouteurs d'événements
 */
function setupEventListeners() {
    document.getElementById('prev-day').addEventListener('click', () => {
        state.currentDate.setDate(state.currentDate.getDate() - 1);
        updateUI();
    });

    document.getElementById('next-day').addEventListener('click', () => {
        state.currentDate.setDate(state.currentDate.getDate() + 1);
        updateUI();
    });
}

/**
 * Rendre le calendrier des matchs
 */
function renderCalendar() {
    const dayTitle = document.getElementById('day-title');
    const matchesList = document.getElementById('matches-list');

    // Formater la date pour l'affichage
    const formattedDate = state.currentDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    dayTitle.textContent = formattedDate;

    // Filtrer les matchs pour le jour courant
    const matchesForDay = state.matches.filter(match => {
        const matchDate = match.dateObj;
        return matchDate.getDate() === state.currentDate.getDate() &&
               matchDate.getMonth() === state.currentDate.getMonth() &&
               matchDate.getFullYear() === state.currentDate.getFullYear();
    });

    // Si aucun match ce jour, afficher un message
    if (matchesForDay.length === 0) {
        matchesList.innerHTML = `
            <div class="no-matches">
                <i class="fas fa-calendar-times"></i>
                <p>Aucun match prévu aujourd'hui</p>
            </div>
        `;
        return;
    }

    // Rendre les matchs
    matchesList.innerHTML = matchesForDay.map(match => {
        const homeTeam = getTeamData(match.teams[0]);
        const awayTeam = getTeamData(match.teams[1]);

        // Déterminer le statut
        let statusClass = 'status-scheduled';
        let statusText = 'Programmé';
        let statusIcon = 'fa-calendar-check';

        if (match.status === 'played') {
            statusClass = 'status-played';
            statusText = 'Terminé';
            statusIcon = 'fa-check-circle';
        } else if (match.status === 'live') {
            statusClass = 'status-live';
            statusText = 'En direct';
            statusIcon = 'fa-broadcast-tower';
        }

        return `
            <div class="match-card" data-match-id="${match.id}">
                <div class="match-header">
                    <span><i class="fas ${statusIcon}"></i> ${match.displayTime}</span>
                    <span>${match.venue}</span>
                </div>
                <div class="match-teams">
                    <div class="team">
                        <div class="team-info">
                            <span class="team-flag">${homeTeam.flag}</span>
                            <span class="team-name">${homeTeam.name}</span>
                        </div>
                        <div class="team-score">${match.score.home}</div>
                    </div>
                    <div class="team">
                        <div class="team-info">
                            <span class="team-flag">${awayTeam.flag}</span>
                            <span class="team-name">${awayTeam.name}</span>
                        </div>
                        <div class="team-score">${match.score.away}</div>
                    </div>
                </div>
                <div class="match-status ${statusClass}">
                    ${statusText}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Obtenir les données d'une équipe
 */
function getTeamData(teamCode) {
    return TEAMS.find(t => t.code === teamCode) || {
        code: teamCode,
        name: teamCode,
        flag: '❓'
    };
}

/**
 * Rendre le tableau final (bracket)
 */
function renderBracket() {
    const bracketContainer = document.getElementById('bracket');
    bracketContainer.innerHTML = '';

    // Round of 16
    const roundOf16 = document.createElement('div');
    roundOf16.className = 'round';
    roundOf16.innerHTML = '<div class="round-title">1/16 de finale</div>';

    state.bracketData.roundOf16.forEach(match => {
        const homeTeam = getTeamData(match.teams[0]);
        const awayTeam = getTeamData(match.teams[1]);

        roundOf16.innerHTML += `
            <div class="match-bracket ${match.status === 'played' ? 'played' : ''}" data-match-id="${match.id}">
                <div class="team-bracket ${match.winner === match.teams[0] ? 'winner' : match.winner ? 'loser' : ''}">
                    <span class="team-flag">${homeTeam.flag}</span>
                    <span>${homeTeam.name}</span>
                </div>
                <div class="score-bracket">${match.score.home} - ${match.score.away}</div>
                <div class="team-bracket ${match.winner === match.teams[1] ? 'winner' : match.winner ? 'loser' : ''}">
                    <span class="team-flag">${awayTeam.flag}</span>
                    <span>${awayTeam.name}</span>
                </div>
            </div>
        `;
    });

    bracketContainer.appendChild(roundOf16);

    // Quarter Finals
    const quarterFinals = document.createElement('div');
    quarterFinals.className = 'round';
    quarterFinals.innerHTML = '<div class="round-title">1/4 de finale</div>';

    state.bracketData.quarterFinals.forEach(match => {
        quarterFinals.innerHTML += `
            <div class="match-bracket">
                <div class="team-bracket">${match.teams[0]}</div>
                <div class="score-bracket">-</div>
                <div class="team-bracket">${match.teams[1]}</div>
            </div>
        `;
    });

    bracketContainer.appendChild(quarterFinals);

    // Semi Finals
    const semiFinals = document.createElement('div');
    semiFinals.className = 'round';
    semiFinals.innerHTML = '<div class="round-title">1/2 finales</div>';

    state.bracketData.semiFinals.forEach(match => {
        semiFinals.innerHTML += `
            <div class="match-bracket">
                <div class="team-bracket">${match.teams[0]}</div>
                <div class="score-bracket">-</div>
                <div class="team-bracket">${match.teams[1]}</div>
            </div>
        `;
    });

    bracketContainer.appendChild(semiFinals);

    // Third Place
    const thirdPlace = document.createElement('div');
    thirdPlace.className = 'round';
    thirdPlace.innerHTML = '<div class="round-title">Match pour la 3ème place</div>';

    state.bracketData.thirdPlace.forEach(match => {
        thirdPlace.innerHTML += `
            <div class="match-bracket">
                <div class="team-bracket">${match.teams[0]}</div>
                <div class="score-bracket">-</div>
                <div class="team-bracket">${match.teams[1]}</div>
            </div>
        `;
    });

    bracketContainer.appendChild(thirdPlace);

    // Final
    const final = document.createElement('div');
    final.className = 'round';
    final.innerHTML = '<div class="round-title">Finale</div>';

    state.bracketData.final.forEach(match => {
        final.innerHTML += `
            <div class="match-bracket">
                <div class="team-bracket">${match.teams[0]}</div>
                <div class="score-bracket">-</div>
                <div class="team-bracket">${match.teams[1]}</div>
            </div>
        `;
    });

    bracketContainer.appendChild(final);
}

/**
 * Démarrer le rafraîchissement automatique
 */
function startAutoRefresh() {
    // Rafraîchir toutes les 5 minutes
    setInterval(async () => {
        try {
            await loadDataFromAPI();
            updateUI();
        } catch (error) {
            console.error('Erreur lors du rafraîchissement:', error);
        }
    }, 300000); // 5 minutes
}
