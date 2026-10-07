import test from 'node:test';
import assert from 'node:assert/strict';
import { maskedIdentifier, networkDisplayName, submittedTimeEat } from '../src/components/agent/agentPresentation.js';
import { AGENT_DARK, AGENT_LIGHT, isBoxyAgentDevice } from '../src/components/agent/agentTheme.js';

test('account summaries mask identifiers without inventing missing account data', () => {
  assert.equal(maskedIdentifier('+255700000142'), '•••• 0142');
  assert.equal(maskedIdentifier('TILL-00826'), '•••• 0826');
  for (const value of [null, undefined, '', 'Unavailable']) {
    assert.equal(maskedIdentifier(value), 'Unavailable');
  }
});

test('provider display names leave unknown canonical values intact', () => {
  assert.equal(networkDisplayName('Voda'), 'M-Pesa');
  assert.equal(networkDisplayName('airtel'), 'Airtel Money');
  assert.equal(networkDisplayName('yas'), 'Mixx by Yas');
  assert.equal(networkDisplayName('halotel'), 'HaloPesa');
  assert.equal(networkDisplayName('future-provider'), 'future-provider');
});

test('Tanzanian submission dates cross midnight/year correctly and label unavailable timestamps', () => {
  assert.match(submittedTimeEat('2026-12-31T22:30:00Z'), /1 Jan 2027.*01:30.*EAT/);
  assert.match(submittedTimeEat('2026-07-01T12:05:00Z'), /15:05.*EAT/);
  assert.equal(submittedTimeEat('not-a-date'), 'Time unavailable');
  assert.equal(submittedTimeEat(null, 'sw'), 'Muda haupatikani');
});

test('older Intl runtimes retain the same explicit EAT offset', () => {
  const formatter = Intl.DateTimeFormat;
  try {
    Intl.DateTimeFormat = function () { throw new RangeError('Timezone database unavailable'); };
    assert.equal(submittedTimeEat('2026-12-31T22:30:00Z'), '1 Jan 2027, 01:30 EAT');
  } finally {
    Intl.DateTimeFormat = formatter;
  }
});

test('small body text meets AA contrast in both agent themes', () => {
  const luminance = hex => {
    const rgb = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const contrast = (first, second) => {
    const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
  };
  for (const theme of [AGENT_DARK, AGENT_LIGHT]) {
    for (const ink of ['text', 'secondary', 'muted', 'danger']) {
      assert.ok(contrast(theme[ink], theme.bg) >= 4.5, `${ink} must be readable on the page`);
    }
    assert.ok(contrast(theme.actionText, theme.action) >= 4.5);
  }
});

test('S22 silhouette detection never treats every Android as a boxy phone', () => {
  assert.equal(isBoxyAgentDevice('SM-S908B'), true);
  assert.equal(isBoxyAgentDevice('Samsung Galaxy S22 Ultra'), true);
  assert.equal(isBoxyAgentDevice('Pixel 7 Pro'), false);
  assert.equal(isBoxyAgentDevice('iPhone15,3'), false);
  assert.equal(isBoxyAgentDevice(undefined), false);
});
