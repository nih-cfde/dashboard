# Overview

The cfde_deriva_dashboard_api.yml contains the OpenAPI (formerly Swagger.io) specification for a RESTful API to retrieve project metadata from Deriva to enable the creation of project dashboards.

# Endpoints

Here is a brief description of the endpoints described: 

## GET /project

Retrieve a listing of projects that the authenticated user has access to. These project names/monikers are necessary to use the other endpoints below.

## GET /project/{projectName}/storage

Retrieve the storage information (overall bytecount) associated with the given project, organized by sub-project.

## GET /project/{projectName}/storage_by_modality

Retrieve the storage information (overall bytecount) associated with the given project, organized by modality (assay type).

## GET /project/{projectName}/filecount

Retrieve the number of files associated with the given project, organized by sub-project.

## GET /project/{projectName}/filecount_by_modality

Retrieve the number of files associated with the given project, organized by modality (assay type).

## GET /project/{projectName}/storage_trend

Returns storage consumption data over time for the specified project broken down by sub-project.

## GET /project/{projectName}/storage_trend_by_modality

Returns storage consumption data over time for the specified project broken down by modality (assay type).
