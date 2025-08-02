/**
 * Scroll Effects Module - Handles scroll-based UI transformations
 * Creates smooth transitions for elements as user scrolls
 * 
 * Desktop: Transitions from full button to circular chevron button
 * Mobile: Static chevron button, no scroll effects
 */

class ScrollEffects {
    constructor() {
        this.scrollThreshold = 120; // pixels from top to trigger compact mode
        this.isCompact = false;
        this.ticking = false; // for throttling scroll events
        this.scrollListenerAdded = false; // track if scroll listener is already added

        this.init();
    }

    init() {
        // Check initial state
        this.setupScrollEffects();

        // Handle window resize to enable/disable scroll effects
        window.addEventListener('resize', () => {
            this.setupScrollEffects();
        });
    }

    setupScrollEffects() {
        // Only enable scroll effects on desktop (not mobile)
        if (this.isMobile()) {
            // Remove compact mode class if it exists
            const button = document.getElementById('survey-filters-btn');
            if (button) {
                button.classList.remove('compact-mode');
            }
            return;
        }

        // Set up scroll event listener with throttling (only once)
        if (!this.scrollListenerAdded) {
            window.addEventListener('scroll', () => {
                if (!this.ticking) {
                    requestAnimationFrame(() => {
                        this.handleScroll();
                        this.ticking = false;
                    });
                    this.ticking = true;
                }
            });
            this.scrollListenerAdded = true;
        }

        // Handle initial state
        this.handleScroll();
    }

    // Check if we're on mobile
    isMobile() {
        return window.innerWidth <= 768;
    }

    handleScroll() {
        const scrollPosition = window.scrollY;
        const shouldBeCompact = scrollPosition > this.scrollThreshold;

        // Only update if state has changed
        if (shouldBeCompact !== this.isCompact) {
            this.isCompact = shouldBeCompact;
            this.updateButtonState();
        }
    }

    updateButtonState() {
        const button = document.getElementById('survey-filters-btn');

        if (!button) return;

        if (this.isCompact) {
            button.classList.add('compact-mode');
        } else {
            button.classList.remove('compact-mode');
        }
    }

    // Method to manually trigger state update (useful for testing)
    forceUpdate() {
        this.handleScroll();
    }
}

// Initialize scroll effects
let scrollEffects = new ScrollEffects();

// Export for use in other modules
window.ScrollEffects = ScrollEffects;
window.scrollEffects = scrollEffects; 