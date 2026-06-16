/**
 * Secure Player Stats Manager
 * XSS-protected version with safe DOM manipulation
 */

class SecurePlayerStatsManager {
    constructor(playerId) {
        this.playerId = playerId;
        this.playerData = null;
        this.championIconsPath = '../assets/champion_icons/';
    }

    /**
     * XSS Protection: Sanitize text input
     */
    sanitize(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.textContent;
    }

    /**
     * XSS Protection: Validate and sanitize number inputs
     */
    sanitizeNumber(value, defaultValue = 0) {
        const num = parseInt(value, 10);
        return isNaN(num) ? defaultValue : Math.max(0, num);
    }

    /**
     * Load player data - uses embedded data to work around 403 on JSON files
     */
    async loadPlayerData() {
        const PLAYER_DATA = {
            al3xand3r: {
                id: "al3xand3r", name: "Al3xand3r", role: "Top", realName: "Top Laner",
                bio: "Top laner for Ascension Esports",
                stats: { totalGames: 0, wins: 0, totalKills: 0, totalDeaths: 0, totalAssists: 0, kda: 0, winRate: 0 },
                champions: [], matches: []
            },
            kkm: {
                id: "kkm", name: "KKM", role: "Jungle", realName: "Jungler",
                bio: "Jungler for Ascension Esports",
                stats: { totalGames: 0, wins: 0, totalKills: 0, totalDeaths: 0, totalAssists: 0, kda: 0, winRate: 0 },
                champions: [], matches: []
            },
            arashi: {
                id: "arashi", name: "Arashi", role: "Mid", realName: "Mid Laner",
                bio: "Mid laner for Ascension Esports",
                stats: { totalGames: 0, wins: 0, totalKills: 0, totalDeaths: 0, totalAssists: 0, kda: 0, winRate: 0 },
                champions: [], matches: []
            },
            coneglianum: {
                id: "coneglianum", name: "Coneglianum", role: "ADC", realName: "Bot Laner",
                bio: "ADC for Ascension Esports",
                stats: { totalGames: 0, wins: 0, totalKills: 0, totalDeaths: 0, totalAssists: 0, kda: 0, winRate: 0 },
                champions: [], matches: []
            },
            cronix: {
                id: "cronix", name: "Cronix", role: "Support", realName: "Support",
                bio: "Support for Ascension Esports",
                stats: { totalGames: 0, wins: 0, totalKills: 0, totalDeaths: 0, totalAssists: 0, kda: 0, winRate: 0 },
                champions: [], matches: []
            },
            majima: {
                id: "majima", name: "Majima", role: "Mid", realName: "Mid Laner",
                bio: "Mid laner for Ascension Esports",
                stats: { totalGames: 0, wins: 0, totalKills: 0, totalDeaths: 0, totalAssists: 0, kda: 0, winRate: 0 },
                champions: [], matches: []
            },
            butanero: {
                id: "butanero", name: "Butanero", role: "Jungle", realName: "Jungler",
                bio: "Jungler for Ascension Esports",
                stats: { totalGames: 0, wins: 0, totalKills: 0, totalDeaths: 0, totalAssists: 0, kda: 0, winRate: 0 },
                champions: [], matches: []
            }
        };

        this.playerData = PLAYER_DATA[this.playerId] || null;
        return this.playerData;
    }

    /**
     * Calculate KDA ratio
     * Formula: (Kills + Assists) / Deaths
     * If Deaths = 0, KDA = Kills + Assists
     */
    calculateKDA(kills, deaths, assists) {
        if (deaths === 0) {
            return kills + assists;
        }
        return ((kills + assists) / deaths).toFixed(2);
    }

    /**
     * Calculate Win Rate percentage
     */
    calculateWinRate(wins, totalGames) {
        if (totalGames === 0) return 0;
        return Math.round((wins / totalGames) * 100);
    }

