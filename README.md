# Blockchain Coursework

This repository contains programming projects and exercises for the 20261A
Blockchain course.

- [Homework 1 - complete explained solution](hw1/README.md)

## Course Materials

Lộ trình sử dụng bài giảng và bài tập của
[Stanford CS251 - Cryptocurrencies and Blockchain Technologies (Fall 2023)](https://securitylab.github.io/cs251-fall23/).
Ngày học bên dưới là lịch của lớp 20261A; hạn nộp ghi trong tài liệu Stanford
không phải hạn nộp của lớp.

| Bài | Ngày | Chủ đề | Bài giảng | Bài tập / dự án |
| --- | --- | --- | --- | --- |
| 1 | 17/9 | Intro to cryptography \& cryptocurrencies | [PDF](https://cs251.stanford.edu/lectures/lecture1.pdf) · [PPTX](https://cs251.stanford.edu/lectures/lecture1.pptx) | Project 1 — Merkle trees in Python: [instructions](https://securitylab.github.io/cs251-fall23/hw/proj1.pdf) · [starter code](https://securitylab.github.io/cs251-fall23/hw/proj1.zip) |
| 2 | 18/9 | Bitcoin nuts and bolts | [PDF](https://cs251.stanford.edu/lectures/lecture2.pdf) · [PPTX](https://cs251.stanford.edu/lectures/lecture2.pptx) | Homework 1: [instructions](https://securitylab.github.io/cs251-fall23/hw/hw1.pdf) · [lời giải trong repository](hw1/README.md) |
| 3 | 1/10 | Wallets: managing and protecting crypto assets | [PDF](https://cs251.stanford.edu/lectures/lecture3.pdf) · [PPTX](https://cs251.stanford.edu/lectures/lecture3.pptx) | Project 2 — Bitcoin transactions with `python-bitcoinlib`: [instructions](https://securitylab.github.io/cs251-fall23/hw/proj2.pdf) · [starter code](https://securitylab.github.io/cs251-fall23/hw/proj2.zip) |
| 4 | 14/10 | Ethereum: DApps, EVM and the Ethereum blockchain | [PDF](https://cs251.stanford.edu/lectures/lecture7.pdf) · [PPTX](https://cs251.stanford.edu/lectures/lecture7.pptx) | — |
| 5 | 16/10 | Programming in Solidity | [PDF](https://cs251.stanford.edu/lectures/lecture8.pdf) · [PPTX](https://cs251.stanford.edu/lectures/lecture8.pptx) | Project 3 — An Ethereum payment app: [instructions](https://securitylab.github.io/cs251-fall23/hw/proj3.pdf) · [starter code](https://securitylab.github.io/cs251-fall23/hw/proj3.zip) |
| 6 | 28/10 | Stablecoins and lending protocols | [PDF](https://cs251.stanford.edu/lectures/lecture9.pdf) · [PPTX](https://cs251.stanford.edu/lectures/lecture9.pptx) | — |
| 7 | Tự học | Decentralized exchanges | [PDF](https://cs251.stanford.edu/lectures/lecture10.pdf) · [PPTX](https://cs251.stanford.edu/lectures/lecture10.pptx) | Homework 3: [instructions](https://securitylab.github.io/cs251-fall23/hw/hw3.pdf). Project 4 — Building a DEX: [instructions](https://securitylab.github.io/cs251-fall23/hw/proj4.pdf) · [starter code](https://securitylab.github.io/cs251-fall23/hw/proj4.zip) |
| 8 | Tự học | Maximal Extractable Value (MEV) | [PDF](https://cs251.stanford.edu/lectures/lecture11.pdf) · [PPTX](https://cs251.stanford.edu/lectures/lecture11.pptx) | — |

### Mạch kiến thức

1. **Nền tảng mật mã:** hàm băm, chữ ký số, proof of work và Merkle tree.
2. **Bitcoin:** giao dịch, UTXO, Bitcoin Script, ví và quản lý khóa.
3. **Ethereum:** tài khoản, EVM, DApp và smart contract bằng Solidity.
4. **DeFi:** stablecoin, lending, automated market maker và DEX.
5. **Cơ chế thị trường:** thứ tự giao dịch, front-running và MEV.

Tài liệu chi tiết cũng được lưu tại [COURSE_MATERIALS.md](COURSE_MATERIALS.md).

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
├── hw1/
│   ├── README.md                  # Explained solutions for Homework 1
│   └── homework1.tex              # LaTeX source for the submission PDF
├── output/pdf/
│   └── Homework1_Nhom12.pdf       # Compiled Homework 1 submission
├── COURSE_MATERIALS.md            # Lecture, homework, and project links
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
