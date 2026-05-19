namespace navismaster.db;

entity KPIData {
    key ID             : UUID;
    title              : String(100);
    value              : String(50);
    subtitle           : String(100);
    delta              : String(50);
    icon               : String(100);
    borderColor        : String(20);
}

entity DashboardApps {
    key ID             : UUID;
    title              : String(100);
    subtitle           : String(200);
    metric             : String(50);
    footer             : String(200);
    icon               : String(100);
    color              : String(20);
}

entity Activities {
    key ID             : UUID;
    time               : String(20);
    message            : String(500);
    status             : String(20);
}

entity WorkspaceItems {
    key ID             : UUID;
    title              : String(100);
    icon               : String(100);
    count              : Integer;
}

entity Pillars {
    key ID             : UUID;
    title              : String(100);
    description        : String(200);
    active             : Boolean;
}