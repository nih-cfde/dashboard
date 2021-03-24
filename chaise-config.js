// Configure deployment-specific data in the ermrest catalog, not here.

var chaiseConfig = {
    deleteRecord: true,
    editRecord: true,
    showFaceting: true,
    customCSS: "/css/custom.css",
    headTitle: "NIH CFDE",
    navbarBrandText: "CFDE Home",
    navbarBrandImage: "/images/icons/CFDE-icon-1.png",
    dataBrowser: "/",
    defaultCatalog: 1,
    hideGoToRID: true,
    shareCiteAcls: {
        show: []
    },
    internalHosts: [
        "g-c7e94.f19a4.5898.data.globus.org",   // dev
        "app-dev.nih-cfde.org",
        "g-3368fe.c0aba.03c0.data.globus.org",  // staging
        "app-staging.nih-cfde.org",
        "g-882990.aa98d.08cc.data.globus.org",  // production
        "app.nih-cfde.org"
    ]
};
