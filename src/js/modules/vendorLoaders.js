// Heavy libraries load on demand so they never block the first paint.
let chartPromise;
let html2canvasPromise;

export function loadChart() {
  chartPromise =
    chartPromise ||
    import(/* webpackChunkName: "chart" */ 'chart.js/auto').then(module => {
      window.Chart = module.default;
      return module.default;
    });
  return chartPromise;
}

export function loadHtml2canvas() {
  html2canvasPromise =
    html2canvasPromise ||
    import(/* webpackChunkName: "html2canvas" */ 'html2canvas').then(module => {
      window.html2canvas = module.default;
      return module.default;
    });
  return html2canvasPromise;
}

export function isChart(value) {
  return Boolean(window.Chart) && value instanceof window.Chart;
}
