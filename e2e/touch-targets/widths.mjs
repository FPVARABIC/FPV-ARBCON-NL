const screens = [
  ['Setup', 'shell-setup', 'flight-instruments'],
  ['Motors', 'motors-preview', 'motor-slider-grid'],
  ['Ports', 'census:Ports', 'ports-card-20'],
  ['Gps', 'census:GPS', 'gps-configuration-panel'],
  ['Configurations', 'census:Configurations', 'configurations-craft-name'],
  ['Receiver', 'census:Receiver', 'receiver-channels-card'],
  ['PidTuning', 'census:PID', 'pid-tab'],
  ['Modes', 'census:Modes', 'modes-mode-0'],
  ['Failsafe', 'census:Failsafe', 'failsafe-delay'],
  ['PowerBattery', 'census:Power', 'power-cell-min'],
  ['Osd', 'census:OSD', 'osd-canvas'],
  ['VideoTransmitter', 'census:VTX', 'vtx-band-1'],
  ['LedStrip', 'census:LED', 'led-grid-canvas'],
  ['Sensors', 'census:Sensors', 'sensors-row-GYRO'],
  ['Blackbox', 'census:Blackbox', 'blackbox-settings'],
  ['Presets', 'census:Presets', 'presets-reload'],
  ['Cli', 'census:CLI', 'cli-command-input'],
];
const widths = [320, 390, 768, 1024, 1056, 1280, 1440, 1920, 2560];

const frame = document.querySelector('iframe');
const status = document.querySelector('#status');
const report = { cases: [], failures: [] };

async function measure(scene, workspace, anchor, width) {
  frame.width = String(width);
  const url = new URL('./index.html', location.href);
  url.searchParams.set('s', scene);
  const doc = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      frame.onload = null;
      reject(new Error('Het scherm is niet geladen.'));
    }, 12000);
    frame.onload = () => {
      clearTimeout(timeout);
      frame.onload = null;
      resolve(frame.contentDocument);
    };
    frame.src = url.href;
  });
  const nextFrame = () => new Promise(resolve => frame.contentWindow.requestAnimationFrame(resolve));
  const deadline = performance.now() + 8000;
  let view;
  while (performance.now() < deadline) {
    view = doc.querySelector('[data-workbench="' + workspace + '"]');
    if (view?.querySelector('[data-testid="' + anchor + '"]')?.getBoundingClientRect().height > 0) break;
    await nextFrame();
  }
  if (!(view?.querySelector('[data-testid="' + anchor + '"]')?.getBoundingClientRect().height > 0)) {
    throw new Error('Scherminhoud ontbreekt: ' + anchor);
  }
  await doc.fonts.ready;
  await nextFrame();
  await nextFrame();
  // React Native Web scrolls the workspace inside the page. The document can
  // fit while a field extends far beyond the edge of its own ScrollView.
  return {
    documentWidth: doc.documentElement.clientWidth,
    documentOverflow: doc.documentElement.scrollWidth - doc.documentElement.clientWidth,
    viewport: view.clientWidth,
    scrollWidth: view.scrollWidth,
    contentWidth: Math.round(view.firstElementChild.getBoundingClientRect().width),
  };
}

for (const width of widths) {
  for (const [workspace, scene, anchor] of screens) {
    status.textContent = workspace + ' · ' + width + ' px';
    try {
      const row = { workspace, width, ...await measure(scene, workspace, anchor, width) };
      report.cases.push(row);
      if (frame.clientWidth !== width || row.viewport <= 0 || row.documentOverflow > 1 ||
          row.scrollWidth - row.viewport > 1 || Math.abs(row.contentWidth - row.viewport) > 1) {
        report.failures.push(row);
      }
    } catch (error) {
      report.failures.push({ workspace, width, error: String(error) });
    }
  }
}
const expected = screens.length * widths.length;
status.dataset.outcome = report.cases.length === expected && report.failures.length === 0 ? 'PASS' : 'FAIL';
status.textContent = status.dataset.outcome + ' · ' + report.cases.length + '/' + expected +
  ' gemeten · ' + report.failures.length + ' afwijkingen';
document.querySelector('#results').textContent = JSON.stringify(report, null, 2);