    /**
     * Recalculate all stats based on matches data
     */
    recalculateStats() {
        if (!this.playerData) return;
        if (!this.playerData.matches) {
            this.playerData.matches = [];
            return;
        }

        const matches = this.playerData.matches;

        // Rebuild champions array from matches if empty
        if (!this.playerData.champions || this.playerData.champions.length === 0) {
            console.log('recalculateStats - rebuilding champions from matches');
            this.playerData.champions = [];
            matches.forEach(match => {
                const champName = match.champion;
                const existing = this.playerData.champions.find(c => c.name === champName);
                if (existing) {
                    existing.games++;
                    if (match.result === 'win') existing.wins++;
                } else {
                    this.playerData.champions.push({
                        name: champName,
                        games: 1,
                        wins: match.result === 'win' ? 1 : 0
                    });
                }
            });
            console.log('recalculateStats - rebuilt champions:', this.playerData.champions);
        }

        const totalGames = matches.length;
        const wins = matches.filter(m => m.result === 'win').length;

        let totalKills = 0;
        let totalDeaths = 0;
        let totalAssists = 0;

        // Aggregate stats from all matches
        matches.forEach(match => {
            totalKills += this.sanitizeNumber(match.kills);
            totalDeaths += this.sanitizeNumber(match.deaths);
            totalAssists += this.sanitizeNumber(match.assists);
        });

        // Update stats object
        this.playerData.stats = {
            totalGames: totalGames,
            wins: wins,
            totalKills: totalKills,
            totalDeaths: totalDeaths,
            totalAssists: totalAssists,
            kda: this.calculateKDA(totalKills, totalDeaths, totalAssists),
            winRate: this.calculateWinRate(wins, totalGames)
        };
    }

    /**
     * Get champion icon path
     * Validates and sanitizes champion name
     * @param {string} championName - Name of the champion
     * @returns {string} Path to champion icon
     */
    getChampionIconPath(championName) {
        // Validate input
        if (!championName || typeof championName !== 'string') {
            return `${this.championIconsPath}unknown_icon.png`;
        }

        // Sanitize champion name - only allow alphanumeric characters
        const sanitizedName = championName.replace(/[^a-zA-Z0-9]/g, '');

        if (sanitizedName.length === 0) {
            return `${this.championIconsPath}unknown_icon.png`;
        }

        return `${this.championIconsPath}${sanitizedName.toLowerCase()}_icon.png`;
    }

    /**
     * Add a new match to player data
     * All inputs are sanitized
     * @param {Object} matchData - Match data object
     */
    addMatch(matchData) {
        if (!this.playerData) return;

        // Sanitize all inputs
        const sanitizedMatch = {
            id: Date.now(),
            champion: this.sanitize(matchData.champion),
            kills: this.sanitizeNumber(matchData.kills),
            deaths: this.sanitizeNumber(matchData.deaths),
            assists: this.sanitizeNumber(matchData.assists),
            result: matchData.result === 'win' ? 'win' : 'loss',
            date: new Date().toISOString()
        };

        // Add match to matches array
        this.playerData.matches.push(sanitizedMatch);

        // Update champion stats
        const champion = this.playerData.champions.find(
            c => c.name.toLowerCase() === sanitizedMatch.champion.toLowerCase()
        );
        if (champion) {
            champion.games++;
            if (sanitizedMatch.result === 'win') {
                champion.wins++;
            }
        }

        // Recalculate all stats
        this.recalculateStats();

        // Update UI
        this.renderStats();
        this.renderChampions();
    }

    /**
     * Render statistics to the page
     * Uses textContent for XSS protection
     */
    renderStats() {
        if (!this.playerData) return;

        const stats = this.playerData.stats;

        // Update stat cards using textContent (secure)
        const kdaElement = document.querySelector('.stat-value[data-stat="kda"]');
        const winRateElement = document.querySelector('.stat-value[data-stat="winrate"]');
        const gamesElement = document.querySelector('.stat-value[data-stat="games"]');
        const championsElement = document.querySelector('.stat-value[data-stat="champions"]');

        if (kdaElement) kdaElement.textContent = stats.kda || '--';
        if (winRateElement) winRateElement.textContent = `${stats.winRate}%`;
        if (gamesElement) gamesElement.textContent = stats.totalGames || '--';
        if (championsElement) {
            championsElement.textContent = this.playerData.champions ? this.playerData.champions.length : '0';
        }
    }

