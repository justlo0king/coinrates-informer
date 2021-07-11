import getCoinrateRequester from './coinrates-requester';
const REFRESH_TIMEOUT = 60000;

/**
 * Constructor for singleton cointaining logic related to coin exchange rates
 * @param {*} app - feathers app
 * @returns frozen object with allowed methods:
 *   getRates()
 *     - returns latest cached rates
 *   refreshRates(callback)
 *     - refreshes exchange rates cache and sets next timeout to call itself
 */
const createCoinrateManager = function(app) {
  // initializing requester
  const request = getCoinrateRequester(app);
  // will cache latest rates
  const coinrates = new Map();
  // timeout to run next cache refreshing
  let refreshTimeout;

  /**
   * requests exchange rates and saves result to cache,
   * uses REFRESH_TIMEOUT to sets timeout for next call of itself
   */
  const refreshRates = (params, callback) => {
    callback = typeof callback == 'function' ? callback : function() {};
    const { coin='btc' } = params || {};
    if (!coin || typeof coin !== 'string') {
      //app.error('coinrate.refreshRates: "coin" string is not in params');
      return callback('Parameters error');
    }

    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }

    return request({
      coin
    }, function(error, result) {
      refreshTimeout = setTimeout(refreshRates, REFRESH_TIMEOUT);
      if (error) {
        app.error('coinrate: refresh request failed, error: ', error);
        return callback(error);
      } else {
        Object.keys(result).map((coin) => {
          coinrates.set(coin, result[coin]);
        });
        return callback(null, result);
      }
    });
  };

  /**
   * endpoint to get exchange rates from cache
   * @returns object like { USD: 1.20, EUR: 1.00 }
   */
  const getRates = () => {
    return Object.fromEntries(coinrates);
  };

  // loading first cache in next thread
  refreshTimeout = setTimeout(refreshRates);

  return Object.freeze({
    getRates,
    refreshRates
  });
};

// keeps initialized singleton instance
let manager;

/**
 * creates manager singleton
 * and returns same instance during runtime
 * @param {Application} app - feathers app
 * @returns {Object} - object with methods: { request, getRates }
 */
export default function getCoinrateManager(app) {
  if (!manager) {
    manager = createCoinrateManager(app);
  }
  return manager;
}