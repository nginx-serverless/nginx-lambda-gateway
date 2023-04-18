# Development Guide

- [Integrating with AWS Signature](#integrating-with-aws-signature)
- [Enhancing the Gateway](#enhancing-the-gateway)
  - [Enhancing gateway configuration](#enhancing-gateway-configuration)
  - [Examples](#examples)


## Integrating with AWS Signature

Update the following files when enhancing `nginx-lambda-gateway` to integrate with AWS signature whenever AWS releases a new version of signature or you have a new PR:

- NGINX Proxy: [`/etc/nginx/conf.d/nginx_lambda_gateway.conf`](../common/etc/nginx/conf.d/nginx_lambda_gateway.conf)
- AWS Credentials Lib: [`/etc/nginx/serverless/awscredentials.js`](../common/lambda-core/awscredentials.js)
- AWS Signature Lib per version:
  - [`/etc/nginx/include/awssig4.js`](../common/lambda-core/awssig4.js)
- AWS Lambda Integration Lib: [`/etc/nginx/serverless/lambdagateway.js`](../common/lambda-core/lambdagateway.js)
- Common reusable Lib for all of NJS codebases: [`/etc/nginx/serverless/utils.js`](../common/lambda-core/utils.js)

![](../docs/img/nginx-lambda-gateway-aws-signature-integration.png)

## Enhancing the Gateway

### Enhancing gateway configuration

All files with the extension `.conf` in the directory of `/etc/nginx/conf.d` and `/etc/nginx/serverless` will be loaded into the configuration of the base `http` block within the `/etc/nginx/nginx.conf` of main NGINX configuration.

To enhance the feature of `nginx-lambda-gateway`, additional configuration or enhancements can be altered in the following files before either building the container image or Systemd service:

- NGINX Lambda Gateway main configuration: [`/etc/nginx/conf.d/nginx_lambda_gateway.conf`](../common/etc/nginx/conf.d/nginx_lambda_gateway.conf)
- NGINX API gateway configuration for AWS Lambda integration: [`/etc/nginx/serverless/lambda_ngx_apis.conf`](../common/lambda-core/lambda_ngx_apis.conf)
- NGINX configuration of importing NJS codebases and map directives for AWS Lambda integration: [`/etc/nginx/serverless/lambda_ngx_http.conf`](../common/lambda-core/lambda_ngx_http.conf)
- NGINX proxy configuration prior to invoking AWS Lambda Functions: [`/etc/nginx/serverless/lambda_ngx_proxy.conf`](../common/lambda-core/lambda_ngx_proxy.conf)

### Examples

In the [`examples/`](../examples/) directory, there are several use cases that show how to extend the base functionality of the NGINX Lambda Gateway by adding additional modules.

- [`nginx-lambda-gateway` proxy's '/' location to all AWS Lambda Function ARNs](../examples/01-all-lambda-function-arns/)
  ```bash
  make start-01
  curl --location --request POST 'http://localhost/2015-03-31/functions/foo/invocations'
  curl --location 'http://localhost/2015-03-31/functions/quota-notification/invocations' \
       --header 'Content-Type: application/json' \
       --data '{ 
                  "userId": "user-01",
                  "message": "The user'\''s API quota has been exhausted" 
               }'
  make down-01
  make clean
  ```

- [`nginx-lambda-gateway` proxy's one API endpoint to one AWS Lambda Function ARN](../examples/02-one-lambda-function-arn/)
  ```bash
  make start-02
  curl --location 'http://localhost/2015-03-31/functions/foo/invocations' \
       --header 'Content-Type: application/json'                          \
       --data '{"message": "This is a sample message"}'
  make down-02
  make clean
  ```

- [`nginx-lambda-gateway` proxy's one API endpoint to one AWS Lambda Function URL](../examples/03-one-lambda-function-url/)
  ```bash
  make start-03
  curl --location 'http://localhost/bar'           \
       --header   'Content-Type: application/json' \
       --data     '{ "message": "This is a sample message" }'
  make down-03
  make clean
  ```

- [`nginx-lambda-gateway` proxy to both of AWS Lambda Function ARN(s) and URL(s)](../examples/04-lambda-function-arn-url/)
  ```bash
  make start-04
  curl --location --request POST 'http://localhost/2015-03-31/functions/foo/invocations'
  curl --location --request POST 'http://localhost/2015-03-31/functions/bar/invocations'
  curl --location 'http://localhost/2015-03-31/functions/foo/invocations' \
       --header 'Content-Type: application/json'                          \
       --data '{"message": "This is a sample message"}'
  curl --location 'http://localhost/bar'           \
       --header   'Content-Type: application/json' \
       --data     '{ "message": "This is a sample message" }'
  make down-04
  make clean
  ```

- (TBD) Adding OIDC authentication into the `nginx-lambda-gateway`.
- (TBD) Rate Limiting to the `nginx-lambda-gateway`.
- (TBD) Protecting `nginx-lambda-gateway` with WAF.
