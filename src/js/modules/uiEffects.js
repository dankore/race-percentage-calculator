/**
 * UI Effects Module for Race Percentage Calculator
 * Adds modern micro-interactions, animations, and visual feedback
 */

// Toast notification system
export function setupToastSystem() {
  // Create toast container if it doesn't exist
  if (!document.getElementById('toast-container')) {
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2';
    document.body.appendChild(toastContainer);
  }
}

// Show a toast notification
export function showToast(message, type = 'success', duration = 3000) {
  const toastContainer = document.getElementById('toast-container');
  
  if (!toastContainer) return;
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `transform transition-all duration-300 ease-out translate-y-2 opacity-0 flex items-center p-3 rounded-md shadow-lg max-w-xs text-white font-medium`;
  
  // Set background color based on type
  switch (type) {
    case 'success':
      toast.classList.add('bg-gradient-to-r', 'from-emerald-500', 'to-emerald-600');
      break;
    case 'error':
      toast.classList.add('bg-gradient-to-r', 'from-red-500', 'to-red-600');
      break;
    case 'warning':
      toast.classList.add('bg-gradient-to-r', 'from-amber-500', 'to-amber-600');
      break;
    case 'info':
    default:
      toast.classList.add('bg-gradient-to-r', 'from-indigo-500', 'to-indigo-600');
      break;
  }
  
  // Set icon based on type
  let icon = '';
  switch (type) {
    case 'success':
      icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>`;
      break;
    case 'error':
      icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>`;
      break;
    case 'warning':
      icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>`;
      break;
    case 'info':
    default:
      icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>`;
      break;
  }
  
  // Set content
  toast.innerHTML = `
    <div class="flex items-center">
      ${icon}
      <span class="text-sm font-medium">${message}</span>
    </div>
    <button class="ml-auto text-white hover:text-white/80 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  `;
  
  // Add toast to container
  toastContainer.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  }, 10);
  
  // Add click listener to close button
  const closeButton = toast.querySelector('button');
  closeButton.addEventListener('click', () => {
    removeToast(toast);
  });
  
  // Auto-remove after duration
  setTimeout(() => {
    removeToast(toast);
  }, duration);
}

// Remove a toast with animation
function removeToast(toast) {
  toast.classList.remove('translate-y-0', 'opacity-100');
  toast.classList.add('translate-y-2', 'opacity-0');
  
  setTimeout(() => {
    toast.remove();
  }, 300);
}

// Setup hover and active effects for all buttons
export function enhanceButtonInteractions() {
  // Target all buttons (excluding those with .no-effects class)
  const buttons = document.querySelectorAll('button:not(.no-effects), .btn');
  
  buttons.forEach(button => {
    // Only add effects if they haven't been added already
    if (!button.classList.contains('effects-applied')) {
      button.classList.add('effects-applied');
      
      // Add transition properties if not already present
      if (!button.style.transition) {
        button.style.transition = 'all 0.2s ease-in-out';
      }
      
      // Mouse enter effect (subtle scale up)
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
      });
      
      // Mouse leave effect (return to normal)
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '';
      });
      
      // Mouse down effect (subtle scale down)
      button.addEventListener('mousedown', () => {
        button.style.transform = 'translateY(1px)';
      });
      
      // Mouse up effect (return to hover state if still hovering)
      button.addEventListener('mouseup', () => {
        button.style.transform = 'translateY(-2px)';
      });
    }
  });
}

