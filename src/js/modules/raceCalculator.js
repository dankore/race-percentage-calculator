import { showWarning, hideWarning } from './uiHandlers.js';

const PARENT_IDS = ['mother', 'father'];
const GRANDPARENT_GROUPS = {
  mother: ['maternalGrandmother', 'maternalGrandfather'],
  father: ['paternalGrandmother', 'paternalGrandfather'],
};
const ADVANCED_TREE_STORAGE_KEY = 'raceCalculatorAdvancedTree';

const parentWeights = {
  mother: 0.5,
  father: 0.5,
};

// Instead of global constants, we'll get fresh elements when needed
let motherNode,
  fatherNode,
  raceBreakdown,
  entryTemplate,
  downloadButton,
  saveButton,
  userNameInput,
  nameError,
  downloadSpinner,
  downloadSuccess,
  resetRaceButton,
  advancedToggleButton,
  advancedPanel,
  syncGrandparentsButton,
  advancedStatusMessage,
  advancedToggleStateLabel,
  siblingScenarioTemplate,
  siblingScenarioList,
  siblingEmptyState,
  addSiblingScenarioButton,
  resultsModal,
  resultsModalBackdrop,
  resultsModalClose,
  resultsModalHandle;
let grandparentNodes = {};
let debounceTimer;
let suppressAutoCalculation = false;
let advancedStatusTimeout;
let siblingScenarioCounter = 0;

// Initialize DOM references
function initializeDOMReferences() {
  motherNode = document.getElementById('mother');
  fatherNode = document.getElementById('father');
  raceBreakdown = document.getElementById('raceBreakdown');
  entryTemplate = document.getElementById('race-entry-template');
  downloadButton = document.getElementById('downloadButton');
  saveButton = document.getElementById('saveButton');
  userNameInput = document.getElementById('userName');
  nameError = document.getElementById('nameError');
  downloadSpinner = document.getElementById('downloadSpinner');
  downloadSuccess = document.getElementById('downloadSuccess');
  resetRaceButton = document.getElementById('resetRaceButton');
  advancedToggleButton = document.getElementById('advancedFamilyToggle');
  advancedPanel = document.getElementById('advancedFamilyTree');
  syncGrandparentsButton = document.getElementById('syncGrandparentsButton');
  advancedStatusMessage = document.getElementById('advancedStatusMessage');
  advancedToggleStateLabel = document.getElementById('advancedToggleState');
  siblingScenarioTemplate = document.getElementById('sibling-scenario-template');
  siblingScenarioList = document.getElementById('siblingScenarios');
  siblingEmptyState = document.getElementById('siblingEmptyState');
  addSiblingScenarioButton = document.getElementById('addSiblingScenario');
  resultsModal = document.getElementById('resultsModal');
  resultsModalBackdrop = document.getElementById('resultsModalBackdrop');
  resultsModalClose = document.getElementById('resultsModalClose');
  resultsModalHandle = document.getElementById('resultsModalHandle');

  grandparentNodes = {};
  Object.values(GRANDPARENT_GROUPS).forEach(group => {
    group.forEach(id => {
      const node = document.getElementById(id);
      if (node) {
        grandparentNodes[id] = node;
      }
    });
  });

  if (!motherNode || !fatherNode || !entryTemplate) {
    console.error('Critical race calculator elements not found:', {
      motherNode,
      fatherNode,
      entryTemplate,
    });
    return false;
  }

  return true;
}

export function initializeNodes() {
  // Get fresh DOM references
  if (!initializeDOMReferences()) {
    return false;
  }

  // Add initial race entries and set up event listeners
  withSuppressedCalculation(() => {
    getAllEditableNodes().forEach(node => {
      primeNode(node);
    });
  });

  if (downloadButton) {
    downloadButton.addEventListener('click', downloadResults);
  }

  if (saveButton) {
    saveButton.addEventListener('click', saveResults);
  }

  if (userNameInput) {
    userNameInput.addEventListener('input', validateName);
  }

  if (resetRaceButton) {
    resetRaceButton.addEventListener('click', resetRaceEntries);
  }

  // Initialize sample race buttons
  initializeSampleRaceButtons();
  initializeAdvancedTreeFeatures();
  initializeParentSummaryUI();
  initializeResultsModal();

  return true;
}

function getAllEditableNodes() {
  const nodes = [];
  if (motherNode) nodes.push(motherNode);
  if (fatherNode) nodes.push(fatherNode);
  Object.values(grandparentNodes).forEach(node => nodes.push(node));
  return nodes;
}

function primeNode(node) {
  if (!node) return;
  const entriesContainer = node.querySelector('.race-entries');
  if (!entriesContainer) return;

  if (entriesContainer.children.length === 0) {
    addRaceEntry(node);
  }

  const addButton = node.querySelector('.add-entry');
  if (addButton && !addButton.dataset.initialized) {
    addButton.addEventListener('click', () => addRaceEntry(node));
    addButton.dataset.initialized = 'true';
  }
}

function withSuppressedCalculation(callback) {
  const previousState = suppressAutoCalculation;
  suppressAutoCalculation = true;
  try {
    callback();
  } finally {
    suppressAutoCalculation = previousState;
  }
}

