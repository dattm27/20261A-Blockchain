from bitcoin import SelectParams
from bitcoin.core import CMutableTransaction, x
from bitcoin.core.script import CScript, SignatureHash, SIGHASH_ALL
from bitcoin.core.scripteval import VerifyScript, SCRIPT_VERIFY_P2SH

from bitcoin.wallet import CBitcoinSecret, P2PKHBitcoinAddress

from lib.config import (my_private_key, my_public_key, my_address,
    alice_secret_key_BTC, alice_public_key_BTC, alice_address_BTC,
    bob_secret_key_BTC, bob_public_key_BTC, bob_address_BTC,
    alice_secret_key_BCY, alice_public_key_BCY, alice_address_BCY,
    bob_secret_key_BCY, bob_public_key_BCY, bob_address_BCY,
    faucet_address, network_type)

from lib.utils import create_txin, create_txout, broadcast_transaction



def split_coins(amount_to_send, txid_to_spend, utxo_index, n, network):
    txin_scriptPubKey = address.to_scriptPubKey()
    txin = create_txin(txid_to_spend, utxo_index)
    txout_scriptPubKey = address.to_scriptPubKey()
    txout = create_txout(amount_to_send / n, txout_scriptPubKey)
    tx = CMutableTransaction([txin], [txout]*n)
    sighash = SignatureHash(txin_scriptPubKey, tx,
                            0, SIGHASH_ALL)
    txin.scriptSig = CScript([private_key.sign(sighash) + bytes([SIGHASH_ALL]),
                              public_key])
    VerifyScript(txin.scriptSig, txin_scriptPubKey,
                 tx, 0, (SCRIPT_VERIFY_P2SH,))
    response = broadcast_transaction(tx, network)
    print(response.status_code, response.reason)
    print(response.text)

if __name__ == '__main__':
    SelectParams('testnet')

    ######################################################################
    # Split the confirmed faucet UTXO into four equal outputs. Three outputs
    # are used by Q1, Q2, and Q3; the fourth is kept as a spare.
    private_key = my_private_key
    public_key = private_key.pub
    address = P2PKHBitcoinAddress.from_pubkey(public_key)

    amount_to_send = 0.00114 # 114,000 sats; the remaining 10,455 sats are the fee
    txid_to_spend = (
        'edbb7cdc2dce7604bf0ef26ec57d372d7d093956134e083312ea9d914c8509a9')
    utxo_index = 1 # index of the output you are spending, indices start at 0
    n = 4 # four outputs of 28,500 sats each
    # For n, choose a number larger than what you immediately need,
    # in case you make mistakes.
    ######################################################################

    split_coins(amount_to_send, txid_to_spend, utxo_index, n, network_type)
