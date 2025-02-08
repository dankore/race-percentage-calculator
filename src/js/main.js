import {
  initializeNodes,
  calculateEthnicity,
} from './modules/ethnicityCalculator.js';
import { setupThemeToggle } from './modules/themeManager.js';
import { setupUIHandlers } from './modules/uiHandlers.js';
import { setupHeaderDropdown } from './modules/headerManager.js';
import { setupSocialSharing } from './modules/socialSharing.js';

function setDynamicYear() {
  const yearElement = document.querySelector('.copyright-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

if (document.readyState !== 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    setupThemeToggle();
    setupUIHandlers();
    if (document.getElementById('ethnicity-entry-template')) {
      initializeNodes();
      calculateEthnicity();
    }
    setupHeaderDropdown();
    setupSocialSharing();
    setDynamicYear();
  });
}
