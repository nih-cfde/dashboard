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
    "navbarMenu": {
        "children": [
            {
                "name": "Browse All Data",
                "children": [
                    {
                        "url": "/chaise/recordset/#1/CFDE:collection",
                        "name": "Collection"
                    }, {
                        "url": "/chaise/recordset/#1/CFDE:file",
                        "name": "File"
                    }, {
                        "url": "/chaise/recordset/#1/CFDE:biosample",
                        "name": "Biosample"
                    }, {
                        "url": "/chaise/recordset/#1/CFDE:subject",
                        "name": "Subject"
                    }, {
                        "url": "/chaise/recordset/#1/CFDE:project",
                        "name": "Project"
                    }, {
                        "name": "Vocabulary",
                        "children": [
                            {
                                "url": "/chaise/recordset/#1/CFDE:anatomy",
                                "name": "Anatomy"
                            }, {
                                "url": "/chaise/recordset/#1/CFDE:assay_type",
                                "name": "Assay Type"
                            }, {
                                "url": "/chaise/recordset/#1/CFDE:data_type",
                                "name": "Data Type"
                            }, {
                                "url": "/chaise/recordset/#1/CFDE:file_format",
                                "name": "File Format"
                            }, {
                                "url": "/chaise/recordset/#1/CFDE:ncbi_taxonomy",
                                "name": "NCBI Taxonomy"
                            }, {
                                "url": "/chaise/recordset/#1/CFDE:subject_granularity",
                                "name": "Subject Granularity"
                            }, {
                                "url": "/chaise/recordset/#1/CFDE:subject_role",
                                "name": "Subject Role"
                            }
                        ]
                    }, {
                        "url": "/chaise/recordset/#1/CFDE:id_namespace",
                        "name": "ID Namespace"
                    }
                ]
            }, {
                "name": "Technical Documentation",
                "markdownName": ":span:Technical Documentation:/span:{.external-link-icon}",
                "url": "https://cfde-published-documentation.readthedocs-hosted.com/en/latest/"
            }, {
                "name": "User Guide",
                "markdownName": ":span:User Guide:/span:{.external-link-icon}",
                "url": "https://cfde-published-documentation.readthedocs-hosted.com/en/latest/about/portalguide/"
            }, {
                "name": "About CFDE",
                "markdownName": ":span:About CFDE:/span:{.external-link-icon}",
                "url": "https://www.nih-cfde.org/"
            }, {
                "name": "|"
            }, {
                "name": "Dashboard",
                "url": "/dashboard.html",
                "acls": {
                    "enable": [
                        "https://auth.globus.org/7977181e-f82f-11ea-b43a-0efde36f5027",
                        "https://auth.globus.org/1863c500-f831-11ea-b43d-0efde36f5027",
                        "https://auth.globus.org/4e335e29-f831-11ea-b43e-0efde36f5027",
                        "https://auth.globus.org/8a32410e-f831-11ea-880f-0ac4e6b272c3",
                        "https://auth.globus.org/f423d7d8-f831-11ea-a93a-0a738d2d09bf",
                        "https://auth.globus.org/2b14318d-f832-11ea-880f-0ac4e6b272c3",
                        "https://auth.globus.org/642533ba-f832-11ea-880f-0ac4e6b272c3",
                        "https://auth.globus.org/176baec4-ed26-11e5-8e88-22000ab4b42b"
                    ]
                }
            }, {
                "name": "Data Review",
                "url": "/dcc_review.html",
                "acls": {
                    "enable": [
                        "https://auth.globus.org/7977181e-f82f-11ea-b43a-0efde36f5027",
                        "https://auth.globus.org/1863c500-f831-11ea-b43d-0efde36f5027",
                        "https://auth.globus.org/4e335e29-f831-11ea-b43e-0efde36f5027",
                        "https://auth.globus.org/8a32410e-f831-11ea-880f-0ac4e6b272c3",
                        "https://auth.globus.org/f423d7d8-f831-11ea-a93a-0a738d2d09bf",
                        "https://auth.globus.org/2b14318d-f832-11ea-880f-0ac4e6b272c3",
                        "https://auth.globus.org/642533ba-f832-11ea-880f-0ac4e6b272c3",
                        "https://auth.globus.org/176baec4-ed26-11e5-8e88-22000ab4b42b"
                    ]
                }
            }
        ]
    },
    "SystemColumnsDisplayCompact": [],
    "SystemColumnsDisplayDetailed": []
};
