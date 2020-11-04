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
    // defaultCatalog: 1,
    hideGoToRID: true,
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
                "url": "#"
            }, {
                "name": "User Guide",
                "url": "#"
            }, {
                "name": "About CFDE",
                "url": "#"
            }, {
                "name": "|"
            }, {
                "name": "Dashboard",
                "url": "/dashboard.html",
                "acls": {
                    "show": ["*"],
                    "enable": []
                }
            }, {
                "name": "Data Review",
                "url": "#",
                "acls": {
                    "show": ["*"],
                    "enable": []
                }
            }
        ]
    },
    "SystemColumnsDisplayCompact": [],
    "SystemColumnsDisplayDetailed": []
};