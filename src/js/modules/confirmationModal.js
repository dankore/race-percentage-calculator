const TRANSITION_DURATION_MS = 200;
let modalBackdrop;
let modalPanel;
let modalTitle;
let modalMessage;
let confirmButton;
let cancelButton;
let pendingResolve;
let isModalOpen = false;
let hideTimer;
let previouslyFocusedElement;

const baseButtonClasses =
  'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors duration-200 shadow-sm';

const confirmVariants = {
  primary:
    'text-white bg-indigo-600 hover:bg-indigo-700 focus-visible:outline-indigo-500',
  danger:
    'text-white bg-red-600 hover:bg-red-700 focus-visible:outline-red-500',
};

function ensureModalElements() {
  if (modalBackdrop) {
    return;
  }

  modalBackdrop = document.createElement('div');
  modalBackdrop.id = 'confirmationModalBackdrop';
  modalBackdrop.className =
    'fixed inset-0 z-[150] flex items-center justify-center bg-gray-900/60 dark:bg-gray-900/80 backdrop-blur-sm opacity-0 pointer-events-none hidden transition-opacity duration-200';

  modalPanel = document.createElement('div');
  modalPanel.role = 'dialog';
  modalPanel.ariaModal = 'true';
  modalPanel.ariaHidden = 'true';
  modalPanel.className =
    'w-full max-w-md mx-4 rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-all duration-200 opacity-0 scale-95 translate-y-4';

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'p-6 space-y-4';

  modalTitle = document.createElement('h2');
  modalTitle.id = 'confirmationModalTitle';
  modalTitle.className = 'text-lg font-semibold text-gray-900 dark:text-white';

  modalMessage = document.createElement('p');
  modalMessage.id = 'confirmationModalMessage';
  modalMessage.className =
    'text-sm text-gray-600 dark:text-gray-300 leading-relaxed';

  const buttonRow = document.createElement('div');
  buttonRow.className = 'flex flex-col sm:flex-row sm:justify-end gap-3 pt-2';

  cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.className = `${baseButtonClasses} bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 focus-visible:outline-gray-400`;
  cancelButton.textContent = 'Cancel';

  confirmButton = document.createElement('button');
  confirmButton.type = 'button';
  confirmButton.className = `${baseButtonClasses} ${confirmVariants.primary}`;
  confirmButton.textContent = 'Confirm';

  buttonRow.appendChild(cancelButton);
  buttonRow.appendChild(confirmButton);

  contentWrapper.appendChild(modalTitle);
  contentWrapper.appendChild(modalMessage);
  contentWrapper.appendChild(buttonRow);

  modalPanel.appendChild(contentWrapper);
  modalBackdrop.appendChild(modalPanel);
  document.body.appendChild(modalBackdrop);

  modalBackdrop.addEventListener('click', event => {
    if (event.target === modalBackdrop) {
      closeModal(false);
    }
  });

  cancelButton.addEventListener('click', () => closeModal(false));
  confirmButton.addEventListener('click', () => closeModal(true));

  document.addEventListener('keydown', handleKeydown, true);
}

function handleKeydown(event) {
  if (!isModalOpen) {
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    closeModal(false);
    return;
  }

  if (event.key === 'Tab') {
    trapFocus(event);
  }
}

function trapFocus(event) {
  if (!modalPanel) {
    return;
  }

  const focusableSelectors =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const focusableElements = Array.from(
    modalPanel.querySelectorAll(focusableSelectors)
  ).filter(el => !el.hasAttribute('disabled'));

  if (focusableElements.length === 0) {
    event.preventDefault();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function openModal() {
  if (!modalBackdrop || !modalPanel) {
    return;
  }

  clearTimeout(hideTimer);
  modalBackdrop.classList.remove('hidden');

  requestAnimationFrame(() => {
    modalBackdrop.classList.remove('opacity-0', 'pointer-events-none');
    modalBackdrop.classList.add('opacity-100');
    modalPanel.classList.remove('opacity-0', 'scale-95', 'translate-y-4');
    modalPanel.classList.add('opacity-100', 'scale-100', 'translate-y-0');
    modalPanel.setAttribute('aria-hidden', 'false');
  });

  isModalOpen = true;
  previouslyFocusedElement =
    document.activeElement && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

  // Focus confirm button by default
  setTimeout(() => {
    if (confirmButton) {
      confirmButton.focus({ preventScroll: true });
    }
  }, 0);
}

function closeModal(confirmed) {
  if (!isModalOpen) {
    return;
  }

  isModalOpen = false;

  if (modalBackdrop && modalPanel) {
    modalBackdrop.classList.remove('opacity-100');
    modalBackdrop.classList.add('opacity-0', 'pointer-events-none');
    modalPanel.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
    modalPanel.classList.add('opacity-0', 'scale-95', 'translate-y-4');
    modalPanel.setAttribute('aria-hidden', 'true');

    hideTimer = setTimeout(() => {
      modalBackdrop.classList.add('hidden');
    }, TRANSITION_DURATION_MS);
  }

  if (previouslyFocusedElement) {
    previouslyFocusedElement.focus();
    previouslyFocusedElement = null;
  }

  if (pendingResolve) {
    pendingResolve(confirmed);
    pendingResolve = null;
  }
}

function applyConfirmVariant(variant = 'primary') {
  if (!confirmButton) {
    return;
  }

  const variantKey = confirmVariants[variant] ? variant : 'primary';
  const classes = `${baseButtonClasses} ${confirmVariants[variantKey]}`;
  confirmButton.className = classes;
}

export function showConfirmationModal(options = {}) {
  if (typeof document === 'undefined') {
    return Promise.resolve(true);
  }

  ensureModalElements();

  const {
    title = 'Confirm Action',
    message = 'Are you sure you want to continue?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary',
  } = options;

  if (modalTitle) {
    modalTitle.textContent = title;
  }

  if (modalMessage) {
    modalMessage.textContent = message;
  }

  if (confirmButton) {
    confirmButton.textContent = confirmText;
    applyConfirmVariant(variant);
  }

  if (cancelButton) {
    cancelButton.textContent = cancelText;
  }

  openModal();

  return new Promise(resolve => {
    pendingResolve = resolve;
  });
}

export function hideConfirmationModal() {
  closeModal(false);
}
