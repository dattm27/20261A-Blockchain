from sys import exit
from bitcoin.core.script import *

from lib.utils import *
from lib.config import (my_private_key, my_public_key, my_address,
                    faucet_address, network_type)
from Q1 import P2PKH_scriptPubKey
from Q3a import (Q3a_txout_scriptPubKey, Q3a_redeemScript,
                 Q3a_p2sh_scriptPubKey, cust1_private_key,
                 cust2_private_key, cust3_private_key)


def multisig_scriptSig(txin, txout, txin_scriptPubKey):
    bank_sig = create_OP_CHECKSIG_signature(txin, txout, txin_scriptPubKey,
                                             my_private_key)
    cust1_sig = create_OP_CHECKSIG_signature(txin, txout, txin_scriptPubKey,
                                             cust1_private_key)
    cust2_sig = create_OP_CHECKSIG_signature(txin, txout, txin_scriptPubKey,
                                             cust2_private_key)
    cust3_sig = create_OP_CHECKSIG_signature(txin, txout, txin_scriptPubKey,
                                             cust3_private_key)
    ######################################################################
    # Unlock with the bank and one customer signature. OP_CHECKMULTISIG
    # consumes the leading OP_0 because of its historical extra-pop behavior.
    return [
        OP_0,
        cust1_sig,
        bank_sig,
    ]
    ######################################################################


def send_from_multisig_transaction(amount_to_send, txid_to_spend, utxo_index,
                                   txin_scriptPubKey, txout_scriptPubKey, network,
                                   redeem_script=None):
    txout = create_txout(amount_to_send, txout_scriptPubKey)

    txin = create_txin(txid_to_spend, utxo_index)
    signing_script = redeem_script or txin_scriptPubKey
    txin_scriptSig = multisig_scriptSig(txin, txout, signing_script)
    if redeem_script is not None:
        txin_scriptSig.append(redeem_script)

    new_tx = create_signed_transaction(txin, txout, txin_scriptPubKey,
                                       txin_scriptSig)

    return broadcast_transaction(new_tx, network)

if __name__ == '__main__':
    ######################################################################
    amount_to_send = 0.000085 # 8,500 sats; 10,000-sat fee
    txid_to_spend = (
        'f239b24270ed5a08abac40d849a9b34d9fa35c2a171238c2736640a18dd9a76e')
    utxo_index = 0 # index of the output you are spending, indices start at 0
    ######################################################################

    txin_scriptPubKey = Q3a_p2sh_scriptPubKey
    txout_scriptPubKey = P2PKH_scriptPubKey(faucet_address)

    response = send_from_multisig_transaction(
        amount_to_send, txid_to_spend, utxo_index,
        txin_scriptPubKey, txout_scriptPubKey, network_type,
        redeem_script=Q3a_redeemScript)
    print(response.status_code, response.reason)
    print(response.text)
