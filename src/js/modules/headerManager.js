// headerManager.js

export function setupHeaderDropdown() {
  // Run the setup on page load
  window.addEventListener('load', () => {
    console.log('Window loaded, setting up dropdown');
    setupDropdown();
  });
  
  // Also try to run it immediately
  setupDropdown();
}

function setupDropdown() {
  console.log('Setting up dropdown functionality');
  
  // Get the elements
  const button = document.getElementById('resources-dropdown-button');
  const menu = document.getElementById('resources-dropdown-menu');
  
  if (!button) {
    console.error('Resources dropdown button not found');
    return;
  }
  
  if (!menu) {
    console.error('Resources dropdown menu not found');
    return;
  }
  
  console.log('Found dropdown elements:', { button, menu });
  
  // Toggle menu visibility when button is clicked
  button.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Button clicked');
    
    // Toggle the hidden class
    const isHidden = menu.classList.contains('hidden');
    
    if (isHidden) {
      // Show the menu
      menu.classList.remove('hidden');
      
      // Position the menu below the button
      const buttonRect = button.getBoundingClientRect();
      menu.style.top = `${buttonRect.bottom + window.scrollY}px`;
      menu.style.left = `${buttonRect.left}px`;
      
      console.log('Menu shown and positioned at:', { 
        top: menu.style.top, 
        left: menu.style.left 
      });
    } else {
      // Hide the menu
      menu.classList.add('hidden');
      console.log('Menu hidden');
    }
  });
  
  // Hide menu when clicking outside
  document.addEventListener('click', function(e) {
    // Only proceed if the menu is visible
    if (!menu.classList.contains('hidden')) {
      // Check if the click was outside the button and menu
      if (!button.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('hidden');
        console.log('Menu hidden due to outside click');
      }
    }
  });
  
  // Prevent clicks inside the menu from closing it
  menu.addEventListener('click', function(e) {
    e.stopPropagation();
    console.log('Click inside menu');
  });
  
  // Reposition menu on window resize
  window.addEventListener('resize', function() {
    if (!menu.classList.contains('hidden')) {
      const buttonRect = button.getBoundingClientRect();
      menu.style.top = `${buttonRect.bottom + window.scrollY}px`;
      menu.style.left = `${buttonRect.left}px`;
      console.log('Menu repositioned on resize');
    }
  });
  
  // Reposition menu on scroll
  window.addEventListener('scroll', function() {
    if (!menu.classList.contains('hidden')) {
      const buttonRect = button.getBoundingClientRect();
      menu.style.top = `${buttonRect.bottom + window.scrollY}px`;
      menu.style.left = `${buttonRect.left}px`;
      console.log('Menu repositioned on scroll');
    }
  });
  
  console.log('Dropdown setup complete');
}