function initializeAdvancedTreeFeatures() {
  if (!advancedPanel) {
    return;
  }

  const forceOpen = advancedPanel.dataset.forceOpen === 'true';
  const storedState =
    !forceOpen &&
    typeof localStorage !== 'undefined' &&
    localStorage.getItem(ADVANCED_TREE_STORAGE_KEY) === '1';

  setAdvancedTreeState(forceOpen || !!storedState);

  if (advancedToggleButton) {
    advancedToggleButton.addEventListener('click', () => {
      const isOpen = advancedPanel.getAttribute('data-open') === 'true';
      setAdvancedTreeState(!isOpen);
    });
  } else if (forceOpen) {
    advancedPanel.classList.remove('hidden');
    advancedPanel.setAttribute('aria-hidden', 'false');
    advancedPanel.setAttribute('data-open', 'true');
    if (advancedToggleStateLabel) {
      advancedToggleStateLabel.textContent = 'Advanced tree enabled';
    }
  }

  if (syncGrandparentsButton) {
    syncGrandparentsButton.addEventListener('click', () =>
      applyGrandparentWeighting()
    );
  }

  if (addSiblingScenarioButton) {
    addSiblingScenarioButton.addEventListener('click', addSiblingScenario);
  }

  updateSiblingEmptyState();
  initializeAdvancedSamples();
}

function getParentConfigs() {
  const configs = [];
  if (motherNode) {
    configs.push({
      id: 'mother',
      node: motherNode,
      label: motherNode.dataset.label || "Mother's",
    });
  }
  if (fatherNode) {
    configs.push({
      id: 'father',
      node: fatherNode,
      label: fatherNode.dataset.label || "Father's",
    });
  }
  return configs;
}

function readNodeEntries(node) {
  const entries = [];
  let totalPercent = 0;
  let allFieldsFilled = true;

  node.querySelectorAll('.race-entry').forEach(entry => {
    const raceInput = entry.querySelector('.race-input');
    const percentInput = entry.querySelector('.percent-input');

    if (!raceInput || !percentInput) {
      return;
    }

    const race = raceInput.value.trim();
    const percent = parseFloat(percentInput.value);

    if (!race || isNaN(percent)) {
      allFieldsFilled = false;
      return;
    }

    entries.push({ race, percent });
    totalPercent += percent;
  });

  return { entries, totalPercent, allFieldsFilled };
}

function resetNodeEntries(node) {
  if (!node) return;
  const entriesContainer = node.querySelector('.race-entries');
  if (!entriesContainer) return;

  entriesContainer.innerHTML = '';
  addRaceEntry(node);
  checkScrolling(entriesContainer);
}

function setAdvancedTreeState(enabled) {
  if (!advancedPanel) return;

  advancedPanel.classList.toggle('hidden', !enabled);
  advancedPanel.setAttribute('aria-hidden', (!enabled).toString());
  advancedPanel.setAttribute('data-open', enabled ? 'true' : 'false');

  if (advancedToggleButton) {
    advancedToggleButton.setAttribute('aria-pressed', enabled.toString());
    advancedToggleButton.classList.toggle('ring-2', enabled);
    advancedToggleButton.classList.toggle('ring-indigo-200', enabled);
  }

  if (advancedToggleStateLabel) {
    advancedToggleStateLabel.textContent = enabled
      ? 'Advanced tree enabled'
      : 'Currently off';
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(ADVANCED_TREE_STORAGE_KEY, enabled ? '1' : '0');
  }

  if (enabled) {
    updateSiblingSummaries();
  }
}

function applyGrandparentWeighting(options = {}) {
  const { silent = false } = options;
  let updatedParents = 0;

  Object.entries(GRANDPARENT_GROUPS).forEach(([parentId, group]) => {
    const parentNode = parentId === 'mother' ? motherNode : fatherNode;
    if (!parentNode) return;

    const aggregated = {};

    group.forEach(grandparentId => {
      const grandparentNode = grandparentNodes[grandparentId];
      if (!grandparentNode) return;
      const { entries } = readNodeEntries(grandparentNode);
      entries.forEach(({ race, percent }) => {
        aggregated[race] = (aggregated[race] || 0) + percent * 0.5;
      });
    });

    if (Object.keys(aggregated).length) {
      setEntriesFromData(parentNode, aggregated);
      updatedParents += 1;
    }
  });

  if (updatedParents > 0) {
    if (!silent) {
      showAdvancedStatus(
        updatedParents === 2
          ? 'Mother and father mixes now reflect their grandparents.'
          : 'Parent mix updated from available grandparent data.'
      );
    }
    renderParentSummary();
    debouncedCalculateRace();
  } else if (!silent) {
    showAdvancedStatus('Add grandparent percentages before syncing.');
  }

  if (silent && updatedParents === 0) {
    renderParentSummary();
    toggleResultsHandle(false);
    hideResultsModal(true);
  }
}

function setEntriesFromData(node, raceMap) {
  if (!node || !raceMap) return;
  const rows = Object.entries(raceMap)
    .filter(([, value]) => !isNaN(value) && value > 0)
    .map(([race, percent]) => ({
      race,
      percent: typeof percent === 'number' ? percent : parseFloat(percent),
    }));
  setEntriesFromRows(node, rows);
}

function setEntriesFromRows(node, rows) {
  if (!node || !Array.isArray(rows)) return;
  const entriesContainer = node.querySelector('.race-entries');
  if (!entriesContainer) return;

  const sanitizedRows = rows
    .map(row => {
      if (!row) return null;
      const race =
        row.race && typeof row.race === 'string'
          ? row.race.trim()
          : row.race
          ? String(row.race).trim()
          : '';
      const percentRaw =
        typeof row.percent === 'number'
          ? row.percent
          : parseFloat(row.percent);
      if (!race || Number.isNaN(percentRaw)) {
        return null;
      }
      const roundedValue =
        Math.abs(percentRaw - Math.round(percentRaw)) < 0.01
          ? Math.round(percentRaw)
          : parseFloat(percentRaw.toFixed(1));
      return { race, percent: roundedValue };
    })
    .filter(Boolean);

  if (!sanitizedRows.length) return;

  withSuppressedCalculation(() => {
    entriesContainer.innerHTML = '';
    sanitizedRows.forEach(() => addRaceEntry(node));
    const renderedEntries = entriesContainer.querySelectorAll('.race-entry');
    sanitizedRows.forEach((row, index) => {
      const entry = renderedEntries[index];
      if (!entry) return;
      const raceInput = entry.querySelector('.race-input');
      const percentInput = entry.querySelector('.percent-input');
      if (raceInput) {
        raceInput.value = row.race;
      }
      if (percentInput) {
        percentInput.value = row.percent;
      }
    });
    checkScrolling(entriesContainer);
  });
}

