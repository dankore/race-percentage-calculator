const ADSENSE_CLIENT = 'ca-pub-7174503033473057';
const GA_ID = 'G-YDGB4Z1HWK';
const INTERACTION_EVENTS = ['scroll', 'pointerdown', 'pointermove', 'keydown', 'touchstart'];

// Ads and analytics wait for the first interaction so they never delay the first paint.
export function setupAnalytics() {
  let loaded = false;
  const load = () => {
    if (loaded) return;
    loaded = true;
    INTERACTION_EVENTS.forEach(name => window.removeEventListener(name, load));
    loadAnalytics();
    loadAds();
  };
  INTERACTION_EVENTS.forEach(name => window.addEventListener(name, load, { passive: true }));
}

function loadScript(src, attrs = {}) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    Object.entries(attrs).forEach(([key, value]) => script.setAttribute(key, value));
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function loadAnalytics() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`).catch(() => {});
  loadScript('https://unpkg.com/web-vitals@4/dist/web-vitals.iife.js')
    .then(() => {
      window.webVitals.onCLS(sendToGoogleAnalytics);
      window.webVitals.onINP(sendToGoogleAnalytics);
      window.webVitals.onLCP(sendToGoogleAnalytics);
    })
    .catch(() => {});
}

function loadAds() {
  window.adsbygoogle = window.adsbygoogle || [];
  loadScript(`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`, {
    crossorigin: 'anonymous',
  }).catch(() => {});

  // Manual units fill as they approach the viewport.
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        try {
          window.adsbygoogle.push({});
        } catch (error) {
          // AdSense throws if a slot is already filled; nothing to recover.
        }
      });
    },
    { rootMargin: '200px 0px' },
  );
  document.querySelectorAll('ins.adsbygoogle').forEach(ad => observer.observe(ad));
}

function sendToGoogleAnalytics({ name, delta, id }) {
  window.gtag('event', name, {
    event_category: 'Web Vitals',
    event_label: id,
    value: Math.round(name === 'CLS' ? delta * 1000 : delta),
    non_interaction: true,
  });
}
