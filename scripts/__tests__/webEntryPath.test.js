const { findEntryChunk } = require('../scan-web-bundle');

const chunk = { name: 'index-abc.js', text: 'main' };
const html = src => '<script defer src="/helper.js"></script><script type="module" crossorigin src="' + src + '"></script>';

test.each([
  ['/', '/assets/index-abc.js'],
  ['/FPV-ARBCON-NL/', '/FPV-ARBCON-NL/assets/index-abc.js'],
  ['./', './assets/index-abc.js'],
])('scans the module served from %s', (base, src) => {
  expect(findEntryChunk([chunk], html(src), base)).toBe(chunk);
});

test('detects an entry that would 404 on the project Pages site', () => {
  expect(() => findEntryChunk([chunk], html('/assets/index-abc.js'), '/FPV-ARBCON-NL/'))
    .toThrow('outside the published assets directory');
});
