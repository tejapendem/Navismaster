const path = require('path');
const Approuter = require('@sap/approuter');

process.env.TENANT_HOST_PATTERN = process.env.TENANT_HOST_PATTERN || '^(.*).cfapps.ap10.hana.ondemand.com$';

const CAP_URL = process.env.CAP_URL;
if (CAP_URL && !process.env.destinations) {
  process.env.destinations = JSON.stringify([
    {
      name: 'navismaster-api',
      url: CAP_URL,
      forwardAuthToken: true,
      strictSSL: false
    }
  ]);
}

const ar = new Approuter();

// ar.first runs before authentication — required so CORS preflight OPTIONS
// responses are sent before the approuter can reject unauthenticated requests.
ar.first.use(function corsHandler(req, res, next) {
    const origin = req.headers.origin;
    if (origin && origin.endsWith('.hana.ondemand.com')) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-csrf-token');
    }
    if (req.method === 'OPTIONS') { return res.status(204).end(); }
    next();
});

ar.start();
