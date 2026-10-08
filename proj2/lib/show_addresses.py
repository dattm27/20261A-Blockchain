"""Print public Project 2 addresses without exposing private keys."""

from bitcoin.base58 import CBase58Data
from bitcoin.core import Hash160

from lib.config import (
    my_address,
    alice_address_BTC,
    bob_address_BTC,
    alice_public_key_BCY,
    bob_public_key_BCY,
)


def bcy_address(public_key):
    return CBase58Data.from_bytes(Hash160(public_key), 0x1B)


print("Your BTC Testnet3 address:", my_address)
print("Alice BTC Testnet3 address:", alice_address_BTC)
print("Bob BTC Testnet3 address:", bob_address_BTC)
print("Alice BCY testnet faucet address:", bcy_address(alice_public_key_BCY))
print("Bob BCY testnet faucet address:", bcy_address(bob_public_key_BCY))
