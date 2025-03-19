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

    dropdownButton.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      dropdownMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', e => {
      if (!dropdownContainer.contains(e.target)) {
        dropdownMenu.classList.add('hidden');
      }
    });

    // Prevent the dropdown from closing when clicking inside it
    dropdownMenu.addEventListener('click', e => {
      e.stopPropagation();
    });
  }
}
