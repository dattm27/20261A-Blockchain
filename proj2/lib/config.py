from bitcoin import SelectParams
from bitcoin.base58 import decode
from bitcoin.core import x
from bitcoin.wallet import CBitcoinAddress, CBitcoinSecret, P2PKHBitcoinAddress

try:
    from lib.config_secrets import (
        MY_PRIVATE_KEY_WIF,
        ALICE_PRIVATE_KEY_BTC_WIF,
        BOB_PRIVATE_KEY_BTC_WIF,
        ALICE_PRIVATE_KEY_BCY_HEX,
        BOB_PRIVATE_KEY_BCY_HEX,
    )
except ImportError as exc:
    raise RuntimeError(
        "Missing lib/config_secrets.py. Run: python3 lib/setup_keys.py"
    ) from exc


SelectParams('testnet')

faucet_address = CBitcoinAddress('mohjSavDdQYHRYXcS3uS6ttaHP8amyvX78')

# For questions 1-3, we are using 'btc-test3' network. For question 4, you will
# set this to be either 'btc-test3' or 'bcy-test'
network_type = 'btc-test3'


######################################################################
# This section is for Questions 1-3
# The private key is loaded from the gitignored config_secrets.py file.
# Create the local key file with lib/setup_keys.py.
# Send coins at https://testnet-faucet.mempool.co/

my_private_key = CBitcoinSecret(MY_PRIVATE_KEY_WIF)

my_public_key = my_private_key.pub
my_address = P2PKHBitcoinAddress.from_pubkey(my_public_key)
######################################################################


######################################################################
# NOTE: This section is for Question 4
# BTC testnet keys are loaded from the local secret file.
# Send coins at https://testnet-faucet.mempool.co/

# Only to be imported by alice.py
# Alice should have coins!!
alice_secret_key_BTC = CBitcoinSecret(ALICE_PRIVATE_KEY_BTC_WIF)

# Only to be imported by bob.py
bob_secret_key_BTC = CBitcoinSecret(BOB_PRIVATE_KEY_BTC_WIF)

# Can be imported by alice.py or bob.py
alice_public_key_BTC = alice_secret_key_BTC.pub
alice_address_BTC = P2PKHBitcoinAddress.from_pubkey(alice_public_key_BTC)

bob_public_key_BTC = bob_secret_key_BTC.pub
bob_address_BTC = P2PKHBitcoinAddress.from_pubkey(bob_public_key_BTC)
######################################################################


######################################################################
# NOTE: This section is for Question 4
# BCY testnet keys are generated locally and stored as hex secrets.
#
# Send coins with
# curl -d '{"address": "BCY_ADDRESS", "amount": 1000000}' https://api.blockcypher.com/v1/bcy/test/faucet?token=YOURTOKEN
# This request will return a transaction reference. Make sure to save this.

# Only to be imported by alice.py
alice_secret_key_BCY = CBitcoinSecret.from_secret_bytes(
    x(ALICE_PRIVATE_KEY_BCY_HEX))

# Only to be imported by bob.py
# Bob should have coins!!
bob_secret_key_BCY = CBitcoinSecret.from_secret_bytes(
    x(BOB_PRIVATE_KEY_BCY_HEX))

# Can be imported by alice.py or bob.py
alice_public_key_BCY = alice_secret_key_BCY.pub
alice_address_BCY = P2PKHBitcoinAddress.from_pubkey(alice_public_key_BCY)

bob_public_key_BCY = bob_secret_key_BCY.pub
bob_address_BCY = P2PKHBitcoinAddress.from_pubkey(bob_public_key_BCY)
######################################################################