function clearSiblingScenarios() {
  if (!siblingScenarioList) return;
  siblingScenarioList.innerHTML = '';
  siblingScenarioCounter = 0;
  updateSiblingEmptyState();
}

function showAdvancedStatus(message) {
  if (!advancedStatusMessage) return;
  advancedStatusMessage.textContent = message;
  advancedStatusMessage.classList.remove('hidden');

  clearTimeout(advancedStatusTimeout);
  advancedStatusTimeout = setTimeout(() => {
    advancedStatusMessage.classList.add('hidden');
  }, 4000);
}

function addSiblingScenario(options = {}) {
  if (!siblingScenarioTemplate || !siblingScenarioList) return;
  const fragment = document.importNode(siblingScenarioTemplate.content, true);
  const card = fragment.querySelector('.sibling-card');
  if (!card) return;

  siblingScenarioCounter += 1;
  card.dataset.scenarioId = `scenario-${Date.now()}-${siblingScenarioCounter}`;

  const nameInput = card.querySelector('.scenario-name');
  if (nameInput && (!nameInput.value || nameInput.value === 'Sibling')) {
    nameInput.value = `Sibling ${siblingScenarioCounter}`;
  }

  const slider = card.querySelector('.scenario-weight-slider');
  const motherWeightOutput = card.querySelector('.scenario-mother-weight');
  const fatherWeightOutput = card.querySelector('.scenario-father-weight');
  const deleteButton = card.querySelector('.delete-scenario');

  const updateWeights = () => {
    if (!slider) return;
    const motherWeight = Number(slider.value) || 0;
    const fatherWeight = Math.max(0, 100 - motherWeight);
    if (motherWeightOutput) {
      motherWeightOutput.textContent = `${motherWeight}%`;
    }
    if (fatherWeightOutput) {
      fatherWeightOutput.textContent = `${fatherWeight}%`;
    }
    updateSiblingSummaries();
  };

  if (slider) {
    slider.addEventListener('input', updateWeights);
  }

  if (deleteButton) {
    deleteButton.addEventListener('click', () => {
      card.remove();
      updateSiblingSummaries();
      updateSiblingEmptyState();
    });
  }

  siblingScenarioList.appendChild(card);
  updateSiblingEmptyState();
  if (nameInput && typeof options.name === 'string' && options.name.trim()) {
    nameInput.value = options.name.trim();
  }

  if (slider && typeof options.motherWeight === 'number') {
    const clamped = Math.min(100, Math.max(0, Math.round(options.motherWeight)));
    slider.value = clamped;
  }

  updateWeights();

  return card;
}

function initializeAdvancedSamples() {
  const sampleButtons = document.querySelectorAll('.advanced-sample-btn');
  if (!sampleButtons.length) return;

  sampleButtons.forEach(button => {
    if (button.dataset.lineageInitialized === 'true') {
      return;
    }
    button.addEventListener('click', () => {
      const raw = button.getAttribute('data-lineage-sample');
      if (!raw) return;
      try {
        const sampleData = JSON.parse(raw);
        const label =
          button.getAttribute('data-lineage-label') ||
          (button.querySelector('.advanced-sample-title') &&
            button
              .querySelector('.advanced-sample-title')
              .textContent.trim()) ||
          button.textContent.trim();
        applyAdvancedSample(sampleData, label);
      } catch (error) {
        console.error('Error applying lineage sample:', error);
        showAdvancedStatus('Unable to apply that lineage sample right now.');
      }
    });
    button.dataset.lineageInitialized = 'true';
  });
}

