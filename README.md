# Sracle - Simple Oracle

Just for educational purposes.

A simple Ethereum oracle. Uses javascript encapsulation of contracts, currently
through web3 1.0 beta.

Requirements: node, web3, running testrpc.

Running: not yet:-)

Testing: 

1. Start private Ethereum network. `testrpc` does not suffice since it currently
does not support websockets. E.g. setting up `parity` is simple: single 
executable is available for download and development chain is a question of
command line arguments: `/path/to/parity --config dev --gasprice 0 --unlock 0x00a329c0648769a73afac7f9381e08fb43dbea72 --password test/pwd`
(in the root directory)
2. `mocha` or `npm test`
