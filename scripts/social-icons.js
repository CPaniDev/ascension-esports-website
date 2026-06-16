// Ascension Esports - Social Media Icons Handler
// This script automatically creates hyperlinks for social media icons
// placed in assets/social_icons/ with naming convention: <social_media_name>_icon.png

/**
 * Social Media Icons Manager
 * Reads icon files from assets/social_icons/ and creates hyperlinks
 * based on URLs defined in data/social_media.json
 */
class SocialIconsManager {
    constructor() {
        this.iconsPath = 'assets/social_icons/';
        this.linksUrl = 'data/social_media.json';
        this.socialLinks = {};
        this.iconFiles = [];
    }

    /**
     * Initialize the social icons system
     */
    async init() {
        try {
            await this.loadSocialLinks();
            await this.scanIconFiles();
            this.renderIcons();
        } catch (error) {
            console.error('SocialIconsManager: Error initializing:', error);
        }
    }

    /**
     * Load social media URLs from JSON config
     */
    async loadSocialLinks() {
        try {
            const response = await fetch(this.linksUrl);
            const data = await response.json();
            this.socialLinks = data.social_links || {};
            console.log('SocialIconsManager: Loaded social links:', Object.keys(this.socialLinks));
        } catch (error) {
            console.error('SocialIconsManager: Error loading social links:', error);
            this.socialLinks = {};
        }
    }

    /**
     * Scan for icon files in the social_icons directory
     * Since we can't directly scan the filesystem, we check for defined links
     * and assume icons exist or will be added
     */
    async scanIconFiles() {
        // Get all social media names from the links config
        this.iconFiles = Object.keys(this.socialLinks).map(social => ({
            name: social,
            iconFile: `${social}_icon.png`,
            url: this.socialLinks[social]
        }));
        console.log('SocialIconsManager: Found icon configurations:', this.iconFiles.length);
    }

    /**
     * Render social media icons as hyperlinks
     * @param {string} containerId - ID of the container element
     */
    renderIcons(containerId = 'social-icons-container') {
        let container = document.getElementById(containerId);

        // Create container if it doesn't exist
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.className = 'social-icons';
            document.body.appendChild(container);
        }

        // Clear existing content
        container.innerHTML = '';

        // Create icon elements
        this.iconFiles.forEach(icon => {
            const link = document.createElement('a');
            link.href = icon.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.title = `Visit our ${this.capitalizeFirst(icon.name)}`;
            link.className = 'social-icon-link';

            const img = document.createElement('img');
            img.src = this.iconsPath + icon.iconFile;
            img.alt = `${this.capitalizeFirst(icon.name)} icon`;
            img.className = 'social-icon-img';
            img.loading = 'lazy';

            // Handle missing icon images
            img.onerror = function() {
                this.style.display = 'none';
                console.log(`SocialIconsManager: Icon not found - ${icon.iconFile}`);
            };

            link.appendChild(img);
            container.appendChild(link);
        });

        console.log('SocialIconsManager: Icons rendered successfully');
    }

    /**
     * Add or update a social media link
     * @param {string} socialName - Name of the social media (e.g., 'instagram')
     * @param {string} url - URL to link to
     */
    updateLink(socialName, url) {
        const key = socialName.toLowerCase().trim();
        this.socialLinks[key] = url;
        
        // Update the JSON file
        this.saveSocialLinks();
    }

    /**
     * Save social links to JSON file
     * Note: This requires server-side support for actual file writing
     */
    async saveSocialLinks() {
        try {
            const data = { social_links: this.socialLinks };
            // Using fetch to trigger server-side save would go here
            console.log('SocialIconsManager: Links updated (client-side only):', this.socialLinks);
        } catch (error) {
            console.error('SocialIconsManager: Error saving links:', error);
        }
    }

    /**
     * Capitalize first letter of a string
     */
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Get all configured social links
     */
    getSocialLinks() {
        return { ...this.socialLinks };
    }
}

// Global instance
const socialIconsManager = new SocialIconsManager();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    socialIconsManager.init();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SocialIconsManager;
}
