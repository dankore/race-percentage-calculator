import { addRaceEntry, calculateRace } from './raceCalculator.js';

const TRANSFER_STORAGE_KEY = 'dna-kit-transfer-v1';
const TRANSFER_TTL_MS = 10 * 60 * 1000;

const state = {
  vendor: 'generic',
  parsedRegions: [],
  latestCalculatorResult: [],
  previewNote: '',
};

const elements = {};

const STATUS_COLORS = {
  idle: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-700 dark:text-gray-200',
  },
  success: {
    bg: 'bg-green-100 dark:bg-green-900/40',
    text: 'text-green-700 dark:text-green-300',
  },
  warning: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/50',
    text: 'text-yellow-800 dark:text-yellow-200',
  },
  danger: {
    bg: 'bg-red-100 dark:bg-red-900/50',
    text: 'text-red-700 dark:text-red-200',
  },
};

export function setupDnaKitImport() {
  cacheElements();
  hydratePendingTransfer();
  if (!elements.section) {
    return;
  }

  wireVendorButtons();
  wireFileInput();
  wireDropZone();
  wireActionButtons();
  wireComparison();

  setStatus('Waiting for kit data', 'idle');
  document.addEventListener('race-results-ready', event => {
    const detail = event && event.detail;
    state.latestCalculatorResult = (detail && detail.races) || [];
    toggleCompareAvailability();
  });

  toggleApplyButtons(false);
  toggleCompareAvailability();
}

function cacheElements() {
  elements.section = document.getElementById('dnaImportSection');
  elements.transferNotice = document.getElementById('dnaTransferNotice');
  if (!elements.section) {
    return;
  }

  elements.status = document.getElementById('dnaImportStatus');
  elements.vendorButtons = elements.section.querySelectorAll('.dna-vendor-btn');
  elements.rawInput = document.getElementById('dnaRawInput');
  elements.parseButton = document.getElementById('dnaParseButton');
  elements.applyMother = document.getElementById('dnaApplyMother');
  elements.applyFather = document.getElementById('dnaApplyFather');
  elements.message = document.getElementById('dnaImportMessage');
  elements.preview = document.getElementById('dnaImportPreview');
  elements.compareButton = document.getElementById('dnaCompareButton');
  elements.comparisonSummary = document.getElementById('dnaComparisonSummary');
  elements.comparisonTable = document.getElementById('dnaComparisonTable');
  elements.fileInput = document.getElementById('dnaFileInput');
  elements.fileTrigger = document.getElementById('dnaFileTrigger');
  elements.dropZone = document.getElementById('dnaDropZone');
}

function wireVendorButtons() {
  elements.vendorButtons.forEach(button => {
    button.addEventListener('click', () => {
      elements.vendorButtons.forEach(btn => {
        btn.classList.remove('ring-2', 'ring-indigo-500');
      });
      button.classList.add('ring-2', 'ring-indigo-500');
      state.vendor = button.dataset.dnaVendor || 'generic';
      setMessage(`Parsing optimized for ${button.textContent.trim()}.`);
    });
  });
}

function wireFileInput() {
  if (!elements.fileTrigger || !elements.fileInput) {
    return;
  }

  elements.fileTrigger.addEventListener('click', () => elements.fileInput.click());
  elements.fileInput.addEventListener('change', event => {
    const files = event.target && event.target.files;
    const file = files && files[0];
    if (file) {
      processImportedFile(file);
    }
  });
}

function processImportedFile(file) {
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    setMessage('File is larger than 2 MB. Please trim or export fewer columns.', true);
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    if (elements.rawInput) {
      const readerResult = e && e.target ? e.target.result : '';
      elements.rawInput.value = (readerResult || '').toString();
    }
    setMessage(`Loaded "${file.name}". Click “Parse DNA data” to continue.`);
  };
  reader.onerror = () => {
    setMessage('Unable to read that file. Please try again.', true);
  };
  reader.readAsText(file);
}

