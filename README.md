[![Build Status](https://travis-ci.org/comodoro/sracle.svg?branch=master)](https://travis-ci.org/comodoro/sracle)

Sracle - Simple Oracle
----------------------
Just for educational purposes.

A simple Ethereum oracle. Uses javascript encapsulation of contracts, currently
through `web3 1.0 beta`.

Requirements: node, web3, `geth` or `parity`

Running: not yet:-)

Testing: 

A private Ethereum network is needed. `testrpc` does not suffice since it
currently does not support websockets and therefore filters in `web3 1.0`. 

###Using Geth

- Start local Geth development chain with Websockets support:
`geth --dev --nodiscover --maxpeers 0 --ws --wsorigins="*"`
- Run tests with `npm test`
###Using Parity

The `parity` client has support for private development chain, but the development account is not unlocked by default, as the tests expect for simplicity.  

- Run Parity in dev mode and exit it just to create the developer account. This step has to be done only once.
- Run `parity --config dev --gasprice 0 --unlock 0x00a329c0648769a73afac7f9381e08fb43dbea72 --password test/pwd`
(in the root directory or change the path to the `test/pwd` file).
- Run tests with `npm test`

The commands look like this:

  - `timeout 2s  parity --config dev`
  - `parity --mode offline --config dev --gasprice 0 --unlock 0x00a329c0648769a73afac7f9381e08fb43dbea72 --password test/pwd`
