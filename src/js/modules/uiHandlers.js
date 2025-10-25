import {
  calculateRace,
  applyGrandparentWeighting,
} from './raceCalculator.js';

const warningMessageDiv = document.getElementById('warningMessage');

export function showWarning(message) {
  warningMessageDiv.innerHTML = `
    <div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
      <span class="block sm:inline">${message}</span>
    </div>`;
}

export function hideWarning() {
  warningMessageDiv.innerHTML = '';
}

export function setupUIHandlers() {
  document.addEventListener('input', function (event) {
    const entry = event.target.closest('.race-entry');
    if (!entry) return;

    if (event.target.closest('.grandparent-node')) {
      applyGrandparentWeighting({ silent: true });
    } else {
      calculateRace();
    }
  });

  document.addEventListener('click', function (event) {
    const deleteButton = event.target.closest('.delete-entry');
    if (deleteButton) {
      const entryToDelete = deleteButton.closest('.race-entry');
      const parentNode = entryToDelete.closest('.parent-node');
      if (parentNode.querySelectorAll('.race-entry').length > 1) {
        parentNode
          .querySelector('.race-entries')
          .removeChild(entryToDelete);
        if (parentNode.classList.contains('grandparent-node')) {
          applyGrandparentWeighting({ silent: true });
        } else {
          calculateRace();
        }
        checkScrolling(parentNode.querySelector('.race-entries'));
      } else {
        showWarning(
          'Please keep at least one race entry for each lineage section.'
        );
      }
    }
  });
}

function checkScrolling(container) {
  if (container.children.length > 3) {
    container.classList.add('overflow-y-auto');
  } else {
    container.classList.remove('overflow-y-auto');
  }
}