function wireDropZone() {
  if (!elements.dropZone || !elements.fileInput) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    elements.dropZone.addEventListener(eventName, event => {
      event.preventDefault();
      event.stopPropagation();
      elements.dropZone.classList.add(
        'border-indigo-400',
        'bg-indigo-100/60',
        'dark:bg-indigo-900/50'
      );
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    elements.dropZone.addEventListener(eventName, event => {
      event.preventDefault();
      event.stopPropagation();
      elements.dropZone.classList.remove(
        'border-indigo-400',
        'bg-indigo-100/60',
        'dark:bg-indigo-900/50'
      );
    });
  });

  elements.dropZone.addEventListener('drop', event => {
    const dataTransfer = event.dataTransfer;
    const files = dataTransfer && dataTransfer.files;
    const file = files && files[0];
    if (file) {
      processImportedFile(file);
    }
  });
}

function wireActionButtons() {
  if (elements.parseButton) {
    elements.parseButton.addEventListener('click', parseCurrentInput);
  }
  if (elements.applyMother) {
    elements.applyMother.addEventListener('click', () => {
      if (applyRegionsToParent('mother')) {
        setMessage('Applied kit data to Mother. Review the values and adjust if needed.');
        setStatus('Mother updated from kit import', 'success');
      }
    });
  }
  if (elements.applyFather) {
    elements.applyFather.addEventListener('click', () => {
      if (applyRegionsToParent('father')) {
        setMessage('Applied kit data to Father. Review the values and adjust if needed.');
        setStatus('Father updated from kit import', 'success');
      }
    });
  }
}

function wireComparison() {
  if (!elements.compareButton) return;
  elements.compareButton.addEventListener('click', () => {
    if (!state.parsedRegions.length) {
      setMessage('Parse DNA data first to run a comparison.', true);
      return;
    }
    if (!state.latestCalculatorResult.length) {
      setMessage('Calculate results first before comparing to your DNA kit.', true);
      return;
    }
    renderComparison();
  });
}

function parseCurrentInput() {
  const raw = elements.rawInput ? elements.rawInput.value : '';
  try {
    const { regions, note } = parseDnaData(raw);
    if (!regions.length) {
      throw new Error('No percentages detected. Double-check the formatting.');
    }
    state.parsedRegions = regions;
    state.previewNote = note;
    renderPreview();
    toggleApplyButtons(true);
    toggleCompareAvailability();
    setStatus(`Parsed ${regions.length} regions. Ready to apply.`, 'success');
    setMessage(
      note || 'Pick Mother or Father to auto-fill their races. Smaller than 1% entries were ignored.'
    );
  } catch (error) {
    state.parsedRegions = [];
    renderPreview();
    toggleApplyButtons(false);
    toggleCompareAvailability();
    setStatus(error.message, 'danger');
    setMessage(error.message, true);
  }
}

function parseDnaData(rawInput) {
  const raw = rawInput.trim();
  if (!raw) {
    throw new Error('Paste or load your DNA data first.');
  }

  let entries = [];

  // Try JSON first
  try {
    const json = JSON.parse(raw);
    entries = flattenJsonRegions(json);
  } catch (_) {
    // ignore JSON parse errors
  }

  if (!entries.length) {
    entries = parseDelimitedLines(raw);
  }

  if (!entries.length) {
    throw new Error('Unable to detect recognizable DNA data. Try CSV, JSON, or "Name - 34%" lines.');
  }

  const { regions, note } = normalizeRegions(entries);
  return { regions, note };
}

function flattenJsonRegions(payload) {
  const results = [];

  function traverse(node) {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(item => traverse(item));
      return;
    }
    if (typeof node === 'object') {
      const label = node.label || node.name || node.region || node.population || node.ethnicity;
      const percent = firstNumber(
        node.percent,
        node.percentage,
        node.value,
        node.score,
        node.amount,
        node.share
      );

      if (label && typeof percent === 'number' && !Number.isNaN(percent)) {
        results.push({ label, percent });
      }

      ['children', 'regions', 'entries', 'values'].forEach(key => {
        if (node[key]) {
          traverse(node[key]);
        }
      });
    }
  }

  traverse(payload);
  return results;
}

