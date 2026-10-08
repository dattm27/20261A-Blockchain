from bitcoin.core.script import *

######################################################################
# These functions will be used by Alice and Bob to send their respective
# coins to a utxo that is redeemable either of two cases:
# 1) Recipient provides x such that hash(x) = hash of secret
#    and recipient signs the transaction.
# 2) Sender and recipient both sign transaction
#
# The following scripts implement both redemption conditions.
# See this page for opcode documentation: https://en.bitcoin.it/wiki/Script

# This is the ScriptPubKey for the swap transaction
def coinExchangeScript(public_key_sender, public_key_recipient, hash_of_secret):
    return [
        OP_IF,
            OP_HASH160,
            hash_of_secret,
            OP_EQUALVERIFY,
            public_key_recipient,
            OP_CHECKSIG,
        OP_ELSE,
            OP_2,
            public_key_sender,
            public_key_recipient,
            OP_2,
            OP_CHECKMULTISIG,
        OP_ENDIF,
    ]

# This is the ScriptSig that the receiver will use to redeem coins
def coinExchangeScriptSig1(sig_recipient, secret):
    return [
        sig_recipient,
        secret,
        OP_TRUE,
    ]

# This is the ScriptSig for sending coins back to the sender if unredeemed
def coinExchangeScriptSig2(sig_sender, sig_recipient):
    return [
        OP_0,
        sig_sender,
        sig_recipient,
        OP_FALSE,
    ]
######################################################################

######################################################################
#
# Configured for your addresses
#
# Alice's confirmed BTC Testnet3 faucet output (147,062 sats).
alice_txid_to_spend     = "39558a2fac273827a324d3aef436e48c52c7c044a700922ded0562b869f3c37c"
alice_utxo_index        = 0
alice_amount_to_send    = 0.00147062

# Bob's confirmed BCY faucet output (100,000 sats).
bob_txid_to_spend       = "93a326bb31ede4185916515819bdcf5a091eed61eeeedb7073ecfde1c196547e"
bob_utxo_index          = 0
bob_amount_to_send      = 0.001

# Get current block height (for locktime) in 'height' parameter for each blockchain (will be used in swap.py):
#  curl https://api.blockcypher.com/v1/btc/test3
btc_test3_chain_height  = 5157298

#  curl https://api.blockcypher.com/v1/bcy/test
bcy_test_chain_height   = 2584412

# Parameter for how long Alice/Bob should have to wait before they can take back their coins
# alice_locktime MUST be > bob_locktime
alice_locktime = 5
bob_locktime = 3

tx_fee = 0.0001

# While testing your code, you can edit these variables to see if your
# transaction can be broadcasted succesfully.
broadcast_transactions = False
alice_redeems = False

######################################################################
