import sys
import types
import unittest

from bitcoin import SelectParams
from bitcoin.core import Hash160
from bitcoin.core.script import OP_0
from bitcoin.wallet import CBitcoinSecret, P2PKHBitcoinAddress


SelectParams("testnet")


def secret(byte_value):
    return CBitcoinSecret.from_secret_bytes(bytes([byte_value]) * 32)


bank_private_key = secret(10)
bank_public_key = bank_private_key.pub
bank_address = P2PKHBitcoinAddress.from_pubkey(bank_public_key)

config = types.ModuleType("lib.config")
config.my_private_key = bank_private_key
config.my_public_key = bank_public_key
config.my_address = bank_address
config.faucet_address = P2PKHBitcoinAddress.from_pubkey(secret(11).pub)
config.network_type = "btc-test3"
config.alice_secret_key_BTC = secret(40)
config.bob_secret_key_BTC = secret(41)
config.alice_public_key_BTC = config.alice_secret_key_BTC.pub
config.bob_public_key_BTC = config.bob_secret_key_BTC.pub
config.alice_address_BTC = P2PKHBitcoinAddress.from_pubkey(
    config.alice_public_key_BTC
)
config.bob_address_BTC = P2PKHBitcoinAddress.from_pubkey(config.bob_public_key_BTC)
config.alice_secret_key_BCY = secret(42)
config.bob_secret_key_BCY = secret(43)
config.alice_public_key_BCY = config.alice_secret_key_BCY.pub
config.bob_public_key_BCY = config.bob_secret_key_BCY.pub
config.alice_address_BCY = P2PKHBitcoinAddress.from_pubkey(
    config.alice_public_key_BCY
)
config.bob_address_BCY = P2PKHBitcoinAddress.from_pubkey(config.bob_public_key_BCY)
sys.modules["lib.config"] = config

from Q1 import P2PKH_scriptPubKey, P2PKH_scriptSig
from Q2a import Q2a_txout_scriptPubKey
from Q2b import txin_scriptSig as Q2b_txin_scriptSig
from Q3a import (
    Q3a_txout_scriptPubKey,
    cust1_private_key,
    cust2_private_key,
    cust3_private_key,
)
from Q4 import coinExchangeScript, coinExchangeScriptSig1, coinExchangeScriptSig2
import Q4
from lib.utils import (
    create_OP_CHECKSIG_signature,
    create_signed_transaction,
    create_txin,
    create_txout,
)


Q4.alice_txid_to_spend = "03" * 32
Q4.alice_utxo_index = 0
Q4.alice_amount_to_send = 0.01
Q4.bob_txid_to_spend = "04" * 32
Q4.bob_utxo_index = 0
Q4.bob_amount_to_send = 0.01

import swap


class BitcoinScriptTests(unittest.TestCase):
    def setUp(self):
        self.txin = create_txin("01" * 32, 0)
        self.txout = create_txout(
            0.001,
            P2PKH_scriptPubKey(config.faucet_address),
        )

    def test_p2pkh(self):
        script_pub_key = P2PKH_scriptPubKey(bank_address)
        script_sig = P2PKH_scriptSig(
            self.txin,
            self.txout,
            script_pub_key,
            bank_private_key,
            bank_public_key,
        )
        create_signed_transaction(
            self.txin,
            self.txout,
            script_pub_key,
            script_sig,
        )

    def test_bank_and_any_customer_multisig(self):
        for customer_private_key in (
            cust1_private_key,
            cust2_private_key,
            cust3_private_key,
        ):
            with self.subTest(customer=customer_private_key.pub.hex()):
                txin = create_txin("02" * 32, 0)
                bank_sig = create_OP_CHECKSIG_signature(
                    txin,
                    self.txout,
                    Q3a_txout_scriptPubKey,
                    bank_private_key,
                )
                customer_sig = create_OP_CHECKSIG_signature(
                    txin,
                    self.txout,
                    Q3a_txout_scriptPubKey,
                    customer_private_key,
                )
                create_signed_transaction(
                    txin,
                    self.txout,
                    Q3a_txout_scriptPubKey,
                    [OP_0, customer_sig, bank_sig],
                )

    def test_suid_equation_script(self):
        create_signed_transaction(
            self.txin,
            self.txout,
            Q2a_txout_scriptPubKey,
            Q2b_txin_scriptSig,
        )

    def test_atomic_swap_secret_path(self):
        sender = secret(20)
        recipient = secret(21)
        secret_value = b"atomic swap test secret"
        script_pub_key = coinExchangeScript(
            sender.pub,
            recipient.pub,
            Hash160(secret_value),
        )
        recipient_sig = create_OP_CHECKSIG_signature(
            self.txin,
            self.txout,
            script_pub_key,
            recipient,
        )
        create_signed_transaction(
            self.txin,
            self.txout,
            script_pub_key,
            coinExchangeScriptSig1(recipient_sig, secret_value),
        )

    def test_atomic_swap_cooperative_path(self):
        sender = secret(30)
        recipient = secret(31)
        script_pub_key = coinExchangeScript(
            sender.pub,
            recipient.pub,
            Hash160(b"unused in cooperative path"),
        )
        sender_sig = create_OP_CHECKSIG_signature(
            self.txin,
            self.txout,
            script_pub_key,
            sender,
        )
        recipient_sig = create_OP_CHECKSIG_signature(
            self.txin,
            self.txout,
            script_pub_key,
            recipient,
        )
        create_signed_transaction(
            self.txin,
            self.txout,
            script_pub_key,
            coinExchangeScriptSig2(sender_sig, recipient_sig),
        )

    def test_complete_atomic_swap_redeem_path(self):
        swap.atomic_swap(broadcast_transactions=False, alice_redeems=True)

    def test_complete_atomic_swap_refund_path(self):
        swap.atomic_swap(broadcast_transactions=False, alice_redeems=False)


if __name__ == "__main__":
    unittest.main()
