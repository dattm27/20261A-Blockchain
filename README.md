# Blockchain Coursework

This repository contains programming projects and exercises for the 20261A
Blockchain course.

## Project Structure

```text
.
├── proj1/
│   ├── prover.py                 # Generates Merkle inclusion proofs
│   ├── verifier.py               # Verifies generated proofs
│   ├── merkle_utils.py           # Shared hashing and proof utilities
│   ├── proof-for-leaf-95.txt     # Example proof
│   └── proj1.pdf                 # Project instructions
├── .gitignore
└── README.md
```

Currently, the repository contains only Project 1, which implements Merkle tree
inclusion proofs in Python.

## Requirements

- Python 3
- No third-party packages are required

## Running Project 1

```bash
cd proj1
python3 prover.py 683
python3 verifier.py 683
```
