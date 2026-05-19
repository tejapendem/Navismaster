using navismaster.db from '../db/schema';

service DashboardService {

    entity KPIData as projection on db.KPIData;
    entity DashboardApps as projection on db.DashboardApps;
    entity Activities as projection on db.Activities;
    entity WorkspaceItems as projection on db.WorkspaceItems;
    entity Pillars as projection on db.Pillars;

}