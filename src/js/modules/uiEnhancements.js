/**
 * UI Enhancements for Race Percentage Calculator
 * Improves user experience with interactive components and guides
 */

// First-time user guide functionality
function initializeFirstTimeGuide() {
  const firstTimeGuide = document.getElementById('first-time-guide');
  const showGuideButton = document.getElementById('show-guide');
  const closeGuideButton = document.getElementById('close-guide');
  const dontShowAgainButton = document.getElementById('dont-show-again');
  const startUsingButton = document.getElementById('start-using');
  const americanMixButton = document.getElementById('guide-american-mix');
  const globalMixButton = document.getElementById('guide-global-mix');

  // Check if this is the first visit
  const hasVisitedBefore = localStorage.getItem('race-calc-visited');

  // Show the guide on first visit
  if (!hasVisitedBefore && firstTimeGuide) {
    // Use display flex to center the content
    firstTimeGuide.classList.remove('hidden');
    firstTimeGuide.classList.add('flex');
    // Save that they've seen the guide
    localStorage.setItem('race-calc-visited', 'true');
  }

  // Setup event listeners
  if (showGuideButton) {
    showGuideButton.addEventListener('click', () => {
      if (firstTimeGuide) {
        firstTimeGuide.classList.remove('hidden');
        firstTimeGuide.classList.add('flex');
      }
    });
  }

  if (closeGuideButton) {
    closeGuideButton.addEventListener('click', () => {
      if (firstTimeGuide) {
        firstTimeGuide.classList.remove('flex');
        firstTimeGuide.classList.add('hidden');
      }
    });
  }

  if (dontShowAgainButton) {
    dontShowAgainButton.addEventListener('click', () => {
      if (firstTimeGuide) {
        firstTimeGuide.classList.remove('flex');
        firstTimeGuide.classList.add('hidden');
        localStorage.setItem('race-calc-guide-disabled', 'true');
      }
    });
  }

  if (startUsingButton) {
    startUsingButton.addEventListener('click', () => {
      if (firstTimeGuide) {
        firstTimeGuide.classList.remove('flex');
        firstTimeGuide.classList.add('hidden');
      }
    });
  }

  // Sample mix buttons
  if (americanMixButton) {
    americanMixButton.addEventListener('click', () => {
      // Hide guide and apply American sample data
      if (firstTimeGuide) {
        firstTimeGuide.classList.remove('flex');
        firstTimeGuide.classList.add('hidden');
      }
      
      // Find and click the African/European Mix button (first sample button)
      const sampleButtons = document.querySelectorAll('.sample-race-btn');
      if (sampleButtons.length > 0) {
        // The first button is typically the African/European mix
        sampleButtons[0].click();
      }
    });
  }

  if (globalMixButton) {
    globalMixButton.addEventListener('click', () => {
      // Hide guide and apply Global sample data
      if (firstTimeGuide) {
        firstTimeGuide.classList.remove('flex');
        firstTimeGuide.classList.add('hidden');
      }
      
      // Find and click the Super Mix button (last sample button)
      const sampleButtons = document.querySelectorAll('.sample-race-btn');
      if (sampleButtons.length > 0) {
        // The last button is typically the Super Mix
        sampleButtons[sampleButtons.length - 1].click();
      }
    });
  }
}

// Smooth scrolling for anchor links
function setupSmoothScrolling() {
  const quickNavLinks = document.querySelectorAll('#quick-nav a[href^="#"]');
  
  quickNavLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        // Add a highlight effect when scrolled to
        const originalBackground = targetElement.style.backgroundColor;
        targetElement.style.transition = 'background-color 0.5s ease';
        
        // Scroll to element with offset for header
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: 'smooth'
        });
        
        // Highlight effect
        setTimeout(() => {
          targetElement.style.backgroundColor = 'rgba(79, 70, 229, 0.1)';
          setTimeout(() => {
            targetElement.style.backgroundColor = originalBackground;
          }, 1000);
        }, 500);
      }
    });
  });
}

// Initialize all enhancements on page load
function initializeUIEnhancements() {
  document.addEventListener('DOMContentLoaded', () => {
    initializeFirstTimeGuide();
    setupSmoothScrolling();
    console.log('UI Enhancements initialized');
  });
}

// Initialize immediately if document is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUIEnhancements);
} else {
  initializeUIEnhancements();
}

export { initializeUIEnhancements };
