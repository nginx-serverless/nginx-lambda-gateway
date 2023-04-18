/*
 *  Copyright 2023 F5, Inc.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import awscred from "./awscredentials.js";
import awssig4 from "./awssig4.js";
import utils from "./utils.js";

/**
 * Constant defining the service requests are being signed for.
 * @type {string}
 */
const SERVICE = 'lambda';

utils.requireEnvVar('LAMBDA_REGION');
utils.requireEnvVar('LAMBDA_SERVER_PROTO');
utils.requireEnvVar('LAMBDA_SERVER');
utils.requireEnvVar('LAMBDA_SERVER_PORT');


/**
 * Creates an AWS authentication signature to invole Lambda Function ARN based
 * on the global settings and the passed request parameter.
 *
 * @param r {Request} HTTP request object
 * @returns {string} AWS authentication signature
 */
function lambdaFunctionARNAuth(r) {
    const host = process.env['LAMBDA_SERVER'];
    const region = process.env['LAMBDA_REGION'];
    const queryParams = '';
    const credentials = awscred.readCredentials(r);

    const signature = awssig4.signatureV4(
        r, awscred.getNow(), region, SERVICE,
        r.variables.request_uri, queryParams, host, credentials
    );
    return signature;
}

/**
 * Creates an AWS authentication signature to invole Lambda Function URL based
 * on the global settings and the passed request parameter.
 *
 * @param r {Request} HTTP request object
 * @returns {string} AWS authentication signature
 */
function lambdaFunctionURLAuth(r) {
    const host = r.variables.lambda_host ? r.variables.lambda_host : '';
    const region = process.env['LAMBDA_REGION'];
    const queryParams = '';
    const credentials = awscred.readCredentials(r);
    const requestURI = '/';

    const signature = awssig4.signatureV4(
        r, awscred.getNow(), region, SERVICE,
        requestURI, queryParams, host, credentials
    );
    return signature;
}

/**
 * Redirects the request to the appropriate location of AWS Lambda Function ARN.
 *
 * @param r {Request} HTTP request object
 */
function redirectToLambdaFunctionARN(r) {
    r.internalRedirect("@lambda_function_arn");
}

/**
 * Redirects the request to the AWS Lambda Function URL.
 *
 * @param r {Request} HTTP request object
 */
function redirectToLambdaFunctionURL(r) {
    r.internalRedirect("@lambda_function_url");
}

/**
 * Returns the Lambda path given the incoming request.
 *
 * @param r HTTP request
 * @returns {string} uri for Lambda request
 */
function lambdaURI(r) {
    const uriPath = r.variables.uri_path ? r.variables.uri_path : '/';
    const path = _escapeURIPath(uriPath);
    utils.debug_log(r, 'AWS Lambda Request URI: ' + path);
    return path;
}

/**
 * Returns the host of Lambda Function ARN.
 *
 * @param r HTTP request
 * @returns {string} host of Lambda Function ARN
 */
function lambdaFunctionARNHost(r) {
    return process.env['LAMBDA_SERVER'];
}

/**
 * Returns the protocol of Lambda Function ARN/URL.
 *
 * @param r HTTP request
 * @returns {string} protocol of Lambda Function ARN/URL
 */
function lambdaProto(r) {
    const proto = process.env['LAMBDA_SERVER_PROTO'];
    utils.debug_log(r, 'AWS Lambda Server Protocol: ' + proto);
    return proto;
}

/**
 * Returns the port of Lambda Function ARN/URL.
 *
 * @param r HTTP request
 * @returns {string} port of Lambda Function ARN/URL
 */
function lambdaPort(r) {
    const port = process.env['LAMBDA_SERVER_PORT'];
    utils.debug_log(r, 'AWS Lambda Server Port: ' + port);
    return port;
}

/**
 * Returns the Lambda URL given the environment variables.
 *
 * @param r HTTP request
 * @returns {string} URL for Lambda request
 */
