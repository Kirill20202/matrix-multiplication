# Matrix Multiplication

A complete matrix operations toolkit with both Python CLI and web frontend implementations.

## Features

### Python CLI (`main.py`)
- **Matrix multiplication** with strict validation
- **Input validation** for rectangular matrices of numbers
- **JSON input support** via command line arguments
- **Demo mode** with built-in example matrices
- **Type safety** with comprehensive error handling

### Web Frontend (`index.html`, `styles.css`, `app.js`)
- **Interactive matrix calculator** with modern UI
- **Multiple operations**: multiplication, addition, subtraction
- **Flexible input formats**:
  - Space/newline separated values (e.g., `1 2 3\n4 5 6`)
  - JSON arrays (e.g., `[[1,2,3],[4,5,6]]`)
- **Mobile-optimized** responsive design
- **Dual output format**: grid display + JSON for copy-paste

## Quick Start

### Python CLI
```bash
# Run demo
python main.py

# Multiply custom matrices
python main.py "[[1,2,3],[4,5,6]]" "[[7,8],[9,10],[11,12]]"

# Using JSON files
python main.py "$(cat left.json)" "$(cat right.json)"
```

### Web Interface
1. Open `index.html` in your browser
2. Enter matrices in either format:
   - **Whitespace**: `1 2 3` (newline) `4 5 6`
   - **JSON**: `[[1,2,3],[4,5,6]]`
3. Choose operation: Multiply, Add, or Subtract
4. View results in both grid and JSON formats

## File Structure

```
matrix-multiplication/
├── main.py              # Python CLI implementation
├── index.html           # Web interface
├── styles.css           # Responsive styling
├── app.js              # Client-side matrix operations
├── left.json           # Example left matrix
├── right.json          # Example right matrix
└── README.md           # This file
```

## Matrix Operations

### Multiplication (A × B)
- **Requirement**: `A.columns == B.rows`
- **Result**: `A.rows × B.columns` matrix
- **Algorithm**: Optimized triple-loop with zero-skipping

### Addition (A + B)
- **Requirement**: `A.shape == B.shape`
- **Result**: Element-wise sum

### Subtraction (A - B)
- **Requirement**: `A.shape == B.shape`
- **Result**: Element-wise difference

## Input Validation

- **Numbers only**: Accepts integers and floats (rejects booleans)
- **Rectangular matrices**: All rows must have same length
- **Non-empty**: Matrices must have at least one row and column
- **Clear error messages** for invalid inputs

## Browser Compatibility

- Modern browsers with ES6+ support
- Mobile-optimized with touch-friendly controls
- Responsive design for all screen sizes

## Dependencies

- **Python**: No external dependencies (pure Python 3.6+)
- **Web**: No external libraries (vanilla HTML/CSS/JS)

## Examples

### Python CLI
```bash
$ python main.py
58 64
139 154

$ python main.py "[[1,2],[3,4]]" "[[5,6],[7,8]]"
19 22
43 50
```

### Web Interface
Input matrices:
```
1 2 3
4 5 6
7 8 9 
```
and
```
10 11 12
13 14 15
16 17 18
```

Result:
```
58 64
139 154

[[84, 90, 96],
[201, 216, 231],
[318, 342, 366]]
```