function applyAdvancedSample(sample, label = '') {
  if (!sample || typeof sample !== 'object') return;

  setAdvancedTreeState(true);

  withSuppressedCalculation(() => {
    if (sample.grandparents) {
      Object.entries(sample.grandparents).forEach(([id, rows]) => {
        const node = grandparentNodes[id];
        if (node && Array.isArray(rows)) {
          setEntriesFromRows(node, rows);
        }
      });
    }

    if (sample.parents) {
      if (motherNode && Array.isArray(sample.parents.mother)) {
        setEntriesFromRows(motherNode, sample.parents.mother);
      }
      if (fatherNode && Array.isArray(sample.parents.father)) {
        setEntriesFromRows(fatherNode, sample.parents.father);
      }
    }
  });
  renderParentSummary();

  if (Array.isArray(sample.siblingScenarios)) {
    clearSiblingScenarios();
    sample.siblingScenarios.forEach(scenario => {
      addSiblingScenario({
        name:
          typeof scenario.name === 'string' && scenario.name.trim()
            ? scenario.name.trim()
            : undefined,
        motherWeight:
          typeof scenario.motherWeight === 'number'
            ? scenario.motherWeight
            : undefined,
      });
    });
  } else {
    clearSiblingScenarios();
  }

  updateSiblingSummaries();
  hideWarning();
  debouncedCalculateRace();

  const message = label
    ? `Loaded "${label}" lineage sample.`
    : 'Loaded lineage sample.';
  showAdvancedStatus(message);

  if (advancedPanel) {
    setTimeout(() => {
      advancedPanel.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 150);
  }
}

function updateSiblingSummaries() {
  if (!siblingScenarioList) return;
  const cards = siblingScenarioList.querySelectorAll('.sibling-card');
  updateSiblingEmptyState();
  if (!cards.length) return;

  cards.forEach(card => {
    const slider = card.querySelector('.scenario-weight-slider');
    const summaryEl = card.querySelector('.scenario-summary');
    if (!slider || !summaryEl) return;

    const motherWeight = Number(slider.value || 0) / 100;
    const weights = {
      mother: motherWeight,
      father: Math.max(0, 1 - motherWeight),
    };

    const { races, isValid } = calculateRace(weights);

    if (!isValid || Object.keys(races).length === 0) {
      summaryEl.textContent =
        'Complete parent entries to preview this scenario.';
      return;
    }

    summaryEl.innerHTML = buildMiniPillMarkup(races);
  });
}

function buildMiniPillMarkup(races) {
  return Object.entries(races)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(
      ([race, percent]) =>
        `<span class="mini-pill">${race}: ${percent.toFixed(1)}%</span>`
    )
    .join('');
}

function updateSiblingEmptyState() {
  if (!siblingEmptyState || !siblingScenarioList) return;
  const hasCards = siblingScenarioList.querySelector('.sibling-card');
  siblingEmptyState.classList.toggle('hidden', !!hasCards);
}

function initializeSampleRaceButtons() {
  const sampleButtons = document.querySelectorAll('.sample-race-btn');
  let hasClickedOnce = false;

  sampleButtons.forEach(button => {
    button.addEventListener('click', () => {
      try {
        // Stop the pulse animation after first click on any button
        if (!hasClickedOnce) {
          document.querySelectorAll('.pulse-attention').forEach(el => {
            el.classList.remove('pulse-attention');
          });
          hasClickedOnce = true;
        }

        const racesData = JSON.parse(button.getAttribute('data-races'));

        const motherRows =
          racesData.mother ||
          (racesData.parents && racesData.parents.mother) ||
          null;
        const fatherRows =
          racesData.father ||
          (racesData.parents && racesData.parents.father) ||
          null;
        const hasGrandparentData =
          racesData.grandparents &&
          typeof racesData.grandparents === 'object' &&
          Object.keys(racesData.grandparents).length > 0;
        const isLineageSample = button.dataset.lineage === 'true';

        if (hasGrandparentData || isLineageSample) {
          const lineageSample = {};

          if (hasGrandparentData) {
            lineageSample.grandparents = racesData.grandparents;
          }

          const lineageParents = {};
          if (Array.isArray(motherRows)) {
            lineageParents.mother = motherRows;
          }
          if (Array.isArray(fatherRows)) {
            lineageParents.father = fatherRows;
          }
          if (Object.keys(lineageParents).length) {
            lineageSample.parents = lineageParents;
          }

          if (Array.isArray(racesData.siblingScenarios)) {
            lineageSample.siblingScenarios = racesData.siblingScenarios;
          }

          applyAdvancedSample(lineageSample, button.dataset.sampleLabel || '');
          debouncedCalculateRace();
          return;
        }

        if (Array.isArray(motherRows)) {
          populateNodeRaces('mother', motherRows);
        }
        if (Array.isArray(fatherRows)) {
          populateNodeRaces('father', fatherRows);
        }

        // Calculate the race after entries are populated
        debouncedCalculateRace();
      } catch (error) {
        console.error('Error applying sample race:', error);
      }
    });
  });
}

function populateNodeRaces(nodeId, racesData) {
  if (!Array.isArray(racesData) || racesData.length === 0) {
    return;
  }

  let targetNode = null;
  if (nodeId === 'mother') {
    targetNode = motherNode;
  } else if (nodeId === 'father') {
    targetNode = fatherNode;
  } else if (grandparentNodes[nodeId]) {
    targetNode = grandparentNodes[nodeId];
  } else {
    targetNode = document.getElementById(nodeId);
  }

  if (!targetNode) {
    return;
  }

  setEntriesFromRows(targetNode, racesData);
}

export function addRaceEntry(parentNode) {
  const entriesContainer = parentNode.querySelector('.race-entries');

  if (!entriesContainer || !entryTemplate) {
    return;
  }

  // Generate a unique ID for this entry
  const uniqueId = Date.now() + Math.floor(Math.random() * 1000);

  // Clone the template
  const newEntry = document.importNode(entryTemplate.content, true);

  // Replace the {{id}} placeholders with the unique ID
  newEntry.querySelectorAll('[id*="{{id}}"]').forEach(el => {
    el.id = el.id.replace('{{id}}', uniqueId);
  });

  // Add the entry to the container
  entriesContainer.appendChild(newEntry);

  // Set up event listeners
  setupEntryListeners(newEntry);

  // Update UI
  checkScrolling(entriesContainer);
  if (!suppressAutoCalculation) {
    debouncedCalculateRace();
  }

  return newEntry;
}

function setupEntryListeners(entry) {
  const inputs = entry.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', debouncedCalculateRace);
  });

  const deleteButton = entry.querySelector('.delete-entry');
  if (deleteButton) {
    deleteButton.addEventListener('click', function () {
      const entriesContainer = this.closest('.race-entries');
      if (entriesContainer.children.length > 1) {
        entriesContainer.removeChild(this.closest('.race-entry'));
        debouncedCalculateRace();
        checkScrolling(entriesContainer);
      } else {
        showWarning('Please keep at least one race entry for each parent.');
      }
    });
  }
}

function checkScrolling(container) {
  if (container.children.length > 3) {
    container.classList.add('overflow-y-auto');
  } else {
    container.classList.remove('overflow-y-auto');
  }
}

