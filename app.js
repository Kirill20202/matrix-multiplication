/* Client-side matrix multiply with validation */

/** @typedef {(number)[][]} Matrix */

/**
 * @param {unknown} value
 * @param {string} name
 * @returns {Matrix}
 */
function validateMatrix(value, name) {
  if (!Array.isArray(value)) throw new Error(`${name} must be an array of arrays of numbers`);
  const rows = value.map((row) => {
    if (!Array.isArray(row)) throw new Error(`${name} must be an array of arrays of numbers`);
    if (row.length === 0) throw new Error(`${name} rows must be non-empty`);
    return row.map((x) => {
      if (typeof x !== 'number' || Number.isNaN(x)) throw new Error(`${name} must contain only numbers`);
      return x;
    });
  });
  if (rows.length === 0) throw new Error(`${name} must have at least one row`);
  const width = rows[0].length;
  for (const r of rows) if (r.length !== width) throw new Error(`${name} must be rectangular`);
  return rows;
}

/** Parse whitespace/tab/newline separated matrix like:
 *  1 2 3\n4 5 6
 * Accepts multiple spaces/tabs, ignores blank lines.
 * @param {string} text
 * @param {string} name
 * @returns {Matrix}
 */
function parseWhitespaceMatrix(text, name) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) throw new Error(`${name} must have at least one row`);
  /** @type {number[][]} */
  const rows = lines.map((line) => {
    const parts = line.split(/\s+/).filter(Boolean);
    if (parts.length === 0) throw new Error(`${name} rows must be non-empty`);
    const nums = parts.map((p) => {
      const n = Number(p);
      if (!Number.isFinite(n)) throw new Error(`${name} must contain only numbers`);
      return n;
    });
    return nums;
  });
  const w = rows[0].length;
  for (const r of rows) if (r.length !== w) throw new Error(`${name} must be rectangular`);
  return rows;
}

/** Try JSON first; if that fails, try whitespace matrix parsing. */
function parseFlexibleMatrix(text, name) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error(`Please provide ${name} matrix.`);
  // Heuristic: if it looks like JSON array, try JSON first
  const looksJson = /^[\[\{]/.test(trimmed);
  if (looksJson) {
    try {
      const value = JSON.parse(trimmed);
      return validateMatrix(value, name);
    } catch (e) {
      // fall through to whitespace parsing
    }
  }
  // Whitespace parsing (also works even if user included brackets sparsely)
  try {
    return parseWhitespaceMatrix(trimmed, name);
  } catch (wsErr) {
    // If it didn't look like JSON, also try JSON as a fallback
    if (!looksJson) {
      try {
        const value = JSON.parse(trimmed);
        return validateMatrix(value, name);
      } catch (_) {
        // ignore
      }
    }
    throw wsErr;
  }
}

/**
 * @param {Matrix} a
 * @param {Matrix} b
 * @returns {Matrix}
 */
function multiply(a, b) {
  const aRows = a.length, aCols = a[0].length;
  const bRows = b.length, bCols = b[0].length;
  if (aCols !== bRows) throw new Error(`Incompatible shapes: left is ${aRows}x${aCols}, right is ${bRows}x${bCols}`);
  const result = Array.from({ length: aRows }, () => Array(bCols).fill(0));
  for (let i = 0; i < aRows; i++) {
    for (let k = 0; k < aCols; k++) {
      const aik = a[i][k];
      if (aik === 0) continue;
      const row = result[i];
      const bRow = b[k];
      for (let j = 0; j < bCols; j++) row[j] += aik * bRow[j];
    }
  }
  return result;
}

function setOutput(text) {
  document.getElementById('output').textContent = text;
}

function pretty(obj) {
  return JSON.stringify(obj, (_, v) => (typeof v === 'number' && Number.isFinite(v) ? Number(v.toPrecision(12)) : v), 2);
}

function formatNumber(n) {
  return String(Number(n.toPrecision(12)));
}

/**
 * Render matrix as lines with space-separated values (whitespace grid)
 * @param {Matrix} m
 */
function formatWhitespaceMatrix(m) {
  return m.map((row) => row.map((x) => formatNumber(x)).join(' ')).join('\n');
}

function fillDemo() {
  // Fill with a whitespace-formatted example
  document.getElementById('leftMatrix').value = '1 2 3\n4 5 6';
  document.getElementById('rightMatrix').value = '7 8\n9 10\n11 12';
  setOutput('');
}

function clearAll() {
  document.getElementById('leftMatrix').value = '';
  document.getElementById('rightMatrix').value = '';
  setOutput('');
}

function onMultiply() {
  try {
    const aRaw = document.getElementById('leftMatrix').value.trim();
    const bRaw = document.getElementById('rightMatrix').value.trim();
    if (!aRaw || !bRaw) throw new Error('Please provide both matrices.');
    const a = parseFlexibleMatrix(aRaw, 'left');
    const b = parseFlexibleMatrix(bRaw, 'right');
    const c = multiply(a, b);
    const grid = formatWhitespaceMatrix(c);
    const json = pretty(c);
    setOutput(`${grid}\n\n${json}`);
  } catch (err) {
    setOutput(`Error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('fillDemo').addEventListener('click', fillDemo);
  document.getElementById('clearAll').addEventListener('click', clearAll);
  document.getElementById('multiply').addEventListener('click', onMultiply);
});
