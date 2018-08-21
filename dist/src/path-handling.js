"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var path = __importStar(require("path"));
exports.ERROR_FILEPATH_MUST_BE_ABSOLUTE = "Can't resolve windows filepath to wsl path: Path must be an absolute windows path";
exports.WRONG_POSIX_PATH_ROOT = "Linux path must reside in /mnt/";
exports.parsePosixPath = function (linuxPath) {
    try {
        return exports.splitByPattern(/^(\/mnt\/\w)(.*)$/gi, linuxPath);
    }
    catch (e) {
        throw Error(exports.WRONG_POSIX_PATH_ROOT);
    }
};
exports.parseWindowsPath = function (windowsPath) {
    try {
        return exports.splitByPattern(/^(\w+:\\)(.*)$/gi, windowsPath);
    }
    catch (e) {
        throw Error(exports.ERROR_FILEPATH_MUST_BE_ABSOLUTE);
    }
};
exports.splitByPattern = function (pattern, path) {
    var drivePattern = pattern.exec(path);
    if (!drivePattern) {
        throw Error("Pattern does not match");
    }
    var _a = drivePattern.slice(1), driveLetter = _a[0], restOfPath = _a[1];
    return [driveLetter, restOfPath];
};
function joinPath(basePath, restOfPath, isWindowsPath) {
    if (isWindowsPath === void 0) { isWindowsPath = false; }
    var platformPath = isWindowsPath ? path.win32 : path.posix;
    return platformPath.join(platformPath.resolve(basePath), restOfPath).trim();
}
exports.joinPath = joinPath;
