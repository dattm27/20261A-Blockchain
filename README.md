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
├── proj2/
│   ├── Q1.py ... Q4.py           # Bitcoin Script exercises
│   ├── alice.py, bob.py, swap.py # Atomic swap simulation
│   ├── lib/                       # Keys, configuration, and utilities
│   ├── docs/                      # Transaction IDs and design notes
│   └── tests/                     # Offline script tests
├── .gitignore
└── README.md
```

Project 1 implements Merkle tree inclusion proofs. Project 2 builds and verifies
Bitcoin transactions and a cross-chain atomic swap with `python-bitcoinlib`.

## Requirements

- Python 3
- Project 1 has no third-party dependencies
- Project 2 dependencies are listed in `proj2/requirements.txt`

## Running Project 1

```bash
cd proj1
python3 prover.py 683
python3 verifier.py 683
```

## Testing Project 2

```bash
cd proj2
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m lib.setup_keys  # only on a fresh clone; creates ignored local keys
python -m unittest discover -s tests -v
```
