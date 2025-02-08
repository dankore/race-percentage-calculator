export function setupAnalytics() {
  // Google Analytics setup
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    dataLayer.push(arguments);
  };
  gtag('js', new Date());
  gtag('config', 'G-YDGB4Z1HWK');

  // Load Google Analytics script
  const gaScript = document.createElement('script');
  gaScript.async = true;
  gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-YDGB4Z1HWK';
  document.head.appendChild(gaScript);

  // Web Vitals setup
  let script = document.createElement('script');
  script.src = 'https://unpkg.com/web-vitals@4/dist/web-vitals.iife.js';
  script.onload = function () {
    webVitals.onCLS(sendToGoogleAnalytics);
    webVitals.onINP(sendToGoogleAnalytics);
    webVitals.onLCP(sendToGoogleAnalytics);
  };
  document.head.appendChild(script);
}

function sendToGoogleAnalytics({ name, delta, id }) {
  if (window.gtag) {
    console.log(`Metric: ${name}, Delta: ${delta}, ID: ${id}`); // Debugging line
    gtag('event', name, {
      event_category: 'Web Vitals',
      event_label: id, // ID of the metric (e.g., CLS, INP, etc.)
      value: Math.round(name === 'CLS' ? delta * 1000 : delta), // Values must be integers
      non_interaction: true, // Prevents affecting bounce rate
    });
  } else {
    console.warn('gtag is not defined. Google Analytics may not be loaded.');
  }
}
