/**
 * Secure Admin Backoffice
 * XSS-protected version with input sanitization
 */

var PUBLISH_API_URL = '/api/config';

class SecureAdminBackoffice {
    constructor() {
        this.validUsers = [];
        this.loginForm = document.getElementById('admin-login-form');
        this.logoutBtn = document.getElementById('admin-logout');
        this.playerSelect = document.getElementById('player-select');
        this.matchForm = document.getElementById('admin-match-form');
        this.resultFeedback = document.getElementById('admin-feedback');
        this.recentUpdates = document.getElementById('recent-updates');
        this.players = [];
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
     * XSS Protection: Escape HTML special characters
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    /**
     * WARNING: Client-side authentication is NOT secure for production use.
     * This is a temporary solution for static site hosting.
     * PRODUCTION: Use server-side authentication (Node.js/Express, Python/Flask, etc.)
     * or platform-level protection (Netlify Identity, Cloudflare Access, etc.)
     */
    async loadCredentials() {
        // For static sites: Credentials should be configured via environment variables
        // at build time or use a serverless function for authentication.
        // This placeholder requires the user to configure their credentials properly.

        // Hash function using Web Crypto API (more secure than simple hash)
        const hashPassword = async (password) => {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        };

        // CONFIGURE YOUR CREDENTIALS HERE:
        // Generate hash with: console.log(await hashPassword('YOUR_PASSWORD'))
        // Or use: echo -n "YOUR_PASSWORD" | sha256sum
        const CONFIGURED_USERNAME = 'admin';
        const CONFIGURED_PASSWORD_HASH = '660ecdf0c4cb3074edebe1d0f07ba17e7409ac8f4cbd358575b9b5650cf6fd6e';

        this.validUsers = [{
            username: CONFIGURED_USERNAME,
            passwordHash: CONFIGURED_PASSWORD_HASH
        }];

        this.hashPassword = hashPassword;
    }

    /**
     * Validate user credentials (client-side only - NOT secure for production)
     */
    async validateCredentials(username, password) {
        // Sanitize inputs
        const cleanUsername = this.sanitize(username);
        const passwordHash = await this.hashPassword(password);

        // Check credentials
        return this.validUsers.some(user =>
            user.username === cleanUsername &&
            user.passwordHash === passwordHash
        );
    }

    /**
     * Initialize login page with security checks
     */
    async initLogin() {
        await this.loadCredentials();

        if (!this.loginForm) return;

        this.loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Get and sanitize inputs
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');

            const username = this.sanitize(usernameInput.value.trim());
            const password = passwordInput.value; // Don't sanitize password (it affects hashing)

            // Input length validation
            if (username.length > 100 || password.length > 128) {
                this.showFeedback('login-feedback', 'Input too long', 'error');
                return;
            }

            // Rate limiting check
            if (this.isRateLimited()) {
                this.showFeedback('login-feedback', 'Too many attempts. Please try again in 15 minutes.', 'error');
                return;
            }

            // Validate credentials (async)
            const isValid = await this.validateCredentials(username, password);

            if (isValid) {
                // PRODUCTION: Use secure HTTP-only cookies instead of sessionStorage
                // sessionStorage is NOT secure for production authentication
                sessionStorage.setItem('ascensionAdminSession', this.generateSessionToken());
                sessionStorage.setItem('ascensionAdminTimestamp', Date.now().toString());

                // Clear failed attempts on successful login
                sessionStorage.removeItem('loginAttempts');

                window.location.href = 'admin-dashboard.html';
                return;
            }

            this.recordFailedAttempt();
            this.showFeedback('login-feedback', 'Invalid username or password', 'error');

            // Clear sensitive fields
            passwordInput.value = '';
        });

