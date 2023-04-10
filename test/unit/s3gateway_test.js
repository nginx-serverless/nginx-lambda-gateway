#!env njs

/*
 *  Copyright 2020 F5 Networks
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

import awssig4 from "include/awssig4.js";

var fakeRequest = {
    "remoteAddress" : "172.17.0.1",
    "headersIn" : {
        "Connection" : "keep-alive",
        "Accept-Encoding" : "gzip, deflate",
        "Accept-Language" : "en-US,en;q=0.7,ja;q=0.3",
        "Host" : "localhost:8999",
        "User-Agent" : "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:79.0) Gecko/20100101 Firefox/79.0",
        "DNT" : "1",
        "Cache-Control" : "max-age=0",
        "Accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Upgrade-Insecure-Requests" : "1"
    },
    "uri" : "/a/c/ramen.jpg",
    "method" : "GET",
    "httpVersion" : "1.1",
    "headersOut" : {},
    "args" : {
        "foo" : "bar"
    },
    "status" : 0
};

fakeRequest.log = function(msg) {
    console.log(msg);
}

function testEncodeURIComponent() {
    printHeader('testEncodeURIComponent');
    function testPureAsciiAlphaNum() {
        console.log('  ## testPureAsciiAlphaNum');
        let alphaNum = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let encoded = s3gateway._encodeURIComponent(alphaNum);
        if (alphaNum !== alphaNum) {
            throw 'Incorrect encoding applied to string.\n' +
            `Actual:   [${encoded}]\n` +
            `Expected: [${expected}]`;
        }
    }
    function testUnicodeText() {
        console.log('  ## testUnicodeText');
        let unicode = 'これは　This is ASCII системы  חן ';
        let expected = '%E3%81%93%E3%82%8C%E3%81%AF%E3%80%80This%20is%20ASCII%20%D1%81%D0%B8%D1%81%D1%82%D0%B5%D0%BC%D1%8B%20%20%D7%97%D7%9F%20';
        let encoded = s3gateway._encodeURIComponent(unicode);
        if (expected !== encoded) {
            throw 'Incorrect encoding applied to string.\n' +
            `Actual:   [${encoded}]\n` +
            `Expected: [${expected}]`;
        }
    }
    function testDiceyCharactersInText() {
        console.log('  ## testDiceyCharactersInText');

        let diceyCharacters = '%@!*()=+$#^&|\\/';
        for (let i = 0; i < diceyCharacters.length; i++) {
            let char = diceyCharacters[i];
            let encoded = s3gateway._encodeURIComponent(char);
            let expected = `%${char.charCodeAt(0).toString(16).toUpperCase()}`;
            if (encoded !== expected) {
                throw 'Incorrect encoding applied to string.\n' +
                `Actual:   [${encoded}]\n` +
                `Expected: [${expected}]`;
            }
        }
    }

    testPureAsciiAlphaNum();
    testUnicodeText();
    testDiceyCharactersInText();
}

function testSplitCachedValues() {
    printHeader('testSplitCachedValues');
    var eightDigitDate = "20200811"
    var kSigningHash = "{\"type\":\"Buffer\",\"data\":[164,135,1,191,232,3,16,62,137,5,31,85,175,34,151,221,118,120,59,188,235,94,180,22,218,183,30,14,173,203,196,246]}"
    var cached = eightDigitDate + ":" + kSigningHash;
    var fields = awssig4._splitCachedValues(cached);

    if (fields.length !== 2) {
        throw 'Unexpected array length returned.\n' +
        'Actual:   [' + fields.length + ']\n' +
        'Expected: [2]';
    }

    if (fields[0] !== eightDigitDate) {
        throw 'Eight digit date field not extracted correctly.\n' +
        'Actual:   [' + fields[0] + ']\n' +
        'Expected: [' + eightDigitDate + ']';
    }

    if (fields[1] !== kSigningHash) {
        throw 'kSigningHash field not extracted correctly.\n' +
        'Actual:   [' + fields[1] + ']\n' +
        'Expected: [' + kSigningHash + ']';
    }
}

function testEditHeaders() {
    printHeader('testEditHeaders');

    const r = {
        "headersOut": {
            "Accept-Ranges": "bytes",
            "Content-Length": 42,
            "Content-Security-Policy": "block-all-mixed-content",
            "Content-Type": "text/plain",
            "X-Amz-Bucket-Region": "us-east-1",
            "X-Amz-Request-Id": "166539E18A46500A",
            "X-Xss-Protection": "1; mode=block"
        },
        "variables": {
            "uri_path": "/a/c/ramen.jpg"
        },
    }

    r.log = function(msg) {
        console.log(msg);
    }

    s3gateway.editHeaders(r);

    for (const key in r.headersOut) {
        if (key.toLowerCase().indexOf("x-amz", 0) >= 0) {
            throw "x-amz header not stripped from headers correctly";
        }
    }
}

function testEditHeadersHeadDirectory() {
    printHeader('testEditHeadersHeadDirectory');
    let r = {
        "method": "HEAD",
        "headersOut" : {
            "Content-Security-Policy": "block-all-mixed-content",
                "Content-Type": "application/xml",
                "Server": "AmazonS3",
                "X-Amz-Bucket-Region": "us-east-1",
                "X-Amz-Request-Id": "166539E18A46500A",
                "X-Xss-Protection": "1; mode=block"
        },
    "variables": {
            "uri_path": "/a/c/"
        },
    }

    r.log = function(msg) {
        console.log(msg);
    }

    s3gateway.editHeaders(r);

    if (r.headersOut.length > 0) {
        throw "all headers were not stripped from request";
    }
}

function testIsHeaderToBeStripped() {
    printHeader('testIsHeaderToBeStripped');
    // if (s3gateway._isHeaderToBeStripped('cache-control', [])) {
    //     throw "valid header should not be stripped";
    // }
    // if (!s3gateway._isHeaderToBeStripped('x-amz-request-id', [])) {
    //     throw "x-amz header should always be stripped";
    // }
    if (!s3gateway._isHeaderToBeStripped('x-goog-storage-class',
        ['x-goog'])) {
        throw "x-goog-storage-class header should be stripped";
    }
}

function testEscapeURIPathPreservesDoubleSlashes() {
    printHeader('testEscapeURIPathPreservesDoubleSlashes');
    var doubleSlashed = '/testbucketer2/foo3//bar3/somedir/license';
    var actual = s3gateway._escapeURIPath(doubleSlashed);
    var expected = '/testbucketer2/foo3//bar3/somedir/license';

    if (actual !== expected) {
        throw 'URI Path escaping is stripping slashes'
    }
}

function printHeader(testName) {
    console.log(`\n## ${testName}`);
}

async function test() {
    testEncodeURIComponent();
    testSplitCachedValues();
    testIsHeaderToBeStripped();
    testEditHeaders();
    testEditHeadersHeadDirectory();
    testEscapeURIPathPreservesDoubleSlashes();
}

test();
console.log('Finished unit tests for s3gateway.js');
