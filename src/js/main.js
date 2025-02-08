import {
  initializeNodes,
  calculateEthnicity,
} from './modules/ethnicityCalculator.js';
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

if (document.readyState !== 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    setupAnalytics()
    setupThemeToggle();
    setupUIHandlers();
    if (document.getElementById('ethnicity-entry-template')) {
      initializeNodes();
      calculateEthnicity();
    }
    setupHeaderDropdown();
    setupSocialSharing();
    setDynamicYear();

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
  });
}
