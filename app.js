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
    // If right operand is a single scalar number, do scalar multiplication A * s
    const maybeScalar = parseScalarIfSingleToken(bRaw);
    const c = (maybeScalar !== null)
      ? scalarMultiply(a, maybeScalar)
      : multiply(a, parseFlexibleMatrix(bRaw, 'right'));
    const grid = formatWhitespaceMatrix(c);
    const json = pretty(c);
    setOutput(`${grid}\n\n${json}`);
  } catch (err) {
    setOutput(`Error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * If the provided text is a single numeric token (e.g. "2", "-3.5", "1e-3"),
 * return its Number value; otherwise return null.
 * @param {string} text
 * @returns {number|null}
 */
function parseScalarIfSingleToken(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  // Must be a single line/token containing a valid JS number representation
  const singleToken = /^[-+]?((\d+\.?\d*)|(\.\d+))([eE][-+]?\d+)?$/;
  if (!singleToken.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/**
 * Multiply every element of matrix by a scalar value
 * @param {Matrix} m
 * @param {number} s
 * @returns {Matrix}
 */
function scalarMultiply(m, s) {
  const rows = m.length, cols = m[0].length;
  const out = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      out[i][j] = m[i][j] * s;
    }
  }
  return out;
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
 * Calculate the determinant of a square matrix using LU decomposition
 * @param {Matrix} matrix - Square matrix
 * @returns {number} Determinant value
 */
function determinant(matrix) {
  if (matrix.length !== matrix[0].length) {
    throw new Error('Determinant requires a square matrix');
  }
  const n = matrix.length;
  if (n === 1) return matrix[0][0];
  if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  
  // LU decomposition for larger matrices
  const lu = [...matrix.map(row => [...row])];
  let det = 1;
  let sign = 1;
  
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(lu[k][i]) > Math.abs(lu[maxRow][i])) {
        maxRow = k;
      }
    }
    
    // Swap rows if needed
    if (maxRow !== i) {
      [lu[i], lu[maxRow]] = [lu[maxRow], lu[i]];
      sign *= -1;
    }
    
    // Check for singular matrix
    if (Math.abs(lu[i][i]) < 1e-10) return 0;
    
    // Gaussian elimination
    for (let k = i + 1; k < n; k++) {
      const factor = lu[k][i] / lu[i][i];
      for (let j = i; j < n; j++) {
        lu[k][j] -= factor * lu[i][j];
      }
    }
  }
  
  // Calculate determinant from diagonal
  for (let i = 0; i < n; i++) {
    det *= lu[i][i];
  }
  
  return sign * det;
}

/**
 * Calculate the rank of a matrix using Gaussian elimination
 * @param {Matrix} matrix - Input matrix
 * @returns {number} Matrix rank
 */
function matrixRank(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rank = Math.min(rows, cols);
  
  // Create a copy for row operations
  const mat = matrix.map(row => [...row]);
  
  let rankCount = 0;
  
  for (let col = 0; col < cols && rankCount < rows; col++) {
    // Find pivot
    let pivotRow = -1;
    for (let row = rankCount; row < rows; row++) {
      if (Math.abs(mat[row][col]) > 1e-10) {
        pivotRow = row;
        break;
      }
    }
    
    if (pivotRow === -1) continue; // No pivot in this column
    
    // Swap rows
    if (pivotRow !== rankCount) {
      [mat[rankCount], mat[pivotRow]] = [mat[pivotRow], mat[rankCount]];
    }
    
    // Eliminate column
    const pivot = mat[rankCount][col];
    for (let row = rankCount + 1; row < rows; row++) {
      const factor = mat[row][col] / pivot;
      for (let c = col; c < cols; c++) {
        mat[row][c] -= factor * mat[rankCount][c];
      }
    }
    
    rankCount++;
  }
  
  return rankCount;
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

/**
 * Handle determinant calculation button click
 * Calculates determinant of the left matrix
 */
function onDeterminant() {
  try {
    const aRaw = document.getElementById('leftMatrix').value.trim();
    if (!aRaw) throw new Error('Please provide a matrix.');
    const a = parseFlexibleMatrix(aRaw, 'left');
    const det = determinant(a);
    setOutput(`Determinant = ${formatNumber(det)}`);
  } catch (err) {
    setOutput(`Error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Handle matrix rank calculation button click
 * Calculates rank of the left matrix
 */
function onRank() {
  try {
    const aRaw = document.getElementById('leftMatrix').value.trim();
    if (!aRaw) throw new Error('Please provide a matrix.');
    const a = parseFlexibleMatrix(aRaw, 'left');
    const rank = matrixRank(a);
    setOutput(`Rank = ${rank}`);
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
  document.getElementById('determinant').addEventListener('click', onDeterminant);
  document.getElementById('rank').addEventListener('click', onRank);
});
