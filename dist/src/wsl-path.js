"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var path_handling_1 = require("./path-handling");
var WSL_UTIL = "wslpath";
var defaultResolveOptions = {
    basePathCache: {}
};
exports.resetCache = function () {
    defaultResolveOptions.basePathCache = {};
};
/**
 * Return a promise that resolves with a windows path to it's corresponding POSIX path in the wsl environment.
 * In case the resolution does not succeed, the Promise rejects with the appropriate error response.
 *
 * This calls wslpath(.exe) for resolving the base path and caches it in the default
 * resolve options. Subsequent calls with the same base path are then derived from the cache.
 *
 * If you do not want this, pass custom ResolveOptions with an empty or custom cache.
 * @param windowsPath   The windows path to convert to a posix path
 * @param options       Overwrite the resolver options, e.g. for disabling base caching
 */
exports.windowsToWsl = function (windowsPath, options) {
    if (options === void 0) { options = defaultResolveOptions; }
    try {
        var _a = path_handling_1.parseWindowsPath(windowsPath), driveLetter = _a[0], restOfPath = _a[1];
        var cachedResult = options.basePathCache[driveLetter];
        if (cachedResult) {
            return Promise.resolve(path_handling_1.joinPath(cachedResult, restOfPath, false));
        }
        return callWslPathUtil(driveLetter, restOfPath);
    }
    catch (e) {
        return Promise.reject(e);
    }
};
/**
 * Return a promise that resolves a POSIX path to it's corresponding windows path in the wsl environment.
 * This calls wslpath for resolving the base path and caches it in the default
 * resolve options. Subsequent calls with the same base path are then derived from the cache.
 *
 * If you do not want this, pass custom ResolveOptions with an empty or custom cache.
 * @param windowsPath   The windows path to convert to a posix path
 * @param options       Overwrite the resolver options, e.g. for disabling base caching
 */
exports.wslToWindows = function (windowsPath, options) {
    if (options === void 0) { options = defaultResolveOptions; }
    try {
        var _a = path_handling_1.parsePosixPath(windowsPath), driveLetter = _a[0], restOfPath = _a[1];
        var cachedResult = options.basePathCache[driveLetter];
        if (cachedResult) {
            return Promise.resolve(path_handling_1.joinPath(cachedResult, restOfPath, true));
        }
        return callWslPathUtil(driveLetter, restOfPath, true);
    }
    catch (e) {
        return Promise.reject(e);
    }
};
/**
 * Resolve the POSIX path for the given windows path in the wsl environment in a synchronous call.
 * This calls wslpath for resolving the base path and caches it in the default
 * resolve options. Subsequent calls with the same base path are then derived from the cache.
 *
 * If you do not want this, pass custom ResolveOptions with an empty or custom cache.
 * @param windowsPath   The windows path to convert to a posix path
 * @param options       Overwrite the resolver options, e.g. for disabling base caching
 */
exports.wslToWindowsSync = function (windowsPath, options) {
    if (options === void 0) { options = defaultResolveOptions; }
    var _a = path_handling_1.parsePosixPath(windowsPath), driveLetter = _a[0], restOfPath = _a[1];
    var cachedResult = options.basePathCache[driveLetter];
    if (cachedResult) {
        return path_handling_1.joinPath(cachedResult, restOfPath, true);
    }
    return callWslPathUtilSync(driveLetter, restOfPath, true);
};
/**
 * Resolve the Windows path for the given POSI path in the wsl environment in a synchronous call.
 * In case the resolution does not succeed, the Promise rejects with the appropriate error response.
 *
 * This calls wslpath(.exe) for resolving the base path and caches it in the default
 * resolve options. Subsequent calls with the same base path are then derived from the cache.
 *
 * If you do not want this, pass custom ResolveOptions with an empty or custom cache.
 * @param windowsPath   The windows path to convert to a posix path
 * @param options       Overwrite the resolver options, e.g. for disabling base caching
 */
exports.windowsToWslSync = function (windowsPath, options) {
    if (options === void 0) { options = defaultResolveOptions; }
    var _a = path_handling_1.parseWindowsPath(windowsPath), driveLetter = _a[0], restOfPath = _a[1];
    var cachedResult = options.basePathCache[driveLetter];
    if (cachedResult) {
        return path_handling_1.joinPath(cachedResult, restOfPath, false);
    }
    return callWslPathUtilSync(driveLetter, restOfPath);
};
var callWslPathUtilSync = function (driveLetter, restOfPath, reverse) {
    if (reverse === void 0) { reverse = false; }
    var wslCall = WSL_UTIL + " " + (reverse ? "-w" : "") + " " + driveLetter;
    var stdout = child_process_1.execSync(wslCall).toString();
    return parseProcessResult(stdout, driveLetter, restOfPath, reverse);
};
var callWslPathUtil = function (driveLetter, restOfPath, reverse) {
    if (reverse === void 0) { reverse = false; }
    var wslCall = WSL_UTIL + " " + (reverse ? "-w" : "") + " " + driveLetter;
    return new Promise(function (resolve, reject) {
        child_process_1.exec(wslCall, function (err, stdout, stderr) {
            if (err) {
                reject(err);
            }
            else if (stderr && !stdout) {
                reject(stderr.trim());
            }
            else {
                resolve(parseProcessResult(stdout, driveLetter, restOfPath, reverse));
            }
        });
    });
};
function parseProcessResult(stdout, driveLetter, restOfPath, reverse) {
    var result = stdout.trim();
    defaultResolveOptions.basePathCache[result] = driveLetter;
    defaultResolveOptions.basePathCache[driveLetter] = result;
    return path_handling_1.joinPath(result, restOfPath, reverse);
}
