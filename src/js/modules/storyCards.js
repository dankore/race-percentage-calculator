let paletteKey = 'sunrise';
let latestRaces = [];
let currentEmbedMarkup = '';

const palettes = {
  sunrise: {
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    accent: '#f97316',
    accentMuted: '#fed7aa',
    text: '#1f2937',
    badge: '#f97316',
    buttonBg: '#ffffff',
    buttonText: '#f97316',
  },
  twilight: {
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    accent: '#7c3aed',
    accentMuted: '#d8b4fe',
    text: '#13072e',
    badge: '#7c3aed',
    buttonBg: '#13072e',
    buttonText: '#fbc2eb',
  },
  forest: {
    gradient: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
    accent: '#059669',
    accentMuted: '#bbf7d0',
    text: '#064e3b',
    badge: '#047857',
    buttonBg: '#064e3b',
    buttonText: '#a7f3d0',
  },
};

const els = {};

export function setupStoryCards() {
  cacheElements();
  if (!els.section) return;

  wirePalettePicker();
  wireInputs();
  wireActions();
  updateStoryCardStatus('Run a calculation to unlock story cards.', 'idle');

  document.addEventListener('race-results-ready', event => {
    const detail = event && event.detail;
    latestRaces = (detail && detail.races) || [];
    const hasData = latestRaces.length > 0;
    toggleControls(hasData);
    if (hasData) {
      updateStoryCardStatus('Story card ready. Customize and share!', 'success');
      renderStoryCard();
    } else {
      updateStoryCardStatus('Need at least one result to build the card.', 'idle');
    }
  });

  toggleControls(false);
}

function cacheElements() {
  els.section = document.getElementById('storyCardsSection');
  if (!els.section) return;

  els.status = document.getElementById('storyCardStatus');
  els.paletteButtons = els.section.querySelectorAll('.story-palette-btn');
  els.taglineInput = document.getElementById('storyCardTagline');
  els.ctaInput = document.getElementById('storyCardCTA');
  els.preview = document.getElementById('storyCardPreview');
  els.embedCode = document.getElementById('storyCardEmbedCode');
  els.generateButton = document.getElementById('storyCardGenerate');
  els.downloadButton = document.getElementById('storyCardDownload');
  els.copyButton = document.getElementById('storyCardCopyEmbed');
}

function wirePalettePicker() {
  els.paletteButtons.forEach(button => {
    button.addEventListener('click', () => {
      paletteKey = button.dataset.storyPalette || 'sunrise';
      els.paletteButtons.forEach(btn => btn.classList.remove('ring-2', 'ring-offset-2', 'ring-indigo-400'));
      button.classList.add('ring-2', 'ring-offset-2', 'ring-indigo-400');
      if (latestRaces.length) {
        renderStoryCard();
      }
    });
  });
}

function wireInputs() {
  ['input', 'change'].forEach(evt => {
    if (els.taglineInput) {
      els.taglineInput.addEventListener(evt, () => debounceRender());
    }
    if (els.ctaInput) {
      els.ctaInput.addEventListener(evt, () => debounceRender());
    }
  });
}

function wireActions() {
  if (els.generateButton) {
    els.generateButton.addEventListener('click', () => renderStoryCard(true));
  }
  if (els.downloadButton) {
    els.downloadButton.addEventListener('click', downloadStoryCard);
  }
  if (els.copyButton) {
    els.copyButton.addEventListener('click', copyEmbedMarkup);
  }
}

let renderTimeout;
function debounceRender() {
  if (!latestRaces.length) return;
  clearTimeout(renderTimeout);
  renderTimeout = setTimeout(renderStoryCard, 200);
}