// Add loading spinner to button
export function setButtonLoading(button, isLoading) {
  if (!button) return;
  
  const originalContent = button.getAttribute('data-original-content') || button.innerHTML;
  
  if (isLoading) {
    // Save original content if not already saved
    if (!button.getAttribute('data-original-content')) {
      button.setAttribute('data-original-content', button.innerHTML);
    }
    
    // Disable button
    button.disabled = true;
    
    // Add spinner
    button.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Processing...</span>
    `;
  } else {
    // Re-enable button
    button.disabled = false;
    
    // Restore original content
    button.innerHTML = originalContent;
  }
}

// Initial setup of enhanced UI effects
export function setupEnhancedUI() {
  setupToastSystem();
  
  // Setup button interactions on initial load
  enhanceButtonInteractions();
  
  // Re-apply effects whenever DOM changes (for dynamically added elements)
  const observer = new MutationObserver(() => {
    enhanceButtonInteractions();
  });
  
  // Observe changes to the body and its descendants
  observer.observe(document.body, { 
    childList: true,
    subtree: true
  });
  
  // Add system theme detection for dark/light mode
  setupAutomaticThemeDetection();
  
  // Setup Floating Action Button
  setupFloatingActionButton();
  
  // Setup scroll progress indicator
  setupScrollProgressIndicator();
}

// Setup automatic theme detection based on system preferences
function setupAutomaticThemeDetection() {
  // Check if browser supports matchMedia
  if (window.matchMedia) {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Set initial theme based on system preference
    if (darkModeMediaQuery.matches) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    // Listen for changes in system preference
    darkModeMediaQuery.addEventListener('change', (e) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    });
  }
}

// Setup Floating Action Button functionality
function setupFloatingActionButton() {
  const mainFAB = document.getElementById('main-fab');
  const fabActions = document.getElementById('fab-actions');
  const fabTooltip = document.getElementById('fab-tooltip');
  const fab = document.getElementById('floating-action-button');
  const fabButtons = document.querySelectorAll('#fab-actions button');
  
  // Make FAB visible after a short delay
  setTimeout(() => {
    if (fab) {
      fab.style.opacity = '1';
      fab.style.transform = 'translateY(0)';
    }
  }, 800);
  
  // Toggle menu on click
  if (mainFAB && fabActions) {
    mainFAB.addEventListener('click', () => {
      // Toggle visibility
      const isHidden = fabActions.classList.contains('hidden');
      
      if (isHidden) {
        // Show the menu with flex display
        fabActions.classList.remove('hidden');
        fabActions.classList.add('flex');
        
        // Rotate icon to indicate open state
        mainFAB.style.transform = 'rotate(45deg)';
      } else {
        // Hide the menu
        fabActions.classList.add('hidden');
        fabActions.classList.remove('flex');
        
        // Reset icon rotation
        mainFAB.style.transform = 'rotate(0deg)';
      }
    });
  }
  
  // Setup tooltips for FAB buttons
  if (fabButtons && fabTooltip) {
    fabButtons.forEach(button => {
      // Show tooltip on hover
      button.addEventListener('mouseenter', (e) => {
        const tooltipText = button.getAttribute('data-tooltip');
        if (tooltipText) {
          fabTooltip.textContent = tooltipText;
          fabTooltip.classList.remove('hidden');
          
          // Position the tooltip vertically centered to the button
          const buttonRect = button.getBoundingClientRect();
          fabTooltip.style.top = buttonRect.top + (buttonRect.height / 2) - (fabTooltip.offsetHeight / 2) + 'px';
          
          // Fade in
          setTimeout(() => {
            fabTooltip.style.opacity = '1';
          }, 10);
        }
      });
      
      // Hide tooltip on mouse leave
      button.addEventListener('mouseleave', () => {
        fabTooltip.style.opacity = '0';
        setTimeout(() => {
          fabTooltip.classList.add('hidden');
        }, 200);
      });
      
      // Setup FAB button actions
      button.addEventListener('click', () => {
        if (button.id === 'fab-new-calc') {
          // Clear all race inputs and refresh the form
          resetCalculator();
          
          // Show success toast
          showToast('Started a new calculation', 'info');
          
          // Scroll to race input section
          const raceInputSection = document.getElementById('race-input');
          if (raceInputSection) {
            raceInputSection.scrollIntoView({ behavior: 'smooth' });
          }
        }
        else if (button.id === 'fab-save') {
          // Find and click the save results button
          const saveButton = document.querySelector('#saveResultsBtn');
          if (saveButton) {
            saveButton.click();
          } else {
            showToast('Please calculate race percentages first', 'info');
          }
        }
        else if (button.id === 'fab-share') {
          // Find and click the Twitter share button
          const shareButton = document.querySelector('button[data-share="twitter"]');
          if (shareButton) {
            shareButton.click();
          } else {
            showToast('Please calculate race percentages first', 'info');
          }
        }
        
        // Hide the FAB menu after action
        fabActions.classList.add('hidden');
        fabActions.classList.remove('flex');
        mainFAB.style.transform = 'rotate(0deg)';
      });
    });
  }
}

// Reset the calculator for a new calculation
function resetCalculator() {
  // Find all race entry inputs in both parent containers
  const raceInputs = document.querySelectorAll('.race-input');
  const percentageInputs = document.querySelectorAll('.percentage-input');
  
  // Clear all inputs except the first entry for each parent
  const motherEntries = document.querySelectorAll('#mother .race-entry');
  const fatherEntries = document.querySelectorAll('#father .race-entry');
  
  // Keep only the first entry for each parent, remove the rest
  if (motherEntries.length > 1) {
    for (let i = 1; i < motherEntries.length; i++) {
      motherEntries[i].remove();
    }
  }
  
  if (fatherEntries.length > 1) {
    for (let i = 1; i < fatherEntries.length; i++) {
      fatherEntries[i].remove();
    }
  }
  
  // Clear the first entries
  if (motherEntries[0]) {
    const motherRaceInput = motherEntries[0].querySelector('.race-input');
    const motherPercentageInput = motherEntries[0].querySelector('.percentage-input');
    if (motherRaceInput) motherRaceInput.value = '';
    if (motherPercentageInput) motherPercentageInput.value = '100';
  }
  
  if (fatherEntries[0]) {
    const fatherRaceInput = fatherEntries[0].querySelector('.race-input');
    const fatherPercentageInput = fatherEntries[0].querySelector('.percentage-input');
    if (fatherRaceInput) fatherRaceInput.value = '';
    if (fatherPercentageInput) fatherPercentageInput.value = '100';
  }
  
  // Clear any displayed results
  const resultsContainer = document.getElementById('race-results');
  if (resultsContainer) {
    resultsContainer.innerHTML = '';
  }
  
  // Reset chart if it exists
  const chartContainer = document.querySelector('.chart-container');
  if (chartContainer) {
    chartContainer.classList.add('hidden');
  }
  
  // Show progress indicator for visual feedback
  showProgressIndicator();
}

// Show progress indicator for visual feedback
function showProgressIndicator() {
  const progressBar = document.getElementById('progress-bar');
  if (!progressBar) return;
  
  // Show the progress bar
  progressBar.style.transform = 'translateY(0)';
  
  // Hide it after a delay
  setTimeout(() => {
    progressBar.style.transform = 'translateY(-100%)';
  }, 800);
}

// Setup scroll progress indicator
function setupScrollProgressIndicator() {
  const scrollProgress = document.getElementById('scroll-progress-indicator');
  if (!scrollProgress) return;
  
  // Update scroll progress on scroll
  window.addEventListener('scroll', () => {
    const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (window.scrollY / windowHeight) * 100;
    scrollProgress.style.width = scrolled + '%';
  });
}
