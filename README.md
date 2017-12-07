[![Build Status](https://travis-ci.org/comodoro/sracle.svg?branch=master)](https://travis-ci.org/comodoro/sracle)

# Sracle - Simple Oracle

Just for educational purposes.

A simple Ethereum oracle. Uses javascript encapsulation of contracts, currently
through web3 1.0 beta.

Requirements: node, web3, running testrpc.

Running: not yet:-)

Testing: 

1. Start private Ethereum network. `testrpc` does not suffice since it currently
does not support websockets. Setting up `parity` development chain is however quite simple: 

- Download recent `Parity` and run and exit it once to create the developer account. This account
is used in the tests. This step has to be done only once.
- Run `/path/to/parity --config dev --gasprice 0 --unlock 0x00a329c0648769a73afac7f9381e08fb43dbea72 --password test/pwd` (in the root directory or change the path to the `test/pwd` file).
- Run tests with `npm test`

The commands look like this:

  - `wget -P /tmp https://parity-downloads-mirror.parity.io/v1.8.3/x86_64-unknown-linux-gnu/parity`
  - `chmod a+x /tmp/parity`
  - `timeout 2s  /tmp/parity --config dev`
  - `/tmp/parity --mode offline --config dev --gasprice 0 --unlock 0x00a329c0648769a73afac7f9381e08fb43dbea72 --password test/pwd`
