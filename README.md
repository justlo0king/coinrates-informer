# api

> Feathers.js backend app informing users about cryptocurrency rates.

## About

This project uses [Feathers](http://feathersjs.com), - an open source web framework for building modern real-time applications.
Most of the logic is located in `src/modules` folder.

## Getting Started

Getting up and running is as easy.

1. Make sure you have [NodeJS](https://nodejs.org/) and [Yarn](https://yarnpkg.com) installed.
2. Install your dependencies

    ```
    cd path/to/api
    yarn install
    ```

3. Start your app to get it running at http://localhost:3000

    ```
    yarn start
    ```
4. Connect by [Socket.io](https://socket.io/) to `ws://localhost:3000`. Emit `handshake` event with `userId` property in passed data.

5. Send PATCH request to REST API endpoint with userId in  query to receive exchange rates as socket message:

    ```
    PATCH http://localhost:3030/connections/?userId=someUser
    Content-Type: application/json

    {
      "command": { "name": "coinrates" }
    }
    ```

## Automatic testing

Run `yarn test` for running all tests and exit.

    yarn test


## Semi-automatic testing
Run `yarn test-noexit` to keep server and socket alive. Send `PATCH` requests to `http://localhost:3030/connections/?userId=someUser` to get updates by socket connection (as in `test/services/coinrates.rest` file):


    PATCH http://localhost:3030/connections/?userId=someUser
    Content-Type: application/json

    {
      "command": { "name": "coinrates" }
    }


## Scaffolding

Feathers has a powerful command line interface. Here are a few things it can do:

```
$ npm install -g @feathersjs/cli          # Install Feathers CLI

$ feathers generate service               # Generate a new Service
$ feathers generate hook                  # Generate a new Hook
$ feathers help                           # Show all commands
```

## Help

For more information on all the things you can do with Feathers visit [docs.feathersjs.com](http://docs.feathersjs.com).
