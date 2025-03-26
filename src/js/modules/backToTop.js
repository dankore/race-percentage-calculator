export function setupBackToTop() {
  // Create back-to-top button element
  const backToTopBtn = document.createElement('button');
  backToTopBtn.id = 'backToTopBtn';
  backToTopBtn.setAttribute('aria-label', 'Back to top');
  backToTopBtn.setAttribute('title', 'Back to top');
  backToTopBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
    </svg>
  `;

  // Add classes for styling
  backToTopBtn.className =
    'fixed bottom-32 sm:bottom-28 md:bottom-24 left-6 z-[1002] p-3 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg opacity-0 invisible transition-all duration-300 hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none transform hover:-translate-y-1';

  // Add to DOM
  document.body.appendChild(backToTopBtn);

  // Show/hide button based on scroll position
  function toggleBackToTopButton() {
    if (window.scrollY > 300) {
      backToTopBtn.classList.remove('opacity-0', 'invisible');
      backToTopBtn.classList.add('opacity-100', 'visible');
    } else {
      backToTopBtn.classList.remove('opacity-100', 'visible');
      backToTopBtn.classList.add('opacity-0', 'invisible');
    }
  }

  // Scroll to top when button is clicked
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  });

  // Listen for scroll events
  window.addEventListener('scroll', toggleBackToTopButton);

  // Check initial scroll position
  toggleBackToTopButton();
}