    /**
     * Render champion list with icons
     * Uses createElement instead of innerHTML (XSS protection)
     */
    renderChampions() {
        if (!this.playerData) {
            console.log('renderChampions - no playerData');
            return;
        }

        const championList = document.querySelector('.champion-list');
        if (!championList) {
            console.log('renderChampions - no championList element found');
            return;
        }

        // Clear existing content safely
        championList.innerHTML = '';

        const champions = this.playerData.champions || [];
        console.log('renderChampions - champions array:', champions);
        
        if (!champions || champions.length === 0) {
            console.log('renderChampions - no champions to display');
            championList.innerHTML = '<p style="padding:1rem;color:#888;">No champions yet</p>';
            return;
        }

        // Sort champions by games played (descending) and limit to top 4 (excluding 0 games)
        const sortedChampions = [...champions]
            .filter(c => (c.games || 0) > 0)
            .sort((a, b) => (b.games || 0) - (a.games || 0))
            .slice(0, 4);

        console.log('renderChampions - sortedChampions:', sortedChampions);

        sortedChampions.forEach(champion => {
            const winRate = this.calculateWinRate(champion.wins || 0, champion.games || 0);
            const iconPath = this.getChampionIconPath(champion.name);

            // Create elements using DOM API (XSS safe)
            const championItem = document.createElement('div');
            championItem.className = 'champion-item';

            // Create icon container
            const iconDiv = document.createElement('div');
            iconDiv.className = 'champion-icon';

            // Create image element
            const img = document.createElement('img');
            img.src = iconPath;
            img.alt = this.sanitize(champion.name || 'Unknown');
            img.loading = 'lazy';

            // Handle image load errors
            img.onerror = function() {
                this.style.display = 'none';
                if (this.parentElement) {
                    this.parentElement.textContent = '?';
                }
            };

            iconDiv.appendChild(img);

            // Create info container
            const infoDiv = document.createElement('div');
            infoDiv.className = 'champion-info';

            // Create name span
            const nameSpan = document.createElement('span');
            nameSpan.className = 'champion-name';
            nameSpan.textContent = this.sanitize(champion.name || 'Unknown');

            // Create stats span
            const statsSpan = document.createElement('span');
            statsSpan.className = 'champion-stats';
            const games = this.sanitizeNumber(champion.games);
            statsSpan.textContent = `${games} games - ${winRate}% WR`;

            infoDiv.appendChild(nameSpan);
            infoDiv.appendChild(statsSpan);

            championItem.appendChild(iconDiv);
            championItem.appendChild(infoDiv);
            championList.appendChild(championItem);
        });
    }

    /**
     * Save data to localStorage for persistence
     */
    saveToLocalStorage() {
        if (!this.playerData) return;

        const key = `playerData_${this.playerId}`;
        try {
            localStorage.setItem(key, JSON.stringify(this.playerData));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    }

    /**
     * Load data from localStorage
     */
    loadFromLocalStorage() {
        const key = `playerData_${this.playerId}`;
        const saved = localStorage.getItem(key);
        console.log('loadFromLocalStorage key:', key, 'saved:', saved ? 'yes' : 'no');

        if (saved) {
            try {
                this.playerData = JSON.parse(saved);
                console.log('loaded playerData:', this.playerData);
                return true;
            } catch (e) {
                console.error('Error loading from localStorage:', e);
            }
        }
        return false;
    }

    /**
     * Initialize the player page
     */
    async init() {
        console.log('===== PLAYER STATS INIT =====');
        console.log('playerId:', this.playerId);
        
        // Try loading from localStorage first
        const key = `playerData_${this.playerId}`;
        console.log('Checking localStorage key:', key);
        
        let saved = null;
        try {
            saved = localStorage.getItem(key);
            console.log('localStorage getItem result:', saved ? 'HAS DATA' : 'NULL');
        } catch(e) {
            console.log('localStorage getItem error:', e.message);
        }
        try {
            saved = localStorage.getItem(key);
        } catch(e) {
            console.log('localStorage getItem error:', e.message);
        }
        
        if (saved) {
            console.log('Found data in localStorage!');
            try {
                this.playerData = JSON.parse(saved);
                console.log('Matches:', this.playerData?.matches);
                console.log('Champions:', this.playerData?.champions);
                this.recalculateStats();
                this.renderStats();
                this.renderChampions();
                console.log('Done - loaded from localStorage');
                return;
            } catch(e) {
                console.log('JSON parse error:', e);
            }
        } else {
            console.log('No data in localStorage - trying to load from backup file');
            
            // Try loading from backup file
            try {
                const response = await fetch('../ascension-backup-player-names.json');
                if (response.ok) {
                    const backupData = await response.json();
                    const playerKey = `playerData_${this.playerId}`;
                    if (backupData[playerKey]) {
                        console.log('Found data in backup file for:', this.playerId);
                        this.playerData = backupData[playerKey];
                        // Save to localStorage for future use
                        localStorage.setItem(playerKey, JSON.stringify(this.playerData));
                        this.recalculateStats();
                        this.renderStats();
                        this.renderChampions();
                        console.log('Done - loaded from backup file');
                        return;
                    }
                }
            } catch(e) {
                console.log('Error loading backup file:', e.message);
            }
        }

        // Load embedded data
        await this.loadPlayerData();
        console.log('Embedded data loaded');
        
        if (this.playerData) {
            console.log('Matches in embedded:', this.playerData.matches);
            this.recalculateStats();
            this.renderStats();
            this.renderChampions();
            console.log('Done - loaded embedded');
        } else {
            console.log('ERROR: No player data available');
        }
        console.log('===== END INIT =====');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurePlayerStatsManager;
}

// Alias for backward compatibility
if (typeof window !== 'undefined') {
    window.PlayerStatsManager = SecurePlayerStatsManager;
}
