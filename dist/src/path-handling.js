"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinPath = exports.splitByPattern = exports.parseWindowsPath = exports.parsePosixPath = exports.WRONG_POSIX_PATH_ROOT = exports.ERROR_FILEPATH_MUST_BE_ABSOLUTE = void 0;
var path = __importStar(require("path"));
exports.ERROR_FILEPATH_MUST_BE_ABSOLUTE = "Can't resolve windows filepath to wsl path: Path must be an absolute windows path";
exports.WRONG_POSIX_PATH_ROOT = "Linux path must reside in /mnt/";
exports.parsePosixPath = function (linuxPath, mountPoints) {
    var mountPoint = mountPoints.find(function (_a) {
        var src = _a.src;
        return linuxPath.startsWith(src);
    });
    if (!mountPoint || !mountPoint.target) {
        return [path.dirname(linuxPath), path.basename(linuxPath)];
    }
    return [mountPoint.src, linuxPath.substring(mountPoint.src.length)];
};
exports.parseWindowsPath = function (windowsPath, _) {
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
    if (!isWindowsPath) {
        restOfPath = restOfPath.replace(/\\/gi, '/');
    }
    else {
        restOfPath = restOfPath.replace(/\//gi, '\\');
    }
    return platformPath.join(basePath, restOfPath).trim();
}
exports.joinPath = joinPath;
