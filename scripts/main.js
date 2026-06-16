// Ascension Esports - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 15, 0.98)';
        } else {
            navbar.style.background = 'rgba(10, 10, 15, 0.95)';
        }
    });

    // Mobile nav toggle
    const navToggle = document.querySelector('.nav-toggle');

    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navbar.classList.toggle('nav-active');
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', function() {
                navbar.classList.remove('nav-active');
            });
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href || href === '#' || href.startsWith('http')) return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Player cards hover effect
    const playerCards = document.querySelectorAll('.player-card');
    playerCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.05
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe sections
    document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '0';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        // If IntersectionObserver is available, use it; otherwise show immediately
        if ('IntersectionObserver' in window) {
            observer.observe(section);
        } else {
            section.style.opacity = '1';
        }
    });

    // Match card animation
    const matchCard = document.querySelector('.match-card');
    if (matchCard) {
        matchCard.style.opacity = '0';
        matchCard.style.transform = 'scale(0.95)';
        matchCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

        setTimeout(() => {
            matchCard.style.opacity = '1';
            matchCard.style.transform = 'scale(1)';
        }, 300);
    }

    // Load news from localStorage
    loadNews();
    loadNextMatch();
});

function sanitize(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.textContent;
}

function escapeHtml(text) {
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

function isValidUrl(string) {
    if (!string) return false;
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

function loadNews() {
    // Check for home page news container
    const newsContainer = document.getElementById('news-container');
    if (newsContainer) {
        const news = JSON.parse(localStorage.getItem('ascensionNews') || '[]');
        const defaultNews = [{
            date: 'March 2026',
            title: 'Ascension Esports is Born',
            excerpt: "We're excited to announce the formation of Ascension Esports, a Wild Rift team ready to compete at the highest level."
        }];

        const allNews = news.length > 0 ? news : defaultNews;

        newsContainer.innerHTML = '';
        allNews.forEach(item => {
            const article = document.createElement('article');
            article.className = 'news-card';
            article.innerHTML = `
                <div class="news-date">${escapeHtml(sanitize(item.date))}</div>
                <h3 class="news-title">${escapeHtml(sanitize(item.title))}</h3>
                <p class="news-excerpt">${escapeHtml(sanitize(item.excerpt))}</p>
            `;
            newsContainer.appendChild(article);
        });
    }

    // Check for archive page news container
    const newsArchive = document.getElementById('news-archive');
    if (newsArchive) {
        const news = JSON.parse(localStorage.getItem('ascensionNews') || '[]');
        const defaultNews = [{
            date: 'March 2026',
            title: 'Ascension Esports is Born',
            excerpt: "We're excited to announce the formation of Ascension Esports, a Wild Rift team ready to compete at the highest level."
        }];

        const allNews = news.length > 0 ? news : defaultNews;

        if (allNews.length === 0) {
            newsArchive.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No news available.</p>';
            return;
        }

        allNews.forEach(item => {
            const article = document.createElement('article');
            article.className = 'news-card';
            article.innerHTML = `
                <div class="news-date">${escapeHtml(sanitize(item.date))}</div>
                <h3 class="news-title">${escapeHtml(sanitize(item.title))}</h3>
                <p class="news-excerpt">${escapeHtml(sanitize(item.excerpt))}</p>
            `;
            newsArchive.appendChild(article);
        });
    }
}

function loadNextMatch() {
    const matchContainer = document.getElementById('match-container');
    if (!matchContainer) return;

    const nextMatch = JSON.parse(localStorage.getItem('ascensionNextMatch'));

    if (nextMatch && typeof nextMatch === 'object') {
        const dateStr = sanitize(nextMatch.date);
        const timeStr = sanitize(nextMatch.time);
        const opponent = sanitize(nextMatch.opponent);
        let stream = sanitize(nextMatch.stream);

        if (dateStr && timeStr && opponent) {
            const matchDate = new Date(dateStr + 'T' + timeStr);
            
            if (!isNaN(matchDate.getTime())) {
                const formattedDate = matchDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                });
                const formattedTime = matchDate.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });

                let streamHtml = '';
                if (stream && isValidUrl(stream)) {
                    streamHtml = `<a href="${escapeHtml(stream)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="margin-top: 0.5rem; display: inline-block;">Watch Stream</a>`;
                }

                matchContainer.innerHTML = `
                    <div class="match-card">
                        <div class="match-teams">
                            <span class="team-name">ASC</span>
                            <span class="vs">VS</span>
                            <span class="team-name opponent">${escapeHtml(opponent)}</span>
                        </div>
                        <div class="match-info">
                            <span class="match-date">${escapeHtml(formattedDate)} - ${escapeHtml(formattedTime)}</span>
                            <span class="match-tournament">Italian Competitive League</span>
                            ${streamHtml}
                        </div>
                    </div>
                `;
            }
        }
    }
}
