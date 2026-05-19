module.exports = cds.service.impl(async function () {

    const { KPIData, DashboardApps } = this.entities;

    this.before('READ', KPIData, async () => {
        console.log('Loading KPI Data');
    });

    this.before('READ', DashboardApps, async () => {
        console.log('Loading Dashboard Apps');
    });

});