function parseDelimitedLines(raw) {
  const lines = raw.split(/\r?\n+/);
  const items = [];

  lines.forEach(line => {
    const cleaned = line.trim();
    if (!cleaned) return;

    // Pattern: Label,Number
    let match =
      cleaned.match(/^(.+?)[,\t;:\-]\s*([0-9]+(?:\.[0-9]+)?)\s*%?$/i) ||
      cleaned.match(/^([0-9]+(?:\.[0-9]+)?)\s*%?\s*[-:]\s*(.+)$/i);

    if (!match) {
      // Pattern: Label (Number%)
      match = cleaned.match(/^(.+?)\s*\(?\s*([0-9]+(?:\.[0-9]+)?)\s*%\s*\)?$/i);
    }

    if (match) {
      const [_, part1, part2] = match;
      const isFirstNumber = !isNaN(parseFloat(part1));
      const label = isFirstNumber ? part2 : part1;
      const value = isFirstNumber ? parseFloat(part1) : parseFloat(part2);
      if (label && !Number.isNaN(value)) {
        items.push({ label, percent: value });
      }
    }
  });

  return items;
}

function normalizeRegions(entries) {
  const map = new Map();

  entries.forEach(entry => {
    const label = formatRegionLabel(entry.label);
    const percent = Number(entry.percent);
    if (!label || Number.isNaN(percent) || percent <= 0) {
      return;
    }
    const key = label.toLowerCase();
    const existing = map.get(key);
    map.set(key, {
      label,
      percent: (existing ? existing.percent : 0) + percent,
    });
  });

  let regions = Array.from(map.values()).filter(item => item.percent >= 1);
  if (!regions.length) {
    return { regions: [], note: '' };
  }

  const total = regions.reduce((sum, item) => sum + item.percent, 0);
  let note = '';
  if (Math.abs(total - 100) > 0.5) {
    regions = regions.map(item => ({
      label: item.label,
      percent: parseFloat(((item.percent / total) * 100).toFixed(2)),
    }));
    note = 'Percentages were normalized to 100% for comparison.';
  }

  regions.sort((a, b) => b.percent - a.percent);
  return { regions, note };
}

