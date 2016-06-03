'use strict';

const url = require('url');
const https = require('https');

const md5 = require('md5');

const API_URL = 'https://api.webshopapp.com';

const noop = () => {};

class SEOshopAPI {
  constructor(config) {
    const defaults = {
      rate_limit_delay: 10000
    };

    if (!this instanceof SEOshopAPI) {
      return new SEOshopAPI(config);
    }

    if (!config || !config.app_api_key || !config.app_api_secret) {
      throw new Error('SEOshopAPI module expects a config object\nPlease see documentation ' +
          'at: https://github.com/zenfulfillment/seoshop-api');
    }

    this.config = Object.assign({}, defaults, config);

    if (config.token) {
      this.config.user_secret = md5(this.config.token + this.config.app_api_secret);
    }
  }

  setParams(params) {
    this.config.shop_id = params.shop_id;
    this.config.token = params.token;
    this.config.language = params.language;
  }

  _createSignature(params) {
    let parameters = [];
    let parametersStr = '';

    for (let key in params) {
      if (key !== 'signature') {
        parameters.push(key + '=' + params[key]);
      }
    }

    parametersStr = parameters.sort().join('');

    return md5(parametersStr + this.config.app_api_secret);
  }

  isValidSignature(params, callback) {
    let signature = this._createSignature(params);

    if (signature === params.signature) {
      this.setParams(params);
      callback(null, this.config);
    } else {
      callback(new Error('Signature is not authentic!'));
    }
  }

  _request(endpoint, method, data, callback) {
    let parsedUrl = url.parse(API_URL);
    let reqUrl = API_URL + '/' + this.config.language + endpoint;

    let options = {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      path: '/' + this.config.language + endpoint,
      method: method ? method.toUpperCase() : 'GET',
      port: 443,
      auth: this.config.app_api_key + ':' + this.config.user_secret,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    let allowsData = options.method.match(/post|put|delete/i);
    let dataString = allowsData && data ? JSON.stringify(data) : '';
    let hasData = !!dataString.length;

    if (hasData && allowsData) {
      options.headers['Content-Length'] = new Buffer(dataString).length;
    }

    let req = https.request(options, (res) => {
      let body = '';

      res.setEncoding('utf8');

      res.on('data', (chunk) => body += chunk);

      res.on('end', () => {
        let error = null;
        let json;

        if (res.statusCode === 429) {
          console.log(
            'SEOshopAPI._request() | Error 429, retrying after', this.config.rate_limit_delay);
          return setTimeout(() => {
            this._request(endpoint, method, data, callback);
          }, this.config.rate_limit_delay);
        }

        // console.log('SEOshopAPI._request() | Response', body);

        try {
          if (body.trim()) {
            json = JSON.parse(body);
            if (json.hasOwnProperty('error') || json.hasOwnProperty('errors')) {
              error = {
                error: json.error || json.errors,
                code: res.statusCode
              };
            }
          }
        } catch (e) {
          error = e;
        }

        callback(error, json);
      });
    });

    req.on('error', (err) => {
      console.log('SEOshopAPI._request() | Error', reqUrl, err);
      callback(err);
    });

    if (hasData && allowsData) {
      req.write(dataString);
    }

    req.end();
  }

  get(endpoint, data, callback) {
    if (typeof data === 'function' && arguments.length < 3) {
      callback = data;
      data = null;
    }
    this._request(endpoint, 'GET', data, callback);
  }

  post(endpoint, data, callback) {
    this._request(endpoint,'POST', data, callback);
  }

  put(endpoint, data, callback) {
    this._request(endpoint, 'PUT', data, callback);
  }

  del(endpoint, data, callback) {
    if (arguments.length < 3) {
      if (typeof data === 'function') {
        callback = data;
        data = null;
      } else {
        callback = noop;
        data = typeof data === 'undefined' ? null : data;
      }
    }
    this._request(endpoint, 'DELETE', data, callback);
  }
}

module.exports = SEOshopAPI;
