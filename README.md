# coinrates-informer

Node.js app informing clients about cryptocurrency exchange rates.

> This project uses [Feathers](http://feathersjs.com), - an open source web framework for building modern real-time applications.

## Getting Started

Getting up and running is easy.
1. Make sure you have [NodeJS](https://nodejs.org/) and [Yarn](https://yarnpkg.com) installed.
2. Install your dependencies

    ```
    cd path/to/api
    yarn install
    ```
3. Create API key at [CryptoCompare](https://www.cryptocompare.com). Place it as `cryptocompare.apikey` in `config/default.json`.

4. Start your app to get it running at http://localhost:3000

    ```
    yarn start
    ```
5. Connect by [Socket.io](https://socket.io/) to `ws://localhost:3000`. Emit `handshake` event with `userId` property in passed data.

6. Send PATCH request to REST API endpoint with userId in  query to receive exchange rates as socket message:

    ```
    PATCH http://localhost:3030/connections/?userId=someUser
    Content-Type: application/json

    {
      "command": { "name": "coinrates" }
    }
    ```

## Automatic testing

Pass steps 1-3 from "Getting started".

Run `yarn test` for running all tests and exit.

    yarn test


## Semi-automatic testing

Pass steps 1-3 from "Getting started".

Run `yarn test-noexit` to keep server and socket alive.

Send `PATCH` requests to `http://localhost:3030/connections/?userId=someUser` to get updates by socket connection (as in `test/services/coinrates.rest` file):


    ### sending updated rates to user connections
    PATCH http://localhost:3030/connections/?userId=someUser
    Content-Type: application/json

    {
      "command": { "name": "coinrates" }
    }

