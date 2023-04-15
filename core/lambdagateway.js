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

utils.requireEnvVar('LAMBDA_SERVER');
utils.requireEnvVar('LAMBDA_SERVER_PROTO');
utils.requireEnvVar('LAMBDA_SERVER_PORT');
utils.requireEnvVar('LAMBDA_REGION');


/**
 * Creates an AWS authentication signature based on the global settings and
 * the passed request parameter.
 *
 * @param r {Request} HTTP request object
 * @returns {string} AWS authentication signature
 */
function lambdaAuth(r) {
    const host = process.env['LAMBDA_SERVER'];
    const region = process.env['LAMBDA_REGION'];
    const queryParams = '';
    const credentials = awscred.readCredentials(r);

    let signature = awssig4.signatureV4(
        r, awscred.getNow(), region, SERVICE,
        r.variables.request_uri, queryParams, host, credentials
    );
    return signature;
}

/**
 * Redirects the request to the appropriate location. 
 *
 * @param r {Request} HTTP request object
 */
function redirectToLambda(r) {
    r.internalRedirect("@lambda");
}

/**
 * Returns the Lambda path given the incoming request
 *
 * @param r HTTP request
 * @returns {string} uri for Lambda request
 */
function lambdaURI(r) {
    let uriPath = r.variables.uri_path ? r.variables.uri_path : '/';
    let path = _escapeURIPath(uriPath);
    utils.debug_log(r, 'AWS Lambda Request URI: ' + path);
    return path;
}

/**
 * Flag indicating debug mode operation. If true, additional information
 * about signature generation will be logged.
 * @type {boolean}
 */

const ADDITIONAL_HEADER_PREFIXES_TO_STRIP = utils.parseArray(process.env['HEADER_PREFIXES_TO_STRIP']);

/**
 * Default filename for index pages to be read off of the backing object store.
 * @type {string}
 */
const INDEX_PAGE = "index.html";

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

/**
 * Outputs the timestamp used to sign the request, so that it can be added to
 * the 'Date' header and sent by NGINX.
 *
 * @param r {Request} HTTP request object (not used, but required for NGINX configuration)
 * @returns {string} RFC2616 timestamp
 */
function lambdaDate(r) {
    return awscred.getNow().toUTCString();
}

/**
 * Outputs the timestamp used to sign the request, so that it can be added to
 * the 'x-amz-date' header and sent by NGINX. The output format is
 * ISO 8601: YYYYMMDD'T'HHMMSS'Z'.
 * @see {@link https://docs.aws.amazon.com/general/latest/gr/sigv4-date-handling.html | Handling dates in Signature Version 4}
 *
 * @param r {Request} HTTP request object (not used, but required for NGINX configuration)
 * @returns {string} ISO 8601 timestamp
 */
function awsHeaderDate(r) {
    return utils.getAmzDatetime(
        awscred.getNow(),
        utils.getEightDigitDate(awscred.getNow())
    );
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
    awsHeaderDate,
    editHeaders,
    lambdaAuth,
    lambdaDate,
    lambdaURI,
    redirectToLambda,
    trailslashControl,
    // These functions do not need to be exposed, but they are exposed so that
    // unit tests can run against them.
    _encodeURIComponent,
    _escapeURIPath,
    _isHeaderToBeStripped
};