function debouncedCalculateRace(customWeights) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const { races, isValid, warningMessage } = calculateRace(customWeights);
    updateDisplay(races, isValid, warningMessage);
    updateSiblingSummaries();
  }, 300); // 300ms debounce time
}

function calculateRace(customWeights = parentWeights) {
  const races = {};
  let isValid = true;
  let warningMessage = '';

  const parents = getParentConfigs();
  if (!parents.length) {
    return { races, isValid: false, warningMessage: 'Parent nodes missing.' };
  }

  const normalizedWeights = {};
  let sumWeights = 0;

  parents.forEach(({ id }) => {
    const weight =
      typeof customWeights[id] === 'number'
        ? Math.max(0, customWeights[id])
        : 1 / parents.length;
    normalizedWeights[id] = weight;
    sumWeights += weight;
  });

  if (sumWeights === 0) {
    parents.forEach(({ id }) => {
      normalizedWeights[id] = 1 / parents.length;
    });
    sumWeights = 1;
  }

  Object.keys(normalizedWeights).forEach(key => {
    normalizedWeights[key] = normalizedWeights[key] / sumWeights;
  });

  parents.forEach(({ id, node, label }) => {
    const { entries, totalPercent, allFieldsFilled } = readNodeEntries(node);

    if (!allFieldsFilled) {
      isValid = false;
      warningMessage = 'Please fill in all race fields.';
      return;
    }

    if (Math.abs(totalPercent - 100) > 0.01) {
      isValid = false;
      warningMessage += `${label} race percentages should add up to 100%. `;
      return;
    }

    entries.forEach(({ race, percent }) => {
      races[race] = (races[race] || 0) + percent * (normalizedWeights[id] || 0);
    });
  });

  // If results are invalid, hide the floating results bar
  if (!isValid) {
    const floatingResults = document.getElementById('floatingResults');
    if (floatingResults) {
      floatingResults.classList.remove('visible');
    }
  }

  return { races, isValid, warningMessage };
}

function updateDisplay(races, isValid, warningMessage) {
  if (isValid) {
    hideWarning();
    displayResult(races);
  } else {
    showWarning(warningMessage);
    raceBreakdown.innerHTML = '';
    // Clear the chart
    if (window.raceChart instanceof Chart) {
      window.raceChart.data.labels = [];
      window.raceChart.data.datasets[0].data = [];
      window.raceChart.update();
    }
    // Disable the download and save buttons
    if (downloadButton) downloadButton.disabled = true;
    if (saveButton) saveButton.disabled = true;
    renderParentSummary();
  }
}

function displayResult(races) {
  const sortedEntries = Object.entries(races).sort((a, b) => b[1] - a[1]);
  const sortedRaces = sortedEntries.map(([race, percent]) => [
    race.toUpperCase(),
    percent,
  ]);

  let resultHTML = `
    <table class="w-full text-sm">
      <thead>
        <tr>
          <th class="bg-indigo-100 dark:bg-indigo-900 text-left p-1.5 text-indigo-900 dark:text-indigo-100 font-medium">RACE</th>
          <th class="bg-indigo-100 dark:bg-indigo-900 text-right p-1.5 text-indigo-900 dark:text-indigo-100 font-medium w-20">%</th>
        </tr>
      </thead>
      <tbody>
  `;

  for (const [race, percent] of sortedRaces) {
    resultHTML += `
      <tr class="border-b border-gray-100 dark:border-gray-700">
        <td class="p-1.5 text-gray-900 dark:text-gray-100">${race}</td>
        <td class="p-1.5 text-right text-indigo-600 dark:text-indigo-400">${percent.toFixed(
          1
        )}</td>
      </tr>
    `;
  }

  resultHTML += `
          </tbody>
        </table>
      `;

  raceBreakdown.innerHTML = resultHTML;
  updateChart(Object.fromEntries(sortedRaces));
  renderParentSummary();
  toggleResultsHandle(true);

  if (downloadButton) {
    downloadButton.disabled = false;
  }

  if (saveButton) {
    saveButton.disabled = false;
  }

  document.dispatchEvent(
    new CustomEvent('race-results-ready', {
      detail: {
        races: sortedEntries.map(([race, percent]) => ({
          label: race,
          percent,
        })),
      },
    })
  );
}

function renderParentSummary() {}

function initializeParentSummaryUI() {}

function initializeResultsModal() {
  if (!resultsModal) {
    return;
  }

  hideResultsModal(true);
  toggleResultsHandle(false);

  if (resultsModalClose) {
    resultsModalClose.addEventListener('click', () => hideResultsModal());
  }

  if (resultsModalBackdrop) {
    resultsModalBackdrop.addEventListener('click', () => hideResultsModal());
  }

  if (resultsModalHandle) {
    resultsModalHandle.addEventListener('click', () => showResultsModal());
  }
}

function showResultsModal() {
  if (!resultsModal || !resultsModalHandle || resultsModalHandle.disabled) {
    return;
  }

  resultsModal.classList.remove('hidden');
  requestAnimationFrame(() => resultsModal.classList.add('open'));
  resultsModal.setAttribute('aria-hidden', 'false');

  if (resultsModalBackdrop) {
    resultsModalBackdrop.classList.remove('hidden');
    requestAnimationFrame(() => resultsModalBackdrop.classList.add('visible'));
  }
}

function hideResultsModal(immediate = false) {
  if (!resultsModal) {
    return;
  }

  const finish = () => {
    if (!resultsModal.classList.contains('hidden')) {
      resultsModal.classList.add('hidden');
    }
    resultsModal.setAttribute('aria-hidden', 'true');
  };

  if (immediate) {
    resultsModal.classList.remove('open');
    finish();
  } else {
    resultsModal.classList.remove('open');
    setTimeout(finish, 250);
  }

  if (resultsModalBackdrop) {
    const hideBackdrop = () => resultsModalBackdrop.classList.add('hidden');
    resultsModalBackdrop.classList.remove('visible');
    if (immediate) {
      hideBackdrop();
    } else {
      setTimeout(hideBackdrop, 250);
    }
  }
}

