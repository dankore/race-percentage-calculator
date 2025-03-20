import { showWarning, hideWarning } from './uiHandlers.js';

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
  resetRaceButton;

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

let debounceTimer;

export function initializeNodes() {
  // Get fresh DOM references
  if (!initializeDOMReferences()) {
    return false;
  }

  // Add initial race entries and set up event listeners
  [motherNode, fatherNode].forEach(node => {
    addRaceEntry(node);

    const addButton = node.querySelector('.add-entry');
    if (addButton) {
      addButton.addEventListener('click', () => {
        addRaceEntry(node);
      });
    }
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

  return true;
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

        // Process both parents if data is available
        if (racesData && racesData.mother && racesData.father) {
          populateParentRaces('mother', racesData.mother);
          populateParentRaces('father', racesData.father);

          // Calculate the race after both parents are populated
          debouncedCalculateRace();
        }
      } catch (error) {
        console.error('Error applying sample race:', error);
      }
    });
  });
}

function populateParentRaces(parentId, racesData) {
  if (!Array.isArray(racesData) || racesData.length === 0) {
    return;
  }

  const parentNode = document.getElementById(parentId);
  if (!parentNode) {
    return;
  }

  // Clear existing entries except for the first one
  const entriesContainer = parentNode.querySelector('.race-entries');
  if (!entriesContainer) {
    return;
  }

  while (entriesContainer.children.length > 1) {
    entriesContainer.removeChild(entriesContainer.lastChild);
  }

  // Fill the first entry
  const firstEntry = entriesContainer.querySelector('.race-entry');
  if (firstEntry) {
    const raceInput = firstEntry.querySelector('.race-input');
    const percentInput = firstEntry.querySelector('.percent-input');

    if (raceInput && percentInput && racesData[0]) {
      raceInput.value = racesData[0].race;
      percentInput.value = racesData[0].percent;
    }
  }

  // Add additional entries for remaining races
  for (let i = 1; i < racesData.length; i++) {
    addRaceEntry(parentNode);
    const entryElement = entriesContainer.lastElementChild;

    if (entryElement) {
      const raceInput = entryElement.querySelector('.race-input');
      const percentInput = entryElement.querySelector('.percent-input');

      if (raceInput && percentInput) {
        raceInput.value = racesData[i].race;
        percentInput.value = racesData[i].percent;
      }
    }
  }

  // Update UI for this parent
  checkScrolling(entriesContainer);
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
  debouncedCalculateRace();

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

function debouncedCalculateRace() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const { races, isValid, warningMessage } = calculateRace();
    updateDisplay(races, isValid, warningMessage);
  }, 300); // 300ms debounce time
}

function calculateRace() {
  const races = {};
  let isValid = true;
  let warningMessage = '';

  [motherNode, fatherNode].forEach(parentNode => {
    let totalPercent = 0;
    let allFieldsFilled = true;

    parentNode.querySelectorAll('.race-entry').forEach(entry => {
      const raceInput = entry.querySelector('.race-input');
      const percentInput = entry.querySelector('.percent-input');

      if (raceInput && percentInput) {
        const race = raceInput.value.trim();
        const percent = parseFloat(percentInput.value);

        if (!race || isNaN(percent)) {
          allFieldsFilled = false;
        } else {
          totalPercent += percent;
          // Each parent's percentages are halved to produce final child breakdown
          races[race] = (races[race] || 0) + percent / 2;
        }
      }
    });

    if (!allFieldsFilled) {
      isValid = false;
      warningMessage = 'Please fill in all race fields.';
    } else if (Math.abs(totalPercent - 100) > 0.01) {
      isValid = false;
      const parentName =
        parentNode.id.charAt(0).toUpperCase() + parentNode.id.slice(1);
      warningMessage += `${parentName}'s race percentages should add up to 100%. `;
    }
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
  }
}

function displayResult(races) {
  const sortedRaces = Object.entries(races)
    .sort((a, b) => b[1] - a[1])
    .map(([race, percent]) => [race.toUpperCase(), percent]);

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

  if (downloadButton) {
    downloadButton.disabled = false;
  }

  if (saveButton) {
    saveButton.disabled = false;
  }
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

// Function to update the floating results bar
function updateFloatingResultsBar(races) {
  const floatingResults = document.getElementById('floatingResults');
  const floatingRacePills = document.getElementById('floatingRacePills');
  const miniChartCtx = document.getElementById('miniRaceChart');

  if (!floatingResults || !floatingRacePills || !miniChartCtx) return;

  // Make the floating bar visible
  floatingResults.classList.add('visible');

  // Clear existing race pills
  floatingRacePills.innerHTML = '';

  // Create the mini chart
  if (window.miniRaceChart instanceof Chart) {
    window.miniRaceChart.destroy();
  }

  // Get top 3 races or all if less than 3
  const sortedRaces = Object.entries(races)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Create pills for top races
  sortedRaces.forEach(([race, percent]) => {
    const pill = document.createElement('span');
    pill.className = 'race-pill';
    pill.textContent = `${race}: ${percent.toFixed(1)}%`;
    floatingRacePills.appendChild(pill);
  });

  // Create mini chart
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
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
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
  if (!motherNode || !fatherNode) return;

  [motherNode, fatherNode].forEach(node => {
    // Get the race entries container
    const entriesContainer = node.querySelector('.race-entries');
    if (!entriesContainer) return;

    // Clear existing entries
    entriesContainer.innerHTML = '';

    // Add a single empty entry
    addRaceEntry(node);

    // Update UI for this parent
    checkScrolling(entriesContainer);
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

  // Disable the download button
  if (downloadButton) {
    downloadButton.disabled = true;
  }

  // Clear any warnings
  hideWarning();
}

export { debouncedCalculateRace as calculateRace, updateSavedResultsList };

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
          <button class="load-result-btn text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100 py-1.5 px-3 rounded font-medium hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors duration-150 ease-in-out flex items-center justify-center shadow-sm" data-index="${index}">
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
            Load Result
          </button>
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