function lambdaURL(r) {
    const proto = process.env['LAMBDA_SERVER_PROTO'];
    const server = process.env['LAMBDA_SERVER'];
    const port = process.env['LAMBDA_SERVER_PORT'];

    // Generate lambda URL using env variables as the following example:
    //   "https://lambda.us-east-2.amazonaws.com";
    const url = `${proto}://${server}:${port}`; 
    utils.debug_log(r, 'AWS Lambda Request URL: ' + url);
    return url;
}

/**
 * Flag indicating debug mode operation. If true, additional information
 * about signature generation will be logged.
 * @type {boolean}
 */

const ADDITIONAL_HEADER_PREFIXES_TO_STRIP = utils.parseArray(process.env['HEADER_PREFIXES_TO_STRIP']);

/**
 * Transform the headers returned from Lambda such that there isn't information
 * leakage about Lambda and do other tasks needed for appropriate gateway output.
 * @param r HTTP request
 */
function editHeaders(r) {
    /* Strips all x-amz- headers from the output HTTP headers so that the
     * requesters to the gateway will not know you are proxying Lambda. */
    if ('headersOut' in r) {
        for (const key in r.headersOut) {
            if (_isHeaderToBeStripped(
                key.toLowerCase(), ADDITIONAL_HEADER_PREFIXES_TO_STRIP)) {
                delete r.headersOut[key];
            }
        }
    }
}

/**
 * Determines if a given HTTP header should be removed before being
 * sent on to the requesting client.
 * @param headerName {string} Lowercase HTTP header name
 * @param additionalHeadersToStrip {Array[string]} array of additional headers to remove
 * @returns {boolean} true if header should be removed
 */
function _isHeaderToBeStripped(headerName, additionalHeadersToStrip) {
    if (headerName.indexOf('x-amz-', 0) >= 0) {
        return true;
    }

    for (let i = 0; i < additionalHeadersToStrip.length; i++) {
        const headerToStrip = additionalHeadersToStrip[i];
        if (headerName.indexOf(headerToStrip, 0) >= 0) {
            return true;
        }
    }

    return false;
}

function trailslashControl(r) {
    if (APPEND_SLASH) {
        const hasExtension = /\/[^.\/]+\.[^.]+$/;
        if (!hasExtension.test(r.variables.uri_path) && !_isDirectory(r.variables.uri_path)) {
            return r.internalRedirect("@trailslash");
        }
    }
    r.internalRedirect("@error404");
}

/**
 * Adds additional encoding to a URI component
 *
 * @param string {string} string to encode
 * @returns {string} an encoded string
 * @private
 */
function _encodeURIComponent(string) {
    return encodeURIComponent(string)
        .replace(/[!*'()]/g, (c) =>
            `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

/**
 * Escapes the path portion of a URI without escaping the path separator
 * characters (/).
 *
 * @param uri {string} unescaped URI
 * @returns {string} URI with each path component separately escaped
 * @private
 */
function _escapeURIPath(uri) {
    // Check to see if the URI path was already encoded. If so, we decode it.
    let decodedUri = (uri.indexOf('%') >= 0) ? decodeURIComponent(uri) : uri;
    let components = [];

    decodedUri.split('/').forEach(function (item, i) {
        components[i] = _encodeURIComponent(item);
    });

    return components.join('/');
}

/**
 * Determines if a given path is a directory based on whether or not the last
 * character in the path is a forward slash (/).
 *
 * @param path {string} path to parse
 * @returns {boolean} true if path is a directory
 * @private
 */
function _isDirectory(path) {
    if (path === undefined) {
        return false;
    }
    const len = path.length;

    if (len < 1) {
        return false;
    }

    return path.charAt(len - 1) === '/';
}


export default {
    editHeaders,
    lambdaFunctionARNAuth,
    lambdaFunctionARNHost,
    lambdaFunctionURLAuth,
    lambdaPort,
    lambdaProto,
    lambdaURI,
    lambdaURL,
    redirectToLambdaFunctionARN,
    redirectToLambdaFunctionURL,
    trailslashControl,
    // These functions do not need to be exposed, but they are exposed so that
    // unit tests can run against them.
    _encodeURIComponent,
    _escapeURIPath,
    _isHeaderToBeStripped
};
