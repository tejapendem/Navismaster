module.exports = cds.service.impl(async function () {

    const { KPIData, DashboardApps } = this.entities;

    this.before('READ', KPIData, async () => {
        console.log('Loading KPI Data');
    });

    this.before('READ', DashboardApps, async () => {
        console.log('Loading Dashboard Apps');
    });

    this.on('currentUser', (req) => {
        const u = req.user || {};
        const id = u.id || 'anonymous';
        const attrs = u.attr || {};
        const fullName =
            (attrs.firstName && attrs.lastName && `${attrs.firstName} ${attrs.lastName}`) ||
            attrs.name ||
            attrs.email ||
            id;
        const firstName = attrs.firstName || (typeof fullName === 'string' ? fullName.split(/[\s.@]+/)[0] : id);
        const initials = (firstName.match(/\b\w/g) || []).slice(0, 2).join('').toUpperCase() ||
                         id.slice(0, 2).toUpperCase();
        return { id, name: fullName, initials, firstName };
    });

});