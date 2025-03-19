// headerManager.js

export function setupHeaderDropdown() {
  // Wait for DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeaderDropdown);
  } else {
    initHeaderDropdown();
  }

  function initHeaderDropdown() {
    const dropdownButton = document.getElementById('resources-dropdown-button');
    const dropdownMenu = document.getElementById('resources-dropdown-menu');
    const dropdownContainer = document.getElementById('resources-dropdown');

    if (!dropdownButton || !dropdownMenu || !dropdownContainer) {
      console.warn('Header dropdown elements not found');
      return;
    }

    // Function to position the dropdown menu correctly (now at body level)
    function positionDropdown() {
      if (dropdownMenu.classList.contains('hidden')) return;
      
      const buttonRect = dropdownButton.getBoundingClientRect();
      
      // Position the dropdown directly under the button
      dropdownMenu.style.top = `${buttonRect.bottom + window.scrollY}px`;
      dropdownMenu.style.left = `${buttonRect.left}px`;
    }

    // Toggle dropdown visibility and position it
    dropdownButton.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      
      const isVisible = !dropdownMenu.classList.contains('hidden');
      
      // If it's going to be shown, position it first
      if (!isVisible) {
        // Show the dropdown and position it correctly
        dropdownMenu.classList.remove('hidden');
        positionDropdown();
      } else {
        // Hide it
        dropdownMenu.classList.add('hidden');
      }
    });

    // Handle click outside to close the dropdown
    document.addEventListener('click', e => {
      if (!dropdownContainer.contains(e.target)) {
        dropdownMenu.classList.add('hidden');
      }
    });

    // Prevent the dropdown from closing when clicking inside it
    dropdownMenu.addEventListener('click', e => {
      e.stopPropagation();
    });

    // Reposition dropdown on window resize
    window.addEventListener('resize', positionDropdown);
    
    // Reposition dropdown on scroll
    window.addEventListener('scroll', positionDropdown);
  }
}
