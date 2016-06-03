'use strict';

const nock = require('nock');
const SEOshop = require('.');

describe('SEOshop', () => {

  it('should validate the signature', (done) => {
    const seoshop = new SEOshop({
      app_api_key: 'b0c6046c38038ab3bf78f140e3304f5f',
      app_api_secret: 'f24814a4b94d9ccea7eb2db17f406689'
    });

    // Params received from success callback url from seoshop
    const params = {
      language: 'de',
      shop_id: '105504',
      signature: '571c45048a509d2b5d8ffb9df84f3cc1',
      timestamp: '1446566190',
      token: '6fbcb14e074a6c345f8e7dffe489d9bf'
    };

    seoshop.isValidSignature(params, done);
  });

  it('should make a request',  (done) => {
    nock('https://api.webshopapp.com/de')
      .get('/orders.json').reply(200, [{}]);

    // http://app.zenfulfillment.com/app/settings/connect-store/seoshop/finalize?language=de&shop_id=105504&signature=571c45048a509d2b5d8ffb9df84f3cc1&timestamp=1446566190&token=6fbcb14e074a6c345f8e7dffe489d9bf
    const seoshop = new SEOshop({
      app_api_key: 'b0c6046c38038ab3bf78f140e3304f5f',
      app_api_secret: 'f24814a4b94d9ccea7eb2db17f406689',
      token: '6fbcb14e074a6c345f8e7dffe489d9bf',
      language: 'de',
      shop_id: '105504'
    });

    seoshop.get('/orders.json', done);
  });
});
