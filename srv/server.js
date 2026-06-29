const cds = require('@sap/cds');

cds.on('bootstrap', (app) => {
    // Allow cross-origin calls from SAP BTP Launchpad and approuter
    app.use((req, res, next) => {
        const origin = req.headers.origin;
        if (origin && (
            origin.endsWith('.hana.ondemand.com') ||
            origin.endsWith('.cfapps.ap10.hana.ondemand.com') ||
            origin === 'http://localhost:4004' ||
            origin === 'http://localhost:5000'
        )) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-csrf-token');
        }
        if (req.method === 'OPTIONS') { return res.sendStatus(204); }
        next();
    });

    app.get('/api/user', (req, res) => {
        const u = req.user || {};
        const id = u.id || 'anonymous';
        const attrs = u.attr || {};
        const fullName = attrs.name || attrs.email || id;
        const firstName = attrs.firstName || fullName.split(/[\s.@]+/)[0] || 'there';
        const initials = (firstName.match(/\b\w/g) || []).slice(0, 2).join('').toUpperCase() || id.slice(0, 2).toUpperCase();
        res.json({ id, name: fullName, initials, firstName });
    });

    app.get('/api/tax-lookup', async (req, res) => {
        try {
            const { gstin } = req.query;
            if (!gstin) {
                return res.status(400).json({ error: 'GSTIN parameter is required' });
            }
            const API_KEY = '05bcf71e13efc4c5e7d8dc7db3f74ec7';
            const response = await fetch(`https://sheet.gstincheck.co.in/check/${API_KEY}/${gstin}`);
            const data = await response.json();
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
});
