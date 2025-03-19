// headerManager.js

export function setupHeaderDropdown() {
  // Run the setup on page load
  window.addEventListener('load', () => {
    setupDropdown();
  });
  
  // Also try to run it immediately
  setupDropdown();
}

function setupDropdown() {
  // Get the elements
  const button = document.getElementById('resources-dropdown-button');
  const menu = document.getElementById('resources-dropdown-menu');
  
  if (!button) {
    return;
  }
  
  if (!menu) {
    return;
  }
  
  // Toggle menu visibility when button is clicked
  button.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Toggle the hidden class
    const isHidden = menu.classList.contains('hidden');
    
    if (isHidden) {
      // Show the menu
      menu.classList.remove('hidden');
      
      // Position the menu below the button
      const buttonRect = button.getBoundingClientRect();
      menu.style.top = `${buttonRect.bottom + window.scrollY}px`;
      menu.style.left = `${buttonRect.left}px`;
    } else {
      // Hide the menu
      menu.classList.add('hidden');
    }
  });
  
  // Hide menu when clicking outside
  document.addEventListener('click', function(e) {
    // Only proceed if the menu is visible
    if (!menu.classList.contains('hidden')) {
      // Check if the click was outside the button and menu
      if (!button.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('hidden');
      }
    }
  });
  
  // Prevent clicks inside the menu from closing it
  menu.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  
  // Reposition menu on window resize
  window.addEventListener('resize', function() {
    if (!menu.classList.contains('hidden')) {
      const buttonRect = button.getBoundingClientRect();
      menu.style.top = `${buttonRect.bottom + window.scrollY}px`;
      menu.style.left = `${buttonRect.left}px`;
    }
  });
  
  // Reposition menu on scroll
  window.addEventListener('scroll', function() {
    if (!menu.classList.contains('hidden')) {
      const buttonRect = button.getBoundingClientRect();
      menu.style.top = `${buttonRect.bottom + window.scrollY}px`;
      menu.style.left = `${buttonRect.left}px`;
    }
  });
}