function formatRegionLabel(label) {
  if (!label) return '';
  const cleaned = label
    .replace(/\(.*?\)/g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();
  if (!cleaned) return '';
  return cleaned
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (['and', '&', 'of', 'the'].includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace(/\s+/g, ' ');
}

function renderPreview() {
  if (!elements.preview) return;

  if (!state.parsedRegions.length) {
    elements.preview.innerHTML =
      '<p class="text-xs text-gray-600 dark:text-gray-400 italic">No kit loaded yet.</p>';
    return;
  }

  const rows = state.parsedRegions.slice(0, 8).map(
    region => `
      <div class="flex items-center justify-between bg-white/70 dark:bg-gray-800/60 rounded-xl px-3 py-2 border border-indigo-50 dark:border-indigo-800">
        <div class="text-sm font-semibold text-gray-800 dark:text-gray-100">${region.label}</div>
        <div class="flex items-center gap-2">
          <div class="w-20 h-2 bg-indigo-100 dark:bg-indigo-800 rounded-full overflow-hidden">
            <div class="h-full bg-indigo-500" style="width:${Math.min(region.percent, 100)}%;"></div>
          </div>
          <span class="text-indigo-700 dark:text-indigo-200 font-semibold">${region.percent.toFixed(1)}%</span>
        </div>
      </div>
    `
  );

  const note = state.previewNote
    ? `<p class="text-xs text-indigo-700 dark:text-indigo-200 mt-3">${state.previewNote}</p>`
    : '';

  elements.preview.innerHTML = rows.join('') + note;
}

function toggleApplyButtons(isEnabled) {
  [elements.applyMother, elements.applyFather].forEach(button => {
    if (button) {
      button.disabled = !isEnabled;
    }
  });
}

function applyRegionsToParent(parentId) {
  if (!state.parsedRegions.length) {
    setMessage('Parse DNA data before sending it to the calculator.', true);
    return false;
  }

  const parentNode = document.getElementById(parentId);
  if (parentNode && populateParentEntries(parentNode, state.parsedRegions)) {
    calculateRace();
    setStatus(
      `${parentId === 'mother' ? "Mother's" : "Father's"} entries updated from DNA kit`,
      'success'
    );
    return true;
  }

  if (storeTransferPayload(parentId, state.parsedRegions)) {
    setMessage('Opening the race calculator to apply your DNA kit data...', false);
    setStatus('Redirecting to calculator', 'warning');
    redirectToCalculator();
    return true;
  }

  setMessage('Unable to send DNA kit data to the calculator right now.', true);
  return false;
}

function toggleCompareAvailability() {
  if (!elements.compareButton) return;
  const enabled = state.parsedRegions.length && state.latestCalculatorResult.length;
  elements.compareButton.disabled = !enabled;
}

function renderComparison() {
  if (!elements.comparisonTable || !elements.comparisonSummary) return;

  const kitMap = new Map();
  state.parsedRegions.forEach(region => {
    kitMap.set(region.label.toLowerCase(), region);
  });

  const calcMap = new Map();
  state.latestCalculatorResult.forEach(region => {
    calcMap.set(region.label.toLowerCase(), region);
  });

  const unionLabels = Array.from(new Set([...kitMap.keys(), ...calcMap.keys()]));
  if (!unionLabels.length) {
    elements.comparisonTable.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-gray-500 dark:text-gray-400 py-3">No overlapping regions to compare.</td>
      </tr>
    `;
    elements.comparisonSummary.textContent =
      'We could not find overlapping regions between the kit and calculator.';
    return;
  }

  const rows = unionLabels
    .map(key => {
      const kit = kitMap.get(key);
      const calc = calcMap.get(key);
      return {
        label: (kit && kit.label) || (calc && calc.label) || key,
        kit: kit ? kit.percent || 0 : 0,
        calc: calc ? calc.percent || 0 : 0,
      };
    })
    .sort((a, b) => b.kit - a.kit || b.calc - a.calc);

  const totalDiff = rows.reduce((sum, row) => sum + Math.abs(row.kit - row.calc), 0);
  const avgDiff = totalDiff / rows.length;
  const score = Math.max(0, Math.round(100 - Math.min(100, avgDiff)));

  elements.comparisonSummary.innerHTML = `
    Match score: <span class="font-semibold text-indigo-600 dark:text-indigo-300">${score}%</span>.
    Avg difference: ${avgDiff.toFixed(1)}%.
    ${
      avgDiff <= 5
        ? 'Great alignment—your manual inputs closely follow the DNA kit.'
        : 'Consider adjusting the parent entries or exploring sub-regions for a closer match.'
    }
  `;

  elements.comparisonTable.innerHTML = rows
    .map(row => {
      const delta = row.kit - row.calc;
      const deltaClass =
        delta > 1
          ? 'text-green-600 dark:text-green-300'
          : delta < -1
            ? 'text-red-600 dark:text-red-300'
            : 'text-gray-600 dark:text-gray-300';
      const deltaLabel = delta === 0 ? '0.0%' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`;
      return `
        <tr>
          <td class="px-3 py-2 font-medium">${row.label}</td>
          <td class="px-3 py-2 text-right">${row.kit.toFixed(1)}%</td>
          <td class="px-3 py-2 text-right">${row.calc.toFixed(1)}%</td>
          <td class="px-3 py-2 text-right ${deltaClass}">${deltaLabel}</td>
        </tr>
      `;
    })
    .join('');
}

function setStatus(message, tone = 'idle') {
  if (!elements.status) return;
  elements.status.textContent = message;

  const removeTokens = classString => {
    classString
      .split(/\s+/)
      .filter(Boolean)
      .forEach(token => elements.status.classList.remove(token));
  };

  const addTokens = classString => {
    classString
      .split(/\s+/)
      .filter(Boolean)
      .forEach(token => elements.status.classList.add(token));
  };

  Object.values(STATUS_COLORS).forEach(colorSet => {
    removeTokens(colorSet.bg);
    removeTokens(colorSet.text);
  });
  const selected = STATUS_COLORS[tone] || STATUS_COLORS.idle;
  addTokens(selected.bg);
  addTokens(selected.text);
}

function setMessage(message, isError = false) {
  if (!elements.message) return;
  elements.message.textContent = message;
  elements.message.classList.toggle('text-red-500', isError);
  if (!isError) {
    elements.message.classList.remove('text-red-500');
  }
}

function hydratePendingTransfer() {
  const payload = readTransferPayload();
  if (!payload) {
    return;
  }

  const tryApply = () => {
    if (applyTransferPayload(payload)) {
      clearTransferPayload();
      return true;
    }
    return false;
  };

  if (tryApply()) {
    return;
  }

  if (!document.getElementById('race-entry-template')) {
    return;
  }

  const handler = () => {
    if (tryApply()) {
      document.removeEventListener('race-calculator-ready', handler);
    }
  };

  document.addEventListener('race-calculator-ready', handler);
}

function readTransferPayload() {
  const raw = localStorage.getItem(TRANSFER_STORAGE_KEY);
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw);
    if (!payload || !payload.regions || !payload.parent) {
      localStorage.removeItem(TRANSFER_STORAGE_KEY);
      return null;
    }
    if (payload.createdAt && Date.now() - payload.createdAt > TRANSFER_TTL_MS) {
      localStorage.removeItem(TRANSFER_STORAGE_KEY);
      return null;
    }
    return payload;
  } catch (error) {
    localStorage.removeItem(TRANSFER_STORAGE_KEY);
    return null;
  }
}