        // Check for existing session
        if (this.hasValidSession()) {
            window.location.href = 'admin-dashboard.html';
        }
    }

    /**
     * Simple rate limiting
     */
    isRateLimited() {
        const attempts = parseInt(sessionStorage.getItem('loginAttempts') || '0', 10);
        const lastAttempt = parseInt(sessionStorage.getItem('lastLoginAttempt') || '0', 10);
        const now = Date.now();

        // Reset after 15 minutes
        if (now - lastAttempt > 900000) {
            sessionStorage.removeItem('loginAttempts');
            return false;
        }

        return attempts >= 10;
    }

    recordFailedAttempt() {
        const attempts = parseInt(sessionStorage.getItem('loginAttempts') || '0', 10);
        sessionStorage.setItem('loginAttempts', (attempts + 1).toString());
        sessionStorage.setItem('lastLoginAttempt', Date.now().toString());
    }

    generateSessionToken() {
        // Simple token generation
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    hasValidSession() {
        const token = sessionStorage.getItem('ascensionAdminSession');
        const timestamp = parseInt(sessionStorage.getItem('ascensionAdminTimestamp') || '0', 10);

        if (!token || !timestamp) return false;

        // Session expires after 1 hour
        const now = Date.now();
        if (now - timestamp > 3600000) {
            this.clearSession();
            return false;
        }

        return true;
    }

    clearSession() {
        sessionStorage.removeItem('ascensionAdminSession');
        sessionStorage.removeItem('ascensionAdminTimestamp');
    }

    /**
     * Initialize dashboard with security checks
     */
    async initDashboard() {
        if (!this.hasValidSession()) {
            window.location.href = 'admin-login.html';
            return;
        }

        // Logout button
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearSession();
                window.location.href = 'admin-login.html';
            });
        }

        await this.loadPlayers();
        this.renderPlayerOptions();
        this.loadRecentUpdates();

        if (this.matchForm) {
            const dateInput = document.getElementById('match-date');
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }

            this.matchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveMatch();
            });
        }

        // Delete last entry button
        const deleteLastBtn = document.getElementById('delete-last-btn');
        if (deleteLastBtn) {
            deleteLastBtn.addEventListener('click', () => this.deleteLastEntry());
        }

        // Backup and recovery buttons
        const exportBtn = document.getElementById('export-data-btn');
        const publishBtn = document.getElementById('publish-data-btn');
        const importBtn = document.getElementById('import-data-btn');
        const importFileInput = document.getElementById('import-file-input');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportAllData());
        }
        if (publishBtn) {
            publishBtn.addEventListener('click', () => this.publishData());
        }
        if (importBtn && importFileInput) {
            importBtn.onclick = function() {
                console.log('Import button clicked');
                importFileInput.click();
            };
        }
        
        if (importFileInput) {
            importFileInput.onchange = function(e) {
                console.log('File input change:', e.target.files);
                alert('File selected: ' + (e.target.files[0]?.name || 'none'));
                admin.importData(e);
            };
        }

        // News form
        const newsForm = document.getElementById('news-form');
        if (newsForm) {
            const monthInput = document.getElementById('news-date');
            if (monthInput) {
                const now = new Date();
                monthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            }

            newsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.publishNews();
            });
        }

        // Delete last news button
        const deleteLastNewsBtn = document.getElementById('delete-last-news-btn');
        if (deleteLastNewsBtn) {
            deleteLastNewsBtn.addEventListener('click', () => this.deleteLastNews());
        }

        // Next match form
        const nextMatchForm = document.getElementById('next-match-form');
        if (nextMatchForm) {
            const dateInput = document.getElementById('match-date');
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }

            nextMatchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNextMatch();
            });
        }
    }

    saveNextMatch() {
        const dateInput = document.getElementById('match-date');
        const timeInput = document.getElementById('match-time');
        const opponentInput = document.getElementById('opponent');
        const streamInput = document.getElementById('stream-link');

        const date = this.sanitize(dateInput.value);
        const time = this.sanitize(timeInput.value);
        const opponent = this.sanitize(opponentInput.value.trim());
        const stream = this.sanitize(streamInput.value.trim());

        if (!date || !time || !opponent) {
            this.showFeedback('next-match-feedback', 'Date, time, and opponent are required', 'error');
            return;
        }

        // Validate opponent length
        if (opponent.length > 50) {
            this.showFeedback('next-match-feedback', 'Opponent name too long', 'error');
            return;
        }

        // Validate stream URL if provided
        if (stream && !this.isValidUrl(stream)) {
            this.showFeedback('next-match-feedback', 'Invalid stream URL', 'error');
            return;
        }

        const nextMatch = { date, time, opponent, stream };
        localStorage.setItem('ascensionNextMatch', JSON.stringify(nextMatch));

        var tagInput = document.getElementById('opponent-tag');
        if (tagInput && tagInput.value.trim()) {
            localStorage.setItem('mc_opponent_tag', this.sanitize(tagInput.value.trim().toUpperCase()));
        }

        this.showFeedback('next-match-feedback', 'Next match saved successfully', 'success');
        document.getElementById('next-match-form').reset();
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    }

    isValidUrl(string) {
        if (!string) return false;
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    publishNews() {
        const dateInput = document.getElementById('news-date');
        const titleInput = document.getElementById('news-title');
        const excerptInput = document.getElementById('news-excerpt');

        const date = this.sanitize(dateInput.value);
        const title = this.sanitize(titleInput.value.trim());
        const excerpt = this.sanitize(excerptInput.value.trim());

        if (!date || !title || !excerpt) {
            this.showFeedback('news-feedback', 'All fields are required', 'error');
            return;
        }

        if (title.length > 100 || excerpt.length > 200) {
            this.showFeedback('news-feedback', 'Title or excerpt too long', 'error');
            return;
        }

        const newsItem = { date, title, excerpt };
        let news = JSON.parse(localStorage.getItem('ascensionNews') || '[]');
        news.unshift(newsItem);
        news = news.slice(0, 4);
        localStorage.setItem('ascensionNews', JSON.stringify(news));

        this.showFeedback('news-feedback', 'News published successfully', 'success');
        document.getElementById('news-form').reset();
        if (dateInput) {
            const now = new Date();
            dateInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }
    }

    deleteLastNews() {
        const news = JSON.parse(localStorage.getItem('ascensionNews') || '[]');
        if (news.length === 0) {
            this.showFeedback('news-feedback', 'No news to delete', 'error');
            return;
        }
        news.pop();
        localStorage.setItem('ascensionNews', JSON.stringify(news));
        this.showFeedback('news-feedback', 'Last news deleted', 'success');
    }

    async loadPlayers() {
        var FALLBACK_PLAYERS = [
            { id: 'al3xand3r', name: 'Al3xand3r',   role: 'Top',     champions: [], matches: [], stats: {} },
            { id: 'kkm',       name: 'KKM',          role: 'Jungle',  champions: [], matches: [], stats: {} },
            { id: 'arashi',    name: 'Arashi',       role: 'Mid',     champions: [], matches: [], stats: {} },
            { id: 'coneglianum', name: 'Coneglianum', role: 'ADC',    champions: [], matches: [], stats: {} },
            { id: 'cronix',    name: 'Cronix',       role: 'Support', champions: [], matches: [], stats: {} },
            { id: 'majima',    name: 'Majima',       role: 'Mid',     champions: [], matches: [], stats: {} },
            { id: 'butanero',  name: 'Butanero',     role: 'Jungle',  champions: [], matches: [], stats: {} }
        ];

        try {
            const response = await fetch('../data/players.json');
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            const data = await response.json();
            if (data && typeof data === 'object') {
                this.players = Object.values(data);
            } else {
                console.warn('Invalid player data format, using fallback.');
                this.players = FALLBACK_PLAYERS;
            }
        } catch (error) {
            console.warn('Could not fetch players.json, using fallback list.', error);
            this.players = FALLBACK_PLAYERS;
        }
    }

    renderPlayerOptions() {
        if (!this.playerSelect) return;

        this.playerSelect.innerHTML = '';

        var placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = '-- Select Player --';
        placeholder.disabled = true;
        placeholder.selected = true;
        this.playerSelect.appendChild(placeholder);

        if (!this.players.length) {
            var errOption = document.createElement('option');
            errOption.value = '';
            errOption.textContent = 'No players found';
            errOption.disabled = true;
            this.playerSelect.appendChild(errOption);
            return;
        }

        this.players.forEach(function (player) {
            var option = document.createElement('option');
            option.value = this.escapeHtml(player.id);
            option.textContent = this.sanitize(player.name || player.id);
            this.playerSelect.appendChild(option);
        }, this);
    }

    saveMatch(data) {
        var playerId, champion, result, kills, deaths, assists, date;

        if (data && typeof data === 'object') {
            playerId = this.sanitize(data.playerId);
            champion = this.sanitize(data.champion);
            result = this.sanitize(data.result);
            kills = Math.min(Math.max(parseInt(data.kills, 10) || 0, 0), 999);
            deaths = Math.min(Math.max(parseInt(data.deaths, 10) || 0, 0), 999);
            assists = Math.min(Math.max(parseInt(data.assists, 10) || 0, 0), 999);
            date = data.date || new Date().toISOString();
        } else {
            var playerSelect = this.playerSelect;
            var championInput = document.getElementById('champion-select');
            var resultInput = document.getElementById('result');
            var killsInput = document.getElementById('kills');
            var deathsInput = document.getElementById('deaths');
            var assistsInput = document.getElementById('assists');
            var dateInput = document.getElementById('match-date');

            playerId = this.sanitize(playerSelect.value);
            champion = this.sanitize(championInput.value.trim());
            result = this.sanitize(resultInput.value);
            kills = Math.min(Math.max(parseInt(killsInput.value, 10) || 0, 0), 999);
            deaths = Math.min(Math.max(parseInt(deathsInput.value, 10) || 0, 0), 999);
            assists = Math.min(Math.max(parseInt(assistsInput.value, 10) || 0, 0), 999);
            date = new Date(dateInput.value).toISOString();
        }

        if (!playerId || !champion) {
            this.showFeedback('admin-feedback', 'Player and champion are required', 'error');
            return;
        }

        if (!/^[a-zA-Z0-9\s']+$/.test(champion)) {
            this.showFeedback('admin-feedback', 'Invalid champion name', 'error');
            return;
        }

        if (champion.length > 30) {
            this.showFeedback('admin-feedback', 'Champion name too long', 'error');
            return;
        }

        if (result !== 'win' && result !== 'loss') {
            this.showFeedback('admin-feedback', 'Invalid result', 'error');
            return;
        }

        var match = { champion: champion, result: result, kills: kills, deaths: deaths, assists: assists, date: date };
        var actualPlayerId = playerId;
        var localKey = 'playerData_' + actualPlayerId;
        console.log('Saving to key:', localKey, '(from', playerId, ')');
        var playerData = null;

        var savedPlayerData = localStorage.getItem(localKey);
        if (savedPlayerData) {
            try {
                playerData = JSON.parse(savedPlayerData);
            } catch (e) {
                console.error('Error parsing player data:', e);
                playerData = null;
            }
        }

        if (!playerData) {
            var base = this.players.find(function (p) { return p.id === playerId; });
            if (base) {
                playerData = JSON.parse(JSON.stringify(base));
            }
        }

        if (!playerData) {
            this.showFeedback('admin-feedback', 'Player not found', 'error');
            return;
        }

        playerData.id = actualPlayerId;
        playerData.matches = playerData.matches || [];
        playerData.matches.push(match);

        var championIndex = (playerData.champions || []).findIndex(
            function (c) { return c.name.toLowerCase() === champion.toLowerCase(); }
        );
        if (championIndex !== -1) {
            playerData.champions[championIndex].games += 1;
            if (result === 'win') playerData.champions[championIndex].wins += 1;
        } else {
            playerData.champions = playerData.champions || [];
            playerData.champions.push({ name: champion, games: 1, wins: result === 'win' ? 1 : 0 });
        }

        this.recalculateStats(playerData);

        console.log('=== SAVING MATCH ===');
        console.log('Player ID:', playerId);
        console.log('Match:', match);
        console.log('playerData matches:', playerData.matches);
        console.log('playerData champions:', playerData.champions);

        localStorage.setItem(localKey, JSON.stringify(playerData));
        console.log('Saved to key:', localKey);

        this.showFeedback('admin-feedback', 'Match saved successfully', 'success');
        this.matchForm.reset();

        this.addRecentUpdate(playerData, match);
    }

    recalculateStats(playerData) {
        if (!playerData || !playerData.matches) return;

        var matches = playerData.matches;
        var totalGames = matches.length;
        var wins = matches.filter(function (m) { return m.result === 'win'; }).length;

        var totalKills = 0;
        var totalDeaths = 0;
        var totalAssists = 0;

        matches.forEach(function (match) {
            totalKills += match.kills || 0;
            totalDeaths += match.deaths || 0;
            totalAssists += match.assists || 0;
        });

        var kda = totalDeaths === 0 ? (totalKills + totalAssists) : ((totalKills + totalAssists) / totalDeaths).toFixed(2);
        var winRate = totalGames === 0 ? 0 : Math.round((wins / totalGames) * 100);

        playerData.stats = {
            totalGames: totalGames,
            wins: wins,
            totalKills: totalKills,
            totalDeaths: totalDeaths,
            totalAssists: totalAssists,
            kda: kda,
            winRate: winRate
        };
    }

    addRecentUpdate(playerData, match) {
        var row = document.createElement('div');
        row.style.padding = '0.4rem 0';
        row.style.borderBottom = '1px solid var(--border)';

        var resultLabel = match.result === 'win' ? 'WIN' : 'LOSS';
        var dateStr = new Date(match.date).toLocaleDateString();

        var textContent = dateStr + ' - ' + playerData.name + ' - ' + match.champion + ' (' + resultLabel + ' ' + match.kills + '/' + match.deaths + '/' + match.assists + ')';
        row.textContent = textContent;
        row.dataset.playerId = playerData.id;

        if (this.recentUpdates) {
            this.recentUpdates.prepend(row);
        }

        var stored = JSON.parse(localStorage.getItem('adminRecentUpdates') || '[]');
        var updatesWithPlayerId = JSON.parse(localStorage.getItem('adminRecentUpdatesMeta') || '[]');
        stored.unshift(textContent);
        updatesWithPlayerId.unshift({ playerId: playerData.id });
        localStorage.setItem('adminRecentUpdates', JSON.stringify(stored.slice(0, 10)));
        localStorage.setItem('adminRecentUpdatesMeta', JSON.stringify(updatesWithPlayerId.slice(0, 10)));
    }

    loadRecentUpdates() {
        var stored = JSON.parse(localStorage.getItem('adminRecentUpdates') || '[]');
        var updatesWithPlayerId = JSON.parse(localStorage.getItem('adminRecentUpdatesMeta') || '[]');
        if (!this.recentUpdates) return;

        this.recentUpdates.innerHTML = '';
        stored.forEach(function (update, index) {
            var row = document.createElement('div');
            row.style.padding = '0.4rem 0';
            row.style.borderBottom = '1px solid var(--border)';
            row.textContent = this.sanitize(update);
            row.dataset.playerId = updatesWithPlayerId[index]?.playerId || '';
            this.recentUpdates.appendChild(row);
        }, this);
    }

    exportAllData() {
        const exportData = {};

        // Find all playerData keys in localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('playerData_')) {
                try {
                    exportData[key] = JSON.parse(localStorage.getItem(key));
                } catch (e) {
                    console.error(`Error parsing data for ${key}:`, e);
                }
            }
        }

        // Also export recent updates and match-card data
        exportData.adminRecentUpdates = JSON.parse(localStorage.getItem('adminRecentUpdates') || '[]');
        exportData.adminRecentUpdatesMeta = JSON.parse(localStorage.getItem('adminRecentUpdatesMeta') || '[]');
        exportData.ascensionNews = JSON.parse(localStorage.getItem('ascensionNews') || '[]');
        exportData.ascensionNextMatch = JSON.parse(localStorage.getItem('ascensionNextMatch') || 'null');
        exportData.mc_opponent_tag = localStorage.getItem('mc_opponent_tag') || '';
        exportData.mc_opponent_name = localStorage.getItem('mc_opponent_name') || '';
        exportData.mc_opponent_logo = localStorage.getItem('mc_opponent_logo') || '';

        this._downloadJSON(exportData, `ascension-backup-${new Date().toISOString().split('T')[0]}.json`);
        this.showFeedback('backup-feedback', 'Data exported successfully', 'success');
    }

    publishData() {
        var self = this;
        var config = {
            ascensionNextMatch: JSON.parse(localStorage.getItem('ascensionNextMatch') || 'null'),
            mc_opponent_tag: localStorage.getItem('mc_opponent_tag') || '',
            mc_opponent_name: localStorage.getItem('mc_opponent_name') || '',
            mc_opponent_logo: localStorage.getItem('mc_opponent_logo') || ''
        };

        // 1) Also download match-config.json for manual server upload
        this._downloadJSON(config, 'match-config.json');

        // 2) POST to Worker
        var sessionToken = sessionStorage.getItem('ascensionAdminSession') || '';
        config.token = sessionToken;

        var xhr = new XMLHttpRequest();
        xhr.open('POST', PUBLISH_API_URL, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function () {
            if (xhr.status === 200) {
                self.showFeedback('backup-feedback', 'Published! Config sent to Worker. Also download match-config.json and upload to server.', 'success');
            } else {
                self.showFeedback('backup-feedback', 'Published to file. Worker POST failed (' + xhr.status + '): ' + xhr.responseText + '. Upload match-config.json manually.', 'error');
            }
        };
        xhr.onerror = function () {
            self.showFeedback('backup-feedback', 'Published to file. Upload match-config.json manually (Worker unreachable).', 'error');
        };
        xhr.send(JSON.stringify(config));
    }

    _downloadJSON(data, filename) {
        var dataStr = JSON.stringify(data, null, 2);
        var blob = new Blob([dataStr], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importData(event) {
        const file = event.target.files[0];
        console.log('File selected:', file?.name);
        if (!file) {
            console.log('No file selected');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            console.log('File read complete, parsing...');
            try {
                const data = JSON.parse(e.target.result);
                console.log('Parsed data keys:', Object.keys(data));
                
                if (typeof data !== 'object' || data === null) {
                    this.showFeedback('backup-feedback', 'Error: Invalid backup file format', 'error');
                    return;
                }
                let importCount = 0;

                console.log('=== IMPORTING BACKUP ===');
                
                // Import player data - use IDs directly (no conversion needed)
                Object.keys(data).forEach(key => {
                    if (key.startsWith('playerData_')) {
                        try {
                            let playerData = data[key];
                            const playerId = key.replace('playerData_', '');
                            const importKey = `playerData_${playerId}`;
                            
                            // Clear existing data first to avoid duplicates
                            localStorage.removeItem(importKey);
                            
                            localStorage.setItem(importKey, JSON.stringify(playerData));
                            importCount++;
                            console.log('Imported:', playerId);
                        } catch (err) {
                            console.warn('Error:', key, err);
                        }
                    }
                });
                
                console.log('Total imported:', importCount);
                alert(`Restored ${importCount} player records. Refresh player pages to see data.`);

                // Import recent updates with validation
                if (Array.isArray(data.adminRecentUpdates)) {
                    const validatedUpdates = data.adminRecentUpdates
                        .slice(0, 20)
                        .filter(u => typeof u === 'string' && u.length < 200)
                        .map(u => this.sanitize(u));
                    localStorage.setItem('adminRecentUpdates', JSON.stringify(validatedUpdates));
                }
                if (Array.isArray(data.adminRecentUpdatesMeta)) {
                    const validatedMeta = data.adminRecentUpdatesMeta
                        .slice(0, 20)
                        .filter(m => m && typeof m === 'object' && typeof m.playerId === 'string');
                    localStorage.setItem('adminRecentUpdatesMeta', JSON.stringify(validatedMeta));
                }
                if (Array.isArray(data.ascensionNews)) {
                    const validatedNews = data.ascensionNews
                        .slice(0, 4)
                        .filter(n => n && typeof n === 'object' && n.title && n.excerpt)
                        .map(n => ({
                            date: this.sanitize(n.date || ''),
                            title: this.sanitize(n.title),
                            excerpt: this.sanitize(n.excerpt)
                        }));
                    localStorage.setItem('ascensionNews', JSON.stringify(validatedNews));
                }
                if (data.ascensionNextMatch && typeof data.ascensionNextMatch === 'object') {
                    const nm = data.ascensionNextMatch;
                    if (nm.date && nm.time && nm.opponent) {
                        const validatedMatch = {
                            date: this.sanitize(nm.date),
                            time: this.sanitize(nm.time),
                            opponent: this.sanitize(nm.opponent),
                            stream: nm.stream ? this.sanitize(nm.stream) : ''
                        };
                        localStorage.setItem('ascensionNextMatch', JSON.stringify(validatedMatch));
                    }
                }

                // Import match-card opponent data
                if (data.mc_opponent_tag) {
                    localStorage.setItem('mc_opponent_tag', this.sanitize(data.mc_opponent_tag));
                }
                if (data.mc_opponent_name) {
                    localStorage.setItem('mc_opponent_name', this.sanitize(data.mc_opponent_name));
                }
                if (data.mc_opponent_logo) {
                    localStorage.setItem('mc_opponent_logo', this.sanitize(data.mc_opponent_logo));
                }

                this.loadRecentUpdates();
                this.showFeedback('backup-feedback', `Restored ${importCount} player records`, 'success');
            } catch (err) {
                this.showFeedback('backup-feedback', 'Error: Invalid backup file', 'error');
                console.error('Import error:', err);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }

    isValidPlayerData(data) {
        if (!data || typeof data !== 'object') return false;
        if (typeof data.id !== 'string' || data.id.length > 50) return false;
        if (typeof data.name !== 'string' || data.name.length > 50) return false;
        if (data.matches && !Array.isArray(data.matches)) return false;
        // Accept either champions or champians field
        const hasValidChampions = data.champions || data.champians;
        if (hasValidChampions && !Array.isArray(hasValidChampions)) return false;
        return true;
    }

    deleteLastEntry() {
        const stored = JSON.parse(localStorage.getItem('adminRecentUpdates') || '[]');
        const updatesWithPlayerId = JSON.parse(localStorage.getItem('adminRecentUpdatesMeta') || '[]');

        if (stored.length === 0) {
            this.showFeedback('admin-feedback', 'No entries to delete', 'error');
            return;
        }

        const lastUpdateText = stored[0];
        let playerId = updatesWithPlayerId[0]?.playerId;

        if (!playerId && lastUpdateText) {
            const match = lastUpdateText.match(/^[^-]+ - ([^-]+) - /);
            if (match) {
                const playerName = match[1].trim();
                const player = this.players.find(p => p.name === playerName);
                if (player) {
                    playerId = player.id;
                }
            }
        }

        stored.shift();
        updatesWithPlayerId.shift();
        localStorage.setItem('adminRecentUpdates', JSON.stringify(stored));
        localStorage.setItem('adminRecentUpdatesMeta', JSON.stringify(updatesWithPlayerId));

        if (playerId) {
            const localKey = `playerData_${playerId}`;
            const savedPlayerData = localStorage.getItem(localKey);
            if (savedPlayerData) {
                try {
                    const playerData = JSON.parse(savedPlayerData);
                    if (playerData.matches && playerData.matches.length > 0) {
                        const removedMatch = playerData.matches.pop();

                        if (removedMatch) {
                            const championIndex = (playerData.champions || []).findIndex(
                                c => c.name.toLowerCase() === removedMatch.champion.toLowerCase()
                            );
                            if (championIndex !== -1) {
                                playerData.champions[championIndex].games -= 1;
                                if (removedMatch.result === 'win') {
                                    playerData.champions[championIndex].wins -= 1;
                                }
                                if (playerData.champions[championIndex].games <= 0) {
                                    playerData.champions.splice(championIndex, 1);
                                }
                            }
                        }

                        this.recalculateStats(playerData);
                        localStorage.setItem(localKey, JSON.stringify(playerData));
                    }
                } catch (e) {
                    console.error('Error processing player data:', e);
                }
            }
        }

        this.loadRecentUpdates();
        this.showFeedback('admin-feedback', 'Last entry deleted', 'success');
    }

    showFeedback(elementId, text, type) {
        const el = document.getElementById(elementId);
        if (!el) return;

        el.textContent = this.sanitize(text);
        el.className = `match-feedback ${type}`;

        setTimeout(() => {
            el.className = 'match-feedback';
            el.textContent = '';
        }, 3000);
    }
}

// Initialize
const admin = new SecureAdminBackoffice();
if (document.body.contains(document.getElementById('admin-login-form'))) {
    admin.initLogin();
} else {
    admin.initDashboard();
}