function toggleResultsHandle(enabled) {
  if (!resultsModalHandle) {
    return;
  }
  resultsModalHandle.disabled = !enabled;
  resultsModalHandle.style.opacity = enabled ? '' : '0.6';
  resultsModalHandle.style.pointerEvents = enabled ? '' : 'none';
}

function updateChart(races) {
  const ctx = document.getElementById('raceChart');
  if (!ctx) return;

  if (window.raceChart instanceof Chart) {
    window.raceChart.destroy();
  }

  window.raceChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(races),
      datasets: [
        {
          data: Object.values(races),
          backgroundColor: generateColorPalette(Object.keys(races).length),
          borderWidth: 0,
          cutout: '80%',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      layout: {
        padding: 0,
      },
      plugins: {
        legend: {
          position: 'right',
          align: 'start',
          labels: {
            boxWidth: 8,
            boxHeight: 8,
            padding: 4,
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          displayColors: false,
          bodyFont: {
            size: 12,
          },
          callbacks: {
            label: function (context) {
              return `${context.raw.toFixed(1)}%`;
            },
          },
        },
      },
    },
  });

  // Update the floating results bar with mini chart
  updateFloatingResultsBar(races);
}

// Function to update the floating results bar / visual legend
function updateFloatingResultsBar(races) {
  const floatingResults = document.getElementById('floatingResults');
  const floatingRacePills = document.getElementById('floatingRacePills');
  const miniChartCtx = document.getElementById('miniRaceChart');

  if (!floatingResults || !floatingRacePills || !miniChartCtx) return;

  floatingResults.classList.add('visible');
  floatingRacePills.innerHTML = '';

  if (window.miniRaceChart instanceof Chart) {
    window.miniRaceChart.destroy();
  }

  const sortedRaces = Object.entries(races)
    .sort((a, b) => b[1] - a[1])
    .filter(([, percent]) => percent > 0);

  sortedRaces.forEach(([race, percent]) => {
    const pill = document.createElement('span');
    pill.className = 'race-pill';
    pill.textContent = `${race}: ${percent.toFixed(1)}%`;
    floatingRacePills.appendChild(pill);
  });

  if (sortedRaces.length > 5) {
    floatingRacePills.classList.add('has-many-races');
  } else {
    floatingRacePills.classList.remove('has-many-races');
  }

  window.miniRaceChart = new Chart(miniChartCtx, {
    type: 'doughnut',
    data: {
      labels: sortedRaces.map(r => r[0]),
      datasets: [
        {
          data: sortedRaces.map(r => r[1]),
          backgroundColor: generateColorPalette(sortedRaces.length),
          borderWidth: 0,
          cutout: '70%',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
    },
  });
}

function generateColorPalette(count) {
  // Base set of vibrant colors that work well together
  const baseColors = [
    '#6366F1', // Indigo
    '#EC4899', // Pink
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#3B82F6', // Blue
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#84CC16', // Lime
    '#06B6D4', // Cyan
    '#9333EA', // Violet
  ];

  // If we need more colors than our base set, generate additional ones
  let colors = [...baseColors];

  if (count > baseColors.length) {
    for (let i = baseColors.length; i < count; i++) {
      // Use golden ratio to get evenly distributed colors
      // 0.618033988749895 is the inverse of the golden ratio
      const h = (i * 0.618033988749895) % 1;
      const s = 0.7; // Saturation at 70%
      const l = 0.6; // Lightness at 60%

      // Convert HSL to hex color
      colors.push(hslToHex(h * 360, s * 100, l * 100));
    }
  }

  return colors.slice(0, count);
}

// Convert HSL to Hex color
function hslToHex(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function validateName() {
  const nameValue = userNameInput.value.trim();
  const namePattern = /^[A-Za-z\s\-']*$/;

  if (nameValue === '' || namePattern.test(nameValue)) {
    // Valid input
    nameError.classList.add('hidden');
    userNameInput.classList.remove('border-red-500');
    userNameInput.classList.add('border-gray-300', 'dark:border-gray-600');
  } else {
    // Invalid input
    nameError.classList.remove('hidden');
    userNameInput.classList.remove('border-gray-300', 'dark:border-gray-600');
    userNameInput.classList.add('border-red-500');
  }
}

function downloadResults() {
  if (
    !raceBreakdown ||
    !downloadButton ||
    !userNameInput ||
    !nameError ||
    !downloadSpinner ||
    !downloadSuccess
  )
    return;

  const nameValue = userNameInput.value.trim();
  const namePattern = /^[A-Za-z\s\-']*$/;

  if (nameValue !== '' && !namePattern.test(nameValue)) {
    nameError.classList.remove('hidden');
    userNameInput.classList.add('border-red-500');
    return;
  }

  // Show loading state
  downloadButton.disabled = true;
  downloadSpinner.classList.remove('opacity-0');
  downloadSpinner.classList.add('opacity-100');

  const capitalizedUserName = nameValue
    ? nameValue.charAt(0).toUpperCase() + nameValue.slice(1)
    : '';
  const chartImage = window.raceChart.toBase64Image('image/png', 1.0);

  const data = [];
  raceBreakdown.querySelectorAll('tbody tr').forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 2) {
      data.push({
        race: cells[0].textContent.trim(),
        percentage: cells[1].textContent.trim(),
      });
    }
  });

  const websiteUrl = 'https://race-calculator.dankoresoft.com/';
  const container = document.createElement('div');
  container.style.cssText = `
        position: fixed;
        top: 0;
        left: -9999px;
        width: 1200px;
        background-color: #FFFFFF;
        font-family: system-ui, -apple-system, sans-serif;
      `;

  const title = capitalizedUserName
    ? `${capitalizedUserName}'s Race Breakdown`
    : 'Race Breakdown';

  container.innerHTML = `
        <div style="width: 1200px; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);">
          <div style="background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); padding: 48px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h1 style="color: white; font-size: 52px; font-weight: 800; margin: 0; letter-spacing: -0.02em; line-height: 1.2;">${title}</h1>
              <div style="display: flex; align-items: center; margin-left: 32px;">
                <span style="color: white; font-size: 20px; opacity: 0.95; letter-spacing: -0.01em;">${websiteUrl}</span>
              </div>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 48px; padding: 48px;">
            <div>
              <div style="background: #F8FAFC; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr>
                      <th style="background: #EEF2FF; padding: 18px; text-align: left; font-size: 20px; color: #4F46E5;">RACE</th>
                      <th style="background: #EEF2FF; padding: 18px; text-align: right; font-size: 20px; color: #4F46E5;">PERCENTAGE</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data
                      .map(
                        row => `
                        <tr>
                          <td style="padding: 16px 18px; font-size: 18px; border-bottom: 1px solid #E2E8F0;">${row.race}</td>
                          <td style="padding: 16px 18px; font-size: 18px; text-align: right; color: #4F46E5; border-bottom: 1px solid #E2E8F0;">${row.percentage}</td>
                        </tr>
                      `
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div>
              <div style="background: #F8FAFC; border-radius: 16px; padding: 24px; min-height: 400px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                <img src="${chartImage}" alt="Race Chart" style="width: 100%; max-width: 500px;" >
              </div>
            </div>
          </div>
          
          <div style="background: #EEF2FF; padding: 24px; text-align: center; border-top: 1px solid #E2E8F0;">
            <p style="margin: 0; color: #4F46E5; font-size: 18px;">
              Discover your unique race blend at
              <span style="font-weight: bold;">${websiteUrl}</span>
            </p>
          </div>
        </div>
      `;

  document.body.appendChild(container);

  setTimeout(() => {
    html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      width: 1200,
      height: container.offsetHeight,
      windowWidth: 1200,
      windowHeight: container.offsetHeight,
      allowTaint: true,
      onclone: function (clonedDoc) {
        const clonedContainer = clonedDoc.querySelector('div');
        if (clonedContainer) {
          clonedContainer.style.width = '1200px';
          clonedContainer.style.height = 'auto';
        }
      },
    })
      .then(canvas => {
        document.body.removeChild(container);

        // Hide loading state
        downloadSpinner.classList.remove('opacity-100');
        downloadSpinner.classList.add('opacity-0');
        downloadButton.disabled = false;

        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png', 1.0);
        a.download = capitalizedUserName
          ? `${capitalizedUserName}_race_results.png`
          : 'race_results.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Show success message
        downloadSuccess.classList.remove('hidden');
        setTimeout(() => {
          downloadSuccess.classList.add('hidden');
        }, 3000); // Hide success message after 3 seconds
      })
      .catch(error => {
        console.error('Error:', error);
        if (container.parentNode) container.parentNode.removeChild(container);

        // Reset loading state on error
        downloadSpinner.classList.remove('opacity-100');
        downloadSpinner.classList.add('opacity-0');
        downloadButton.disabled = false;
      });
  }, 100);
}

