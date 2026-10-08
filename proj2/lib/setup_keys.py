"""Generate local-only keys for the Project 2 test networks."""

from os import chmod, urandom
from pathlib import Path

from bitcoin import SelectParams
from bitcoin.base58 import CBase58Data
from bitcoin.core import Hash160
from bitcoin.wallet import CBitcoinSecret, P2PKHBitcoinAddress


SelectParams("testnet")
OUTPUT = Path(__file__).with_name("config_secrets.py")


def new_key():
    secret_bytes = urandom(32)
    return secret_bytes, CBitcoinSecret.from_secret_bytes(secret_bytes)


def bcy_address(public_key):
    return CBase58Data.from_bytes(Hash160(public_key), 0x1B)


def main():
    if OUTPUT.exists():
        raise SystemExit(
            f"{OUTPUT.name} already exists; refusing to overwrite existing keys."
        )

    my_bytes, my_key = new_key()
    alice_btc_bytes, alice_btc_key = new_key()
    bob_btc_bytes, bob_btc_key = new_key()
    alice_bcy_bytes, alice_bcy_key = new_key()
    bob_bcy_bytes, bob_bcy_key = new_key()

    contents = (
        "# Generated locally by setup_keys.py. Do not commit this file.\n"
        f'MY_PRIVATE_KEY_WIF = "{my_key}"\n'
        f'ALICE_PRIVATE_KEY_BTC_WIF = "{alice_btc_key}"\n'
        f'BOB_PRIVATE_KEY_BTC_WIF = "{bob_btc_key}"\n'
        f'ALICE_PRIVATE_KEY_BCY_HEX = "{alice_bcy_bytes.hex()}"\n'
        f'BOB_PRIVATE_KEY_BCY_HEX = "{bob_bcy_bytes.hex()}"\n'
    )
    OUTPUT.write_text(contents, encoding="utf-8")
    chmod(OUTPUT, 0o600)

    print(
        "Your BTC Testnet3 address:",
        P2PKHBitcoinAddress.from_pubkey(my_key.pub),
    )
    print(
        "Alice BTC Testnet3 address:",
        P2PKHBitcoinAddress.from_pubkey(alice_btc_key.pub),
    )
    print(
        "Bob BTC Testnet3 address:",
        P2PKHBitcoinAddress.from_pubkey(bob_btc_key.pub),
    )
    print("Alice BCY testnet faucet address:", bcy_address(alice_bcy_key.pub))
    print("Bob BCY testnet faucet address:", bcy_address(bob_bcy_key.pub))


if __name__ == "__main__":
    main()
