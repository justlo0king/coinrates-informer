import axios from 'axios';


/**
 * creates and returns method to request exchange rates
 * @param {*} app - feathers app
 * @returns requester function(params, callback) {}, where
 *   @params      - object with coin and [currencies] strings
 *   @callback    - method to call with result when done or failed,
 *     @result    - object passed to @callback with "error" message or rates by key like "USD", "EUR"
 */
export default function coinrate_requester(app) {
  const { apiKey } = app.get('cryptocompare') || {};
  // URI sample
  // https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD,JPY,EUR
  const instance = axios.create({
    baseURL: 'https://min-api.cryptocompare.com',
    timeout: 5000,
    headers: {
      'authorization': `Apikey ${apiKey}`
    }
  });

  return function(params, callback) {
    callback = typeof callback == 'function' ? callback : function() {};
    try {
      if (!params || typeof params !== 'object') {
        app.error('coinrate_requester: params is not an object');
        return callback('Parameters error');
      }

      const {
        coin, currencies='USD,EUR,'
      } = params || {};

      if (!apiKey) {
        app.error('coinrate_requester: apiKey not cryptocompare config');
        return callback('Configuration error');
      }

      app.debug('coinrate_requester: coin: ' + coin);

      if (!coin || typeof coin !== 'string') {
        app.error('coinrate_requester: coin string not in params: ', coin);
        return callback('Coin parameter error');
      }

      return instance.get(`/data/price?fsym=${String(coin).toUpperCase()}&tsyms=${currencies}'`).then((requestResponse) => {
        const { data:responseData } = requestResponse || {};
        const { Response:response, Message:message } = responseData || {};
        app.debug('coinrate_requester: responseData: ', responseData);
        if (String(response).trim().toLowerCase() === 'error') {
          app.debug('coinrate_requester: request failed, response: ', response);
          return callback(message || 'Failed to request exchange rates');
        } else {
          return callback(null, responseData);
        }
      }).catch((error) => {
        app.error('coinrate_requester: request error: ', error);
        return callback(error.message || 'Failed to request exchange rate');
      });
    } catch(error) {
      app.error('coinrate_requester: error: ', error);
      return callback(error.message || 'Failed to request exchange rate');
    }
  };
}