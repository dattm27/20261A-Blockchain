from sys import exit
from bitcoin.core.script import *
from bitcoin.wallet import CBitcoinSecret

from lib.utils import *
from lib.config import (my_private_key, my_public_key, my_address,
                    faucet_address, network_type)
from Q1 import send_from_P2PKH_transaction


cust1_private_key = CBitcoinSecret(
    'cMceqPhHedrhbcR9eXgzmfWy7kRqLyAxMYwFT6ABDWsiwUp9Nsq9')
cust1_public_key = cust1_private_key.pub
cust2_private_key = CBitcoinSecret(
    'cMec2DGaTXkYJYfi7x3ZGjRXkeqmAvYAoWzMAcWj5fdLaqudWsNi')
cust2_public_key = cust2_private_key.pub
cust3_private_key = CBitcoinSecret(
    'cMgZD2qsGReP1UvGbNQ7moL6PZFgzsuPFV3St8sGwpNxED4hqkEM')
cust3_public_key = cust3_private_key.pub


######################################################################
# Exercise 3 locking script.

# You can assume the role of the bank for the purposes of this problem
# and use my_public_key and my_private_key in lieu of bank_public_key and
# bank_private_key.

Q3a_txout_scriptPubKey = [
        my_public_key,
        OP_CHECKSIGVERIFY,
        OP_1,
        cust1_public_key,
        cust2_public_key,
        cust3_public_key,
        OP_3,
        OP_CHECKMULTISIG,
]
Q3a_redeemScript = CScript(Q3a_txout_scriptPubKey)
Q3a_p2sh_scriptPubKey = Q3a_redeemScript.to_p2sh_scriptPubKey()
######################################################################

if __name__ == '__main__':
    ######################################################################
    amount_to_send = 0.000185 # 18,500 sats; 10,000-sat fee
    txid_to_spend = (
        '92d1ca0bb6d944207655bd1ef30916f986c97db4dd22ce5493fd1249fc05b412')
    utxo_index = 2 # index of the output you are spending, indices start at 0
    ######################################################################

    response = send_from_P2PKH_transaction(amount_to_send, txid_to_spend,
        utxo_index, Q3a_p2sh_scriptPubKey, my_private_key, network_type)
    print(response.status_code, response.reason)
    print(response.text)