function storeTransferPayload(parentId, regions) {
  if (!Array.isArray(regions) || !regions.length) {
    return false;
  }

  try {
    localStorage.setItem(
      TRANSFER_STORAGE_KEY,
      JSON.stringify({
        parent: parentId,
        regions,
        vendor: state.vendor,
        note: state.previewNote,
        createdAt: Date.now(),
      })
    );
    return true;
  } catch (error) {
    console.error('Unable to store DNA kit data for transfer', error);
    return false;
  }
}

function clearTransferPayload() {
  localStorage.removeItem(TRANSFER_STORAGE_KEY);
}

function applyTransferPayload(payload) {
  if (!payload) return false;
  const parentNode = document.getElementById(payload.parent);
  if (!parentNode) return false;
  if (!populateParentEntries(parentNode, payload.regions)) return false;
  calculateRace();
  displayTransferNotice(payload.parent, payload.vendor);
  return true;
}

function populateParentEntries(parentNode, regions) {
  if (!parentNode || !Array.isArray(regions) || !regions.length) {
    return false;
  }

  const entriesContainer = parentNode.querySelector('.race-entries');
  if (!entriesContainer) {
    return false;
  }

  entriesContainer.innerHTML = '';
  regions.forEach(region => {
    addRaceEntry(parentNode);
    const latestEntry = entriesContainer.lastElementChild;
    if (!latestEntry) return;

    const raceInput = latestEntry.querySelector('.race-input');
    const percentInput = latestEntry.querySelector('.percent-input');
    if (raceInput) {
      raceInput.value = region.label;
    }
    if (percentInput) {
      percentInput.value = Number(region.percent.toFixed(2));
    }
  });

  return true;
}

function displayTransferNotice(parentId, vendor) {
  if (!elements.transferNotice) return;
  const parentLabel = parentId === 'father' ? "Father's" : "Mother's";
  const vendorLabel = vendor && vendor !== 'generic' ? ` from ${vendor}` : '';
  elements.transferNotice.textContent = `${parentLabel} entries were auto-filled with DNA kit data${vendorLabel}.`;
  elements.transferNotice.classList.remove('hidden');
  setTimeout(() => {
    elements.transferNotice.classList.add('hidden');
  }, 8000);
}

function redirectToCalculator() {
  setTimeout(() => {
    window.location.href = '/';
  }, 400);
}

function firstNumber(...values) {
  for (const value of values) {
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }
  }
  return undefined;
}
