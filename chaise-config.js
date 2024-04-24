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
    navbarBanner: [
        {
            markdownPattern: 'IMPORTANT NOTICE:\nThe CFDE program is undergoing a reorganization of coordination activities.  As a result, this portal is being discontinued as of June 30th. It is being replaced by a new resource - the [CFDE Workbench](https://info.cfde.cloud/). Please visit the new portal to learn more.',
            dismissible: true,
            key: 'redirect-banner'
        }
    ],
    internalHosts: [
        "g-c7e94.f19a4.5898.data.globus.org",   // dev
        "app-dev.nih-cfde.org",
        "g-3368fe.c0aba.03c0.data.globus.org",  // staging
        "app-staging.nih-cfde.org",
        "g-882990.aa98d.08cc.data.globus.org",  // production
        "app.nih-cfde.org"
    ]
};
