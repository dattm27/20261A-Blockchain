from sys import exit
from bitcoin.core.script import *

from lib.utils import *
from lib.config import (my_private_key, my_public_key, my_address,
                    faucet_address, network_type)
from Q1 import P2PKH_scriptPubKey
from Q2a import (Q2a_txout_scriptPubKey, Q2a_redeemScript,
                 Q2a_p2sh_scriptPubKey, SUID_FIRST_HALF,
                 SUID_SECOND_HALF)


assert (SUID_FIRST_HALF + SUID_SECOND_HALF) % 2 == 0
x = (SUID_FIRST_HALF + SUID_SECOND_HALF) // 2
y = (SUID_FIRST_HALF - SUID_SECOND_HALF) // 2

txin_scriptSig = [
    x,
    y,
]


if __name__ == '__main__':
    ######################################################################
    amount_to_send = 0.000085 # 8,500 sats; 10,000-sat fee
    txid_to_spend = (
            '63d7378d33a9bda2df3c45f168af3e97a8fee842bb5dddcd51253ed2c27751b9')
    utxo_index = 0 # index of the output you are spending, indices start at 0
    ######################################################################

    txin_scriptPubKey = Q2a_p2sh_scriptPubKey
    p2sh_txin_scriptSig = [x, y, Q2a_redeemScript]
    txout_scriptPubKey = P2PKH_scriptPubKey(faucet_address)

    response = send_from_custom_transaction(
        amount_to_send, txid_to_spend, utxo_index,
        txin_scriptPubKey, p2sh_txin_scriptSig,
        txout_scriptPubKey, network_type)
    print(response.status_code, response.reason)
    print(response.text)
