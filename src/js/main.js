import { initializeNodes, calculateRace } from './modules/raceCalculator.js';
import { setupUIHandlers } from './modules/uiHandlers.js';
import { setupSocialSharing } from './modules/socialSharing.js';
import { setupAnalytics } from './modules/analytics.js';
import { setupBackToTop } from './modules/backToTop.js';
import { initializeUIEnhancements } from './modules/uiEnhancements.js';
import { setupEnhancedUI } from './modules/uiEffects.js';
import { setupDnaKitImport } from './modules/dnaKitImport.js';
import { setupStoryCards } from './modules/storyCards.js';

function setDynamicYear() {
  const yearElement = document.querySelector('.copyright-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

function initializeApp() {
  setupAnalytics();
  setupUIHandlers();
  setupEnhancedUI();
  setupSocialSharing();
  setupBackToTop();
  initializeUIEnhancements();
  setupDnaKitImport();
  setupStoryCards();
  setDynamicYear();

  // Initialize race calculator with a slight delay to ensure DOM is ready
  setTimeout(() => {
    if (document.getElementById('race-entry-template')) {
      const success = initializeNodes();
      if (success) {
        calculateRace();
        document.dispatchEvent(new Event('race-calculator-ready'));

        // Initialize saved results list if it exists
        if (document.getElementById('savedResultsList')) {
          // Import dynamically to avoid circular dependencies
          import('./modules/raceCalculator.js').then(module => {
            if (typeof module.updateSavedResultsList === 'function') {
              module.updateSavedResultsList();
            }
          });
        }
      }
    }
  }, 100);

}

// Check if document is already loaded
if (document.readyState === 'loading') {
  // Document still loading, add event listener
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // Document already loaded, run immediately
  initializeApp();
}
