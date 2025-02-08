import { showWarning, hideWarning } from './uiHandlers.js';

const motherNode = document.getElementById('mother');
const fatherNode = document.getElementById('father');
const ethnicityBreakdown = document.getElementById('ethnicityBreakdown');
const entryTemplate = document.getElementById('ethnicity-entry-template');
const downloadButton = document.getElementById('downloadButton');
const userNameInput = document.getElementById('userName');
const nameError = document.getElementById('nameError');

let debounceTimer;

export function initializeNodes() {
  [motherNode, fatherNode].forEach(node => {
    addEthnicityEntry(node);
    const addButton = node.querySelector('.add-entry');
    if (addButton) {
      addButton.addEventListener('click', () => addEthnicityEntry(node));
    }
  });

  downloadButton.addEventListener('click', downloadResults);
  userNameInput.addEventListener('input', validateName);
}

export function addEthnicityEntry(parentNode) {
  const entriesContainer = parentNode.querySelector('.ethnicity-entries');
  const newEntry = document.importNode(entryTemplate.content, true);
  entriesContainer.appendChild(newEntry);

  setupEntryListeners(newEntry);

  checkScrolling(entriesContainer);
  debouncedCalculateEthnicity();
}

function setupEntryListeners(entry) {
  const inputs = entry.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', debouncedCalculateEthnicity);
  });

  const deleteButton = entry.querySelector('.delete-entry');
  if (deleteButton) {
    deleteButton.addEventListener('click', function () {
      const entriesContainer = this.closest('.ethnicity-entries');
      if (entriesContainer.children.length > 1) {
        entriesContainer.removeChild(this.closest('.ethnicity-entry'));
        debouncedCalculateEthnicity();
        checkScrolling(entriesContainer);
      } else {
        showWarning('Please keep at least one entry for each parent.');
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

function debouncedCalculateEthnicity() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const { ethnicities, isValid, warningMessage } = calculateEthnicity();
    updateDisplay(ethnicities, isValid, warningMessage);
  }, 300); // 300ms debounce time
}

function calculateEthnicity() {
  const ethnicities = {};
  let isValid = true;
  let warningMessage = '';

  [motherNode, fatherNode].forEach(parentNode => {
    let totalPercent = 0;
    let allFieldsFilled = true;

    parentNode.querySelectorAll('.ethnicity-entry').forEach(entry => {
      const ethnicityInput = entry.querySelector('.ethnicity-input');
      const percentInput = entry.querySelector('.percent-input');

      if (ethnicityInput && percentInput) {
        const ethnicity = ethnicityInput.value.trim();
        const percent = parseFloat(percentInput.value);

        if (!ethnicity || isNaN(percent)) {
          allFieldsFilled = false;
        } else {
          totalPercent += percent;
          // Each parent's percentages are halved to produce final child breakdown
          ethnicities[ethnicity] = (ethnicities[ethnicity] || 0) + percent / 2;
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

  return { ethnicities, isValid, warningMessage };
}

function updateDisplay(ethnicities, isValid, warningMessage) {
  if (isValid) {
    hideWarning();
    displayResult(ethnicities);
  } else {
    showWarning(warningMessage);
    ethnicityBreakdown.innerHTML = '';
    // Clear the chart
    if (window.ethnicityChart instanceof Chart) {
      window.ethnicityChart.data.labels = [];
      window.ethnicityChart.data.datasets[0].data = [];
      window.ethnicityChart.update();
    }
    // Disable the download button
    downloadButton.disabled = true;
  }
}

function displayResult(ethnicities) {
  const sortedEthnicities = Object.entries(ethnicities)
    .sort((a, b) => b[1] - a[1])
    .map(([race, percent]) => [race.toUpperCase(), percent]);

  let resultHTML = `
        <table class="w-full text-sm">
          <thead>
            <tr>
              <th class="bg-indigo-100 text-left p-1.5 text-indigo-900 font-medium">RACE</th>
              <th class="bg-indigo-100 text-right p-1.5 text-indigo-900 font-medium w-20">%</th>
            </tr>
          </thead>
          <tbody>
      `;

  for (const [race, percent] of sortedEthnicities) {
    resultHTML += `
          <tr>
            <td class="p-1.5">${race}</td>
            <td class="p-1.5 text-right text-indigo-600">${percent.toFixed(
              1
            )}</td>
          </tr>
        `;
  }

  resultHTML += `
          </tbody>
        </table>
      `;

  ethnicityBreakdown.innerHTML = resultHTML;
  updateChart(Object.fromEntries(sortedEthnicities));

  if (downloadButton) {
    downloadButton.disabled = false;
  }
}

function updateChart(ethnicities) {
  const ctx = document.getElementById('ethnicityChart');
  if (!ctx) return;

  if (window.ethnicityChart instanceof Chart) {
    window.ethnicityChart.destroy();
  }

  window.ethnicityChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(ethnicities),
      datasets: [
        {
          data: Object.values(ethnicities),
          backgroundColor: ['#6366F1', '#EC4899'],
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
  const ethnicityBreakdown = document.getElementById('ethnicityBreakdown');
  const downloadButton = document.getElementById('downloadButton');
  const userNameInput = document.getElementById('userName');
  const nameError = document.getElementById('nameError');
  const loadingSpinner = document.getElementById('loadingSpinner');

  if (!ethnicityBreakdown || !downloadButton || !userNameInput || !nameError)
    return;

  const nameValue = userNameInput.value.trim();
  const namePattern = /^[A-Za-z\s\-']*$/;

  if (nameValue !== '' && !namePattern.test(nameValue)) {
    nameError.classList.remove('hidden');
    userNameInput.classList.add('border-red-500');
    return;
  }

  const capitalizedUserName = nameValue
    ? nameValue.charAt(0).toUpperCase() + nameValue.slice(1)
    : '';
  const chartImage = window.ethnicityChart.toBase64Image('image/png', 1.0);

  const data = [];
  ethnicityBreakdown.querySelectorAll('tbody tr').forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 2) {
      data.push({
        ethnicity: cells[0].textContent.trim(),
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
                          <td style="padding: 16px 18px; font-size: 18px; border-bottom: 1px solid #E2E8F0;">${row.ethnicity}</td>
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
  if (loadingSpinner) loadingSpinner.classList.remove('hidden');

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
        if (loadingSpinner) loadingSpinner.classList.add('hidden');

        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png', 1.0);
        a.download = capitalizedUserName
          ? `${capitalizedUserName}_race_results.png`
          : 'race_results.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      })
      .catch(error => {
        console.error('Error:', error);
        if (container.parentNode) container.parentNode.removeChild(container);
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
      });
  }, 100);
}

export { debouncedCalculateEthnicity as calculateEthnicity };
