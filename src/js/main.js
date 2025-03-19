import {
  initializeNodes,
  calculateRace,
} from './modules/raceCalculator.js';
import { setupThemeToggle } from './modules/themeManager.js';
import { setupUIHandlers } from './modules/uiHandlers.js';
import { setupHeaderDropdown } from './modules/headerManager.js';
import { setupSocialSharing } from './modules/socialSharing.js';
import { setupAnalytics } from './modules/analytics.js';

function setDynamicYear() {
  const yearElement = document.querySelector('.copyright-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

function initializeApp() {
  setupAnalytics();
  setupThemeToggle();
  setupUIHandlers();
  setupHeaderDropdown();
  setupSocialSharing();
  setDynamicYear();
  
  // Initialize race calculator with a slight delay to ensure DOM is ready
  setTimeout(() => {
    if (document.getElementById('race-entry-template')) {
      const success = initializeNodes();
      if (success) {
        calculateRace();
      }
    }
  }, 100);
  
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              window.location.reload();
            }
          });
        });
      })
      .catch(() => {});
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => registration.update());
    });
  }
}

// Check if document is already loaded
if (document.readyState === 'loading') {
  // Document still loading, add event listener
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // Document already loaded, run immediately
  initializeApp();
}
