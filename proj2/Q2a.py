from sys import exit
from bitcoin.core.script import *

from lib.utils import *
from lib.config import (my_private_key, my_public_key, my_address,
                    faucet_address, network_type)
from Q1 import send_from_P2PKH_transaction


# Numeric part of MSSV 20252607M, split into two equal halves.
SUID_FIRST_HALF = 2025
SUID_SECOND_HALF = 2607


Q2a_txout_scriptPubKey = [
    OP_2DUP,
    OP_ADD,
    SUID_FIRST_HALF,
    OP_EQUALVERIFY,
    OP_SUB,
    SUID_SECOND_HALF,
    OP_EQUAL,
]

# Modern Testnet3 nodes no longer relay arbitrary bare scriptPubKeys by
# default. Keep the exercise script above as the redeem script and publish a
# standard P2SH output for the live transaction.
Q2a_redeemScript = CScript(Q2a_txout_scriptPubKey)
Q2a_p2sh_scriptPubKey = Q2a_redeemScript.to_p2sh_scriptPubKey()

if __name__ == '__main__':
    ######################################################################
    amount_to_send = 0.000185 # 18,500 sats; 10,000-sat fee
    txid_to_spend = (
        '92d1ca0bb6d944207655bd1ef30916f986c97db4dd22ce5493fd1249fc05b412')
    utxo_index = 1 # index of the output you are spending, indices start at 0
    ######################################################################

    response = send_from_P2PKH_transaction(
        amount_to_send, txid_to_spend, utxo_index,
        Q2a_p2sh_scriptPubKey, my_private_key, network_type)
    print(response.status_code, response.reason)
    print(response.text)
