"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var path = __importStar(require("path"));
exports.ERROR_FILEPATH_MUST_BE_ABSOLUTE = "Can't resolve windows filepath to wsl path: Path must be an absolute windows path";
exports.WRONG_POSIX_PATH_ROOT = "Linux path must reside in /mnt/";
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
        var _a = parseWindowsPath(windowsPath), driveLetter = _a[0], restOfPath = _a[1];
        var cachedResult = options.basePathCache[driveLetter];
        if (cachedResult) {
            return Promise.resolve(joinPath(cachedResult, restOfPath, false));
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
        var _a = parseLinuxPath(windowsPath), driveLetter = _a[0], restOfPath = _a[1];
        var cachedResult = options.basePathCache[driveLetter];
        if (cachedResult) {
            return Promise.resolve(joinPath(cachedResult, restOfPath, true));
        }
        return callWslPathUtil(driveLetter, restOfPath, true);
    }
    catch (e) {
        return Promise.reject(e);
    }
};
var parseLinuxPath = function (linuxPath) {
    try {
        return splitByPattern(/^(\/mnt\/\w)(.*)$/gi, linuxPath);
    }
    catch (e) {
        throw Error(exports.WRONG_POSIX_PATH_ROOT);
    }
};
var parseWindowsPath = function (windowsPath) {
    try {
        return splitByPattern(/^(\w+:\\)(.*)$/gi, windowsPath);
    }
    catch (e) {
        throw Error(exports.ERROR_FILEPATH_MUST_BE_ABSOLUTE);
    }
};
var splitByPattern = function (pattern, path) {
    var drivePattern = pattern.exec(path);
    if (!drivePattern) {
        throw Error("Pattern does not match");
    }
    var _a = drivePattern.slice(1), driveLetter = _a[0], restOfPath = _a[1];
    return [driveLetter, restOfPath];
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
                var result = stdout.trim();
                defaultResolveOptions.basePathCache[result] = driveLetter;
                defaultResolveOptions.basePathCache[driveLetter] = result;
                resolve(joinPath(result, restOfPath, reverse));
            }
        });
    });
};
function joinPath(basePath, restOfPath, isWindowsPath) {
    var platformPath = isWindowsPath ? path.win32 : path.posix;
    var result = platformPath.join(platformPath.resolve(basePath), restOfPath);
    return result;
}
