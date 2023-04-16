# NGINX Lambda Gateway

## Introduction

This project provides a working configuration of NGINX configured to act as an authenticating gateway for the AWS Lambda service. This allows you to proxy a private Lambda function without requiring users to authenticate to it. Within the proxy layer, additional functionality can be configured such as:

- Providing an authentication gateway using an alternative authentication
   system to Lambda functions
- For internal/micro services that can't authenticate against the Lambda functions
   (e.g. don't have libraries available) the gateway can provide a means
   to accessing Lambda functions without authentication
- Protecting Lambda functions from arbitrary public access and traversal
- [Rate limiting](http://nginx.org/en/docs/http/ngx_http_limit_req_module.html) Lambda functions
- Protecting Lambda functions with a [WAF](https://docs.nginx.com/nginx-waf/)

## Getting Started

Refer to the [Getting Started Guide](docs/getting_started.md) for how to build and run the gateway.

## Directory Structure and File Descriptions

```
.
|-- Makefile
|
|-- common
|   |-- etc
|   |   |-- nginx
|   |   `-- ssl
|   |-- lambda-core
|   |   |-- awscredentials.js
|   |   |-- awssig2.js
|   |   |-- awssig4.js
|   |   |-- lambda_ngx_apis.conf
|   |   |-- lambda_ngx_http.conf
|   |   |-- lambda_ngx_proxy.conf
|   |   |-- lambdagateway.js
|   |   `-- utils.js
|   `-- lambda-emulator
|
|-- docker
|   |-- Dockerfile.oss
|   `-- Dockerfile.plus
|
|-- docker-compose.yml
|
|-- docs
|
|-- examples
|   |-- 01-all-lambda-function-arns
|   |-- 02-one-lambda-function-arn
|   |-- 03-one-lambda-function-url
|   `-- 04-lambda-function-arn-and-url
|
|-- settings.env
|
`-- tests
```

## Development

Refer to the [Development Guide](docs/development.md) for more information about extending or testing the gateway.

## License

All code include is licensed under the [Apache 2.0 license](LICENSE.txt).
