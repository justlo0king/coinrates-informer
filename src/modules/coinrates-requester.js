import axios from 'axios';

/**
 * Factory for method to request exchange rates
 * @param {*} app - feathers app
 * @returns requester function(params, callback) {}, where
 *   @params      - object with coin and [currencies] strings
 *   @callback    - method to call with result when done or failed,
 *     @result    - object passed to @callback with "error" message or rates by key like "USD", "EUR"
 */
export default function getCoinrateRequester(app) {
  const { apiKey } = app.get('cryptocompare') || {};
  // URI sample
  // https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD,JPY,EUR
  const axiosInstance = axios.create({
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
        app.error('coinratesRequester: params is not an object');
        return callback('Parameters error');
      }

      const {
        coin, currencies='USD,EUR,'
      } = params || {};

      if (!apiKey) {
        app.error('coinratesRequester: apiKey not cryptocompare config');
        return callback('Configuration error');
      }

      if (!coin || typeof coin !== 'string') {
        app.error('coinratesRequester: coin string not in params: ', coin);
        return callback('Coin parameter error');
      }

      // requesting exchange rates API
      return axiosInstance.get(`/data/price?fsym=${String(coin).toUpperCase()}&tsyms=${currencies}'`).then((requestResponse) => {
        const { data:responseData } = requestResponse || {};
        const { Response:response, Message:message } = responseData || {};
        if (String(response).trim().toLowerCase() === 'error') {
          app.error('coinratesRequester: request failed, response: ', response);
          return callback(message || 'Failed to request exchange rates');
        } else {
          return callback(null, responseData);
        }
      }).catch((error) => {
        app.error('coinratesRequester: request error: ', error);
        return callback(error.message || 'Failed to request exchange rate');
      });
    } catch(error) {
      app.error('coinratesRequester: error: ', error);
      return callback(error.message || 'Failed to request exchange rate');
    }
  };
}