# NGINX Lambda Gateway

## Introduction

This project provides a working configuration of NGINX configured to act as an authenticating gateway for to AWS Lambda service. This allows you to proxy a private Lambda function without requiring users to authenticate to it. Within the proxy layer, additional functionality can be configured such as:

- Providing an authentication gateway using an alternative authentication
   system to Lambda functions
- For internal/micro services that can't authenticate against the Lambda functions
   (e.g. don't have libraries available) the gateway can provide a means
   to accessing Lambda functions without authentication
- Protecting Lambda function from arbitrary public access and traversal
- Rate limiting Lambda functions
- Protecting Lambda functions with a [WAF](https://docs.nginx.com/nginx-waf/)


## Getting Started

Refer to the [Getting Started Guide](docs/getting_started.md) for how to build and run the gateway.

## Directory Structure and File Descriptions


## Development

Refer to the [Development Guide](docs/development.md) for more information about
extending or testing the gateway.

## License

All code include is licensed under the [Apache 2.0 license](LICENSE.txt).