// Function to reset race entries to default
function resetRaceEntries() {
  const nodesToReset = getAllEditableNodes();
  if (!nodesToReset.length) return;

  withSuppressedCalculation(() => {
    nodesToReset.forEach(node => resetNodeEntries(node));
  });

  // Clear the results
  if (raceBreakdown) {
    raceBreakdown.innerHTML = '';
  }

  // Clear the chart
  if (window.raceChart instanceof Chart) {
    window.raceChart.data.labels = [];
    window.raceChart.data.datasets[0].data = [];
    window.raceChart.update();
  }

  // Hide the floating results bar
  const floatingResults = document.getElementById('floatingResults');
  if (floatingResults) {
    floatingResults.classList.remove('visible');
  }

  // Disable action buttons
  if (downloadButton) {
    downloadButton.disabled = true;
  }
  if (saveButton) {
    saveButton.disabled = true;
  }

  updateSiblingSummaries();
  renderParentSummary();
  toggleResultsHandle(false);
  hideResultsModal(true);

  // Clear any warnings
  hideWarning();
}

export {
  debouncedCalculateRace as calculateRace,
  updateSavedResultsList,
  applyGrandparentWeighting,
};

function saveResults() {
  // Get the current calculation results
  if (!window.raceChart || !window.raceChart.data) {
    return;
  }

  // Create a timestamp for the saved result
  const timestamp = new Date().toISOString();
  const name =
    userNameInput && userNameInput.value.trim()
      ? userNameInput.value.trim()
      : 'Unnamed';

  // Create the data object to save
  const saveData = {
    timestamp,
    name,
    labels: window.raceChart.data.labels,
    data: window.raceChart.data.datasets[0].data,
  };

  // Get existing saved results from localStorage or initialize empty array
  let savedResults = JSON.parse(
    localStorage.getItem('raceCalculatorResults') || '[]'
  );

  // Add the new result to the beginning of the array (most recent first)
  savedResults.unshift(saveData);

  // Limit to 10 saved results to prevent localStorage from filling up
  if (savedResults.length > 10) {
    savedResults = savedResults.slice(0, 10);
  }

  // Save back to localStorage
  localStorage.setItem('raceCalculatorResults', JSON.stringify(savedResults));

  // Show feedback to the user
  const saveSuccess = document.getElementById('saveSuccess');
  if (saveSuccess) {
    saveSuccess.classList.remove('hidden');
    setTimeout(() => {
      saveSuccess.classList.add('hidden');
    }, 3000);
  }

  // Update any UI that shows saved results (if implemented)
  updateSavedResultsList();
}

