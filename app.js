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

/**
 * Update the output display with the given text
 * @param {string} text - Text to display in the output area
 */
function setOutput(text) {
  document.getElementById('output').textContent = text;
}

/**
 * Format a matrix as a clean array with each row on a new line
 * @param {Matrix} matrix - Matrix to format
 * @returns {string} Formatted matrix string
 */
function pretty(matrix) {
  const rows = matrix.map(row => 
    '[' + row.map(x => formatNumber(x)).join(', ') + ']'
  );
  return '[' + rows.join(',\n') + ']';
}

/**
 * Format a number with controlled precision to avoid floating point artifacts
 * @param {number} n - Number to format
 * @returns {string} Formatted number string
 */
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

/**
 * Fill the input areas with demo matrices in whitespace format
 */
function fillDemo() {
  // Fill with a whitespace-formatted example
  document.getElementById('leftMatrix').value = '1 2 3\n4 5 6\n7 8 9 ';
  document.getElementById('rightMatrix').value = '10 11 12\n13 14 15\n16 17 18';
  setOutput('');
}

/**
 * Clear all input areas and output
 */
function clearAll() {
  document.getElementById('leftMatrix').value = '';
  document.getElementById('rightMatrix').value = '';
  setOutput('');
}

/**
 * Handle matrix multiplication button click
 * Parses input matrices and displays the result
 */
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

/** Ensure matrices have identical shape for element-wise operations */
function assertSameShape(a, b, opName) {
  if (a.length !== b.length || a[0].length !== b[0].length) {
    throw new Error(`${opName} requires same shape: A is ${a.length}x${a[0].length}, B is ${b.length}x${b[0].length}`);
  }
}

/** @param {Matrix} a @param {Matrix} b */
function add(a, b) {
  assertSameShape(a, b, 'Addition');
  const rows = a.length, cols = a[0].length;
  const out = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      out[i][j] = a[i][j] + b[i][j];
    }
  }
  return out;
}

/** @param {Matrix} a @param {Matrix} b */
function subtract(a, b) {
  assertSameShape(a, b, 'Subtraction');
  const rows = a.length, cols = a[0].length;
  const out = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      out[i][j] = a[i][j] - b[i][j];
    }
  }
  return out;
}

/**
 * Handle matrix addition button click
 * Parses input matrices and displays the element-wise sum
 */
function onAdd() {
  try {
    const aRaw = document.getElementById('leftMatrix').value.trim();
    const bRaw = document.getElementById('rightMatrix').value.trim();
    if (!aRaw || !bRaw) throw new Error('Please provide both matrices.');
    const a = parseFlexibleMatrix(aRaw, 'left');
    const b = parseFlexibleMatrix(bRaw, 'right');
    const c = add(a, b);
    const grid = formatWhitespaceMatrix(c);
    const json = pretty(c);
    setOutput(`${grid}\n\n${json}`);
  } catch (err) {
    setOutput(`Error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Handle matrix subtraction button click
 * Parses input matrices and displays the element-wise difference
 */
function onSubtract() {
  try {
    const aRaw = document.getElementById('leftMatrix').value.trim();
    const bRaw = document.getElementById('rightMatrix').value.trim();
    if (!aRaw || !bRaw) throw new Error('Please provide both matrices.');
    const a = parseFlexibleMatrix(aRaw, 'left');
    const b = parseFlexibleMatrix(bRaw, 'right');
    const c = subtract(a, b);
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
  document.getElementById('add').addEventListener('click', onAdd);
  document.getElementById('subtract').addEventListener('click', onSubtract);
});
