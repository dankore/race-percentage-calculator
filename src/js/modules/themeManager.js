export function setupThemeToggle() {
  // Wait for DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeToggle);
  } else {
    initThemeToggle();
  }

  function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');

    if (!themeToggle || !sunIcon || !moonIcon) {
      return;
    }

    // Add multiple event listeners to ensure clicks are captured
    function toggleTheme(e) {
      // Stop event propagation and prevent default
      e.preventDefault();
      e.stopPropagation();
      
      const html = document.documentElement;

      if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
        moonIcon.classList.remove('hidden');
        sunIcon.classList.add('hidden');
      } else {
        html.classList.add('dark');
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
      }
    }

    // Remove any existing event listeners
    themeToggle.replaceWith(themeToggle.cloneNode(true));
    
    // Get the fresh element reference after replacement
    const freshThemeToggle = document.getElementById('theme-toggle');
    const freshSunIcon = document.getElementById('sun-icon');
    const freshMoonIcon = document.getElementById('moon-icon');
    
    if (!freshThemeToggle || !freshSunIcon || !freshMoonIcon) {
      return;
    }
    
    // Add multiple event types
    freshThemeToggle.addEventListener('click', toggleTheme);
    
    // Check for saved user preferences and set the correct icon
    if (
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
      freshMoonIcon.classList.add('hidden');
      freshSunIcon.classList.remove('hidden');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
      freshMoonIcon.classList.remove('hidden');
      freshSunIcon.classList.add('hidden');
    }

    // Ensure the toggle button is visible
    freshThemeToggle.classList.remove('opacity-0');
  }
}