function updateSavedResultsList() {
  const savedResultsList = document.getElementById('savedResultsList');
  if (!savedResultsList) return;

  // Get saved results from localStorage
  const savedResults = JSON.parse(
    localStorage.getItem('raceCalculatorResults') || '[]'
  );

  if (savedResults.length === 0) {
    savedResultsList.innerHTML =
      '<p class="text-gray-700 dark:text-gray-200 text-sm italic p-4">No saved results yet.</p>';
    return;
  }

  // Generate the HTML for the list
  let html = '';

  savedResults.forEach((result, index) => {
    const date = new Date(result.timestamp).toLocaleDateString();
    const time = new Date(result.timestamp).toLocaleTimeString();

    html += `
      <div class="saved-result p-4 border-b border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <div class="flex items-center mb-1">
              <svg class="w-4 h-4 text-indigo-700 dark:text-indigo-300 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <span class="font-semibold text-gray-900 dark:text-white">${
                result.name
              }</span>
            </div>
            <div class="flex items-center text-xs text-gray-700 dark:text-gray-200">
              <svg class="w-3.5 h-3.5 text-gray-600 dark:text-gray-300 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span>${date}, ${time}</span>
            </div>
          </div>
          <div class="flex space-x-2">
            <button class="load-result-btn text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100 py-1.5 px-3 rounded font-medium hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors duration-150 ease-in-out flex items-center justify-center shadow-sm" data-index="${index}">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
              </svg>
              Load
            </button>
            <button class="delete-result-btn text-sm bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 py-1.5 px-3 rounded font-medium hover:bg-red-200 dark:hover:bg-red-800 transition-colors duration-150 ease-in-out flex items-center justify-center shadow-sm" data-index="${index}">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              Delete
            </button>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap gap-1.5">
          ${result.labels
            .map(
              (label, i) =>
                `<span class="text-xs px-2.5 py-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-full border border-gray-300 dark:border-gray-600 font-medium">${label}: <span class="text-indigo-800 dark:text-indigo-200 font-semibold">${result.data[
                  i
                ].toFixed(1)}%</span></span>`
            )
            .join('')}
        </div>
      </div>
    `;
  });

  savedResultsList.innerHTML = html;

  // Add event listeners to the load buttons
  savedResultsList.querySelectorAll('.load-result-btn').forEach(button => {
    button.addEventListener('click', e => {
      const index = parseInt(
        e.target.dataset.index ||
          e.target.closest('.load-result-btn').dataset.index,
        10
      );
      loadSavedResult(index);
    });
  });

  // Add event listeners to the delete buttons
  savedResultsList.querySelectorAll('.delete-result-btn').forEach(button => {
    button.addEventListener('click', e => {
      const index = parseInt(
        e.target.dataset.index ||
          e.target.closest('.delete-result-btn').dataset.index,
        10
      );
      deleteSavedResult(index);
    });
  });
}

// Function to delete a saved result
function deleteSavedResult(index) {
  // Get current saved results
  const savedResults = JSON.parse(
    localStorage.getItem('raceCalculatorResults') || '[]'
  );

  // Check if the index is valid
  if (index < 0 || index >= savedResults.length) return;

  // Ask for confirmation
  if (confirm('Are you sure you want to delete this saved result?')) {
    // Remove the result at the specified index
    savedResults.splice(index, 1);

    // Save the updated array back to localStorage
    localStorage.setItem('raceCalculatorResults', JSON.stringify(savedResults));

    // Show a brief deletion message
    const savedResultsList = document.getElementById('savedResultsList');
    const deleteFeedback = document.createElement('div');
    deleteFeedback.className =
      'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-sm py-2 px-3 rounded-md transition-all duration-300 mb-2 text-center font-medium';
    deleteFeedback.innerHTML = `
      <div class="flex items-center justify-center space-x-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Result deleted successfully!</span>
      </div>
    `;

    // Insert the feedback at the top of the list
    if (savedResultsList.firstChild) {
      savedResultsList.insertBefore(
        deleteFeedback,
        savedResultsList.firstChild
      );
    } else {
      savedResultsList.appendChild(deleteFeedback);
    }

    // Remove the feedback message after 3 seconds
    setTimeout(() => {
      deleteFeedback.remove();
      // Update the saved results list
      updateSavedResultsList();
    }, 1500);
  }
}

function loadSavedResult(index) {
  const savedResults = JSON.parse(
    localStorage.getItem('raceCalculatorResults') || '[]'
  );
  if (!savedResults[index]) return;

  const result = savedResults[index];

  // Show loading effect on the button
  const buttons = document.querySelectorAll('.load-result-btn');
  buttons.forEach(btn => {
    if (parseInt(btn.dataset.index, 10) === index) {
      // Add loading state
      const originalContent = btn.innerHTML;
      btn.innerHTML = `
        <svg class="animate-spin h-4 w-4 text-indigo-700 dark:text-indigo-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="ml-1.5">Loading...</span>
      `;

      // Restore original content after a short delay
      setTimeout(() => {
        btn.innerHTML = originalContent;
      }, 1000);
    }
  });

  // Update the name input if it exists
  if (userNameInput) {
    userNameInput.value = result.name;
  }

  // Create a races object to update the display
  const races = {};
  result.labels.forEach((label, i) => {
    races[label] = result.data[i];
  });

  // Update the display which will also create/update the chart
  displayResult(races);

  // Scroll to results section
  document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}
