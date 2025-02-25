export function setupAnalytics() {
  // Google Analytics setup
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    dataLayer.push(arguments);
  };

  // Load Google Analytics script if not already present
  if (
    !document.querySelector('script[src*="www.googletagmanager.com/gtag/js"]')
  ) {
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-YDGB4Z1HWK';
    gaScript.onload = function () {
      console.log('Google Analytics script loaded successfully');
      gtag('js', new Date());
      gtag('config', 'G-YDGB4Z1HWK');
    };
    document.head.appendChild(gaScript);
  } else {
    console.warn('Google Analytics script already exists.');
  }

  // Load Web Vitals script if not already present
  if (!document.querySelector('script[src*="web-vitals"]')) {
    const webVitalsScript = document.createElement('script');
    webVitalsScript.src =
      'https://unpkg.com/web-vitals@4/dist/web-vitals.iife.js';
    webVitalsScript.async = true;
    webVitalsScript.onload = function () {
      console.log('Web Vitals script loaded successfully');
      if (window.webVitals) {
        webVitals.onCLS(sendToGoogleAnalytics);
        webVitals.onINP(sendToGoogleAnalytics);
        webVitals.onLCP(sendToGoogleAnalytics);
      } else {
        console.error('Web Vitals library failed to load.');
      }
    };
    document.head.appendChild(webVitalsScript);
  } else {
    console.warn('Web Vitals script already exists.');
  }

  // Load Google Ads script if not already present
  if (
    !document.querySelector(
      'script[src*="pagead2.googlesyndication.com/pagead/js"]'
    )
  ) {
    const adsScript = document.createElement('script');
    adsScript.async = true;
    adsScript.src =
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7174503033473057';
    adsScript.crossOrigin = 'anonymous';
    adsScript.onload = function () {
      console.log('Google Ads script loaded successfully');
      initializeGoogleAds();
    };
    document.head.appendChild(adsScript);
  } else {
    console.warn('Google Ads script already exists.');
  }
}

// Function to push Google Ads (lazy loading)
function initializeGoogleAds() {
  const adUnits = document.querySelectorAll('.adsbygoogle');
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          try {
            (adsbygoogle = window.adsbygoogle || []).push({});
            console.log('Ad loaded:', entry.target);
          } catch (e) {
            console.error('Ad loading error:', e);
          }
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '100px 0px' }
  );

  adUnits.forEach(ad => observer.observe(ad));
}

function sendToGoogleAnalytics({ name, delta, id }) {
  if (typeof window.gtag === 'function') {
    console.log(`Metric: ${name}, Delta: ${delta}, ID: ${id}`); // Debugging
    gtag('event', name, {
      event_category: 'Web Vitals',
      event_label: id, // Unique ID for each metric
      value: Math.round(name === 'CLS' ? delta * 1000 : delta), // Convert CLS to milliseconds
      non_interaction: true, // Ensures it doesn’t impact bounce rate
    });
  } else {
    console.warn('gtag is not defined. Google Analytics may not be loaded.');
  }
}