function renderStoryCard(announce = false) {
  if (!els.preview) return;
  if (!latestRaces.length) {
    els.preview.textContent = 'Generate results to see your card preview.';
    currentEmbedMarkup = '';
    els.embedCode.textContent = 'Run the generator to view the HTML snippet.';
    return;
  }

  const palette = palettes[paletteKey] || palettes.sunrise;
  const topRegions = latestRaces.slice(0, 4);
  const dominant = topRegions[0];
  const otherLabel = topRegions
    .slice(1, 3)
    .map(region => region.label)
    .join(' • ');

  const taglineValue = els.taglineInput ? els.taglineInput.value : 'Every branch tells a story.';
  const ctaValue = els.ctaInput ? els.ctaInput.value : 'Create yours at Race Calculator';
  const tagline = taglineValue.trim() || 'Every branch tells a story.';
  const ctaLabel = ctaValue.trim() || 'Create yours at Race Calculator';
  const originUrl = window.location.origin || window.location.href;

  const cardMarkup = `
    <div class="race-story-card" style="
      width: 100%;
      max-width: 460px;
      border-radius: 32px;
      padding: 28px;
      background: ${palette.gradient};
      color: ${palette.text};
      font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
      box-shadow: 0 25px 65px rgba(15, 23, 42, 0.25);
    ">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <p style="margin:0; text-transform:uppercase; letter-spacing:0.2em; font-size:11px; font-weight:600; color:${palette.badge};">HERITAGE SNAPSHOT</p>
          <h3 style="margin:6px 0 0; font-size:26px; line-height:1.2; font-weight:800;">
            ${(dominant && dominant.label) || 'Heritage'} ${
              dominant ? `${dominant.percent.toFixed(1)}%` : ''
            }
          </h3>
          <p style="margin:4px 0 0; font-size:14px; opacity:0.85;">${otherLabel}</p>
        </div>
        <div style="
          width:82px;
          height:82px;
          border-radius:50%;
          background:rgba(255,255,255,0.35);
          display:flex;
          align-items:center;
          justify-content:center;
          font-weight:800;
          font-size:24px;">
          ${dominant ? `${Math.round(dominant.percent)}%` : '--'}
        </div>
      </div>
      <p style="margin:18px 0; font-size:15px; font-weight:500; opacity:0.9;">${tagline}</p>
      <div>
        ${topRegions
          .map(
            region => `
            <div style="margin-bottom:10px;">
              <div style="display:flex; justify-content:space-between; font-weight:600; font-size:13px;">
                <span>${region.label}</span>
                <span>${region.percent.toFixed(1)}%</span>
              </div>
              <div style="height:8px; border-radius:999px; background:${palette.accentMuted}; overflow:hidden; margin-top:4px;">
                <div style="height:100%; width:${Math.min(region.percent, 100)}%; background:${palette.accent};"></div>
              </div>
            </div>`
          )
          .join('')}
      </div>
      <div style="text-align:center; margin-top:22px;">
        <a href="${originUrl}" target="_blank" rel="noopener"
          style="display:inline-flex; align-items:center; gap:8px; padding:12px 22px; border-radius:999px; text-decoration:none; font-weight:700; background:${palette.buttonBg}; color:${palette.buttonText}; box-shadow:0 8px 20px rgba(15, 23, 42, 0.25);">
          ${ctaLabel}
        </a>
      </div>
    </div>
  `;

  els.preview.innerHTML = cardMarkup;
  currentEmbedMarkup = wrapEmbedMarkup(cardMarkup);
  els.embedCode.textContent = currentEmbedMarkup.trim();

  if (announce) {
    updateStoryCardStatus('Preview refreshed with the latest inputs.', 'success');
  }
}

function wrapEmbedMarkup(cardMarkup) {
  return `
<div style="width:100%; display:flex; justify-content:center; padding:16px;">
  ${cardMarkup.trim()}
</div>`.trim();
}

function toggleControls(enabled) {
  [els.generateButton, els.downloadButton, els.copyButton].forEach(button => {
    if (button) button.disabled = !enabled;
  });
}

async function downloadStoryCard() {
  if (!latestRaces.length) return;
  if (typeof html2canvas !== 'function') {
    updateStoryCardStatus('html2canvas is not available. Unable to capture the card.', 'danger');
    return;
  }
  const card = els.preview ? els.preview.querySelector('.race-story-card') : null;
  if (!card) {
    updateStoryCardStatus('Generate the card before downloading.', 'danger');
    return;
  }
  try {
    const canvas = await html2canvas(card, {
      backgroundColor: null,
      useCORS: true,
      scale: window.devicePixelRatio || 2,
    });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png', 1.0);
    link.download = 'heritage-story-card.png';
    link.click();
    updateStoryCardStatus('Story card downloaded!', 'success');
  } catch (error) {
    updateStoryCardStatus('Failed to capture the card. Try again.', 'danger');
    console.error(error);
  }
}

async function copyEmbedMarkup() {
  if (!currentEmbedMarkup) {
    updateStoryCardStatus('Generate the card before copying.', 'danger');
    return;
  }
  try {
    await navigator.clipboard.writeText(currentEmbedMarkup);
    updateStoryCardStatus('Embed HTML copied to clipboard.', 'success');
  } catch (error) {
    updateStoryCardStatus('Clipboard access denied. Copy manually from the box.', 'warning');
    console.error(error);
  }
}

function updateStoryCardStatus(message, tone = 'idle') {
  if (!els.status) return;
  const classes = {
    idle: ['bg-gray-100', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-200'],
    success: ['bg-green-100', 'dark:bg-green-900/40', 'text-green-700', 'dark:text-green-300'],
    warning: ['bg-yellow-100', 'dark:bg-yellow-900/50', 'text-yellow-700', 'dark:text-yellow-200'],
    danger: ['bg-red-100', 'dark:bg-red-900/50', 'text-red-700', 'dark:text-red-200'],
  };
  Object.values(classes).forEach(cls => {
    cls.forEach(item => els.status.classList.remove(item));
  });
  (classes[tone] || classes.idle).forEach(item => els.status.classList.add(item));
  els.status.textContent = message;
}
