# df-api-docs-ui
API Docs is a DreamFactory wrapper around Swagger UI. Select a service and you get the Swagger UI for that service.


## Overview

DreamFactory is a secure, self-hosted enterprise data access platform that provides governed API access to any data source, connecting enterprise applications and on-prem LLMs with role-based access and identity passthrough.

### Installation
1. `npm install`
2. `bower install`
3. `cd app/styles && gem install compass`

### Start dev server
`grunt serve --force`

### Start Compass
The processor for .scss files.  

`cd app/styles && compass watch`

### Build dist
`grunt build --force`
