import sys
import json
from typing import List, Sequence, Union

# Small, self-contained matrix multiplication utility with a simple CLI.
#
# Design goals:
# - Strict input validation with clear error messages
# - Works with both ints and floats (but not bool)
# - No third-party dependencies; pure Python


# Alias for numeric elements that a matrix can contain.
Number = Union[int, float]


def _validate_matrix(matrix: Sequence[Sequence[Number]], name: str) -> List[List[Number]]:
    """Validate that input is a non-empty, rectangular matrix of numbers.

    Returns a defensive copy as list of lists.
    """
    # Top-level container must be a sequence (but not bytes/str which are also Sequences)
    if not isinstance(matrix, Sequence) or isinstance(matrix, (bytes, str)):
        raise TypeError(f"{name} must be a sequence of sequences of numbers")

    rows: List[List[Number]] = []
    # Validate each row and coerce elements to numbers via _ensure_number
    for row in matrix:
        if not isinstance(row, Sequence) or isinstance(row, (bytes, str)):
            raise TypeError(f"{name} must be a sequence of sequences of numbers")
        rows.append([_ensure_number(x, name) for x in row])

    # Must have at least one row and no empty rows
    if len(rows) == 0:
        raise ValueError(f"{name} must have at least one row")
    row_lengths = {len(r) for r in rows}
    if 0 in row_lengths:
        raise ValueError(f"{name} rows must be non-empty")
    # Rectangular means all rows the same length
    if len(row_lengths) != 1:
        raise ValueError(f"{name} must be rectangular (all rows same length)")
    return rows


def _ensure_number(value: object, name: str) -> Number:
    # Accept ints and floats, but explicitly reject bool (since bool is a subclass of int)
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return value
    raise TypeError(f"{name} must contain only numbers (int or float)")


def multiply_matrices(left: Sequence[Sequence[Number]], right: Sequence[Sequence[Number]]) -> List[List[Number]]:
    """Compute the matrix product left × right.

    - Validates shapes and contents
    - Works with ints and floats
    - Returns a new list of lists
    """
    # Validate inputs and produce defensive copies
    a = _validate_matrix(left, "left")
    b = _validate_matrix(right, "right")

    # Extract shapes
    a_rows = len(a)
    a_cols = len(a[0])
    b_rows = len(b)
    b_cols = len(b[0])

    # Shape requirement for multiplication: inner dimensions must match
    if a_cols != b_rows:
        raise ValueError(
            f"Incompatible shapes for multiplication: left is {a_rows}x{a_cols}, right is {b_rows}x{b_cols}"
        )

    # Initialize result matrix with zeros (a_rows × b_cols)
    result: List[List[Number]] = [[0 for _ in range(b_cols)] for _ in range(a_rows)]

    # Classic triple-nested loop with a small optimization:
    # - Skip computations when the current element of 'a' is zero.
    # - Cache references to avoid repeated attribute lookups inside inner loop.
    # Time complexity: O(a_rows * a_cols * b_cols)
    for i in range(a_rows):
        for k in range(a_cols):
            aik = a[i][k]
            if aik == 0:
                continue
            row_i = result[i]
            b_k = b[k]
            for j in range(b_cols):
                row_i[j] += aik * b_k[j]

    return result


def _print_matrix(matrix: Sequence[Sequence[Number]]) -> None:
    # Pretty-print a numeric matrix with compact formatting (no trailing zeros where possible)
    for row in matrix:
        print(" ".join(f"{val:g}" for val in row))


def _load_matrix_from_json_arg(arg: str, name: str) -> List[List[Number]]:
    # Parse a JSON string into a matrix, then validate its structure and contents.
    try:
        value = json.loads(arg)
    except json.JSONDecodeError as exc:
        # Exit with a friendly message if JSON is malformed
        raise SystemExit(f"Failed to parse {name} as JSON: {exc}")
    try:
        return _validate_matrix(value, name)
    except (TypeError, ValueError) as exc:
        # Exit with the validation error message
        raise SystemExit(str(exc))


def main(argv: List[str]) -> int:
    """CLI usage:
    - No args: run a small demo
    - With two args: interpret them as JSON matrices, e.g.
      python main.py "[[1,2,3],[4,5,6]]" "[[7,8],[9,10],[11,12]]"
    """
    # No arguments: run the built-in demonstration
    if len(argv) == 1:
        a = [[1, 2, 3], [4, 5, 6]]
        b = [[7, 8], [9, 10], [11, 12]]
        c = multiply_matrices(a, b)
        _print_matrix(c)
        return 0
    # Two arguments: treat them as JSON-encoded matrices
    if len(argv) == 3:
        a = _load_matrix_from_json_arg(argv[1], "left")
        b = _load_matrix_from_json_arg(argv[2], "right")
        c = multiply_matrices(a, b)
        _print_matrix(c)
        return 0

    # Otherwise, print usage and exit with error code
    print("Usage:")
    print("  python main.py                          # demo")
    print("  python main.py '<A_json>' '<B_json>'    # multiply A×B")
    return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))


