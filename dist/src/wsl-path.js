"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._setForceRunInWsl = exports.windowsToWslSync = exports.wslToWindowsSync = exports.wslToWindows = exports.windowsToWsl = exports.resetCache = void 0;
var child_process_1 = require("child_process");
var path_handling_1 = require("./path-handling");
var mount_1 = require("./mount");
var WSL_UTIL = "wslpath";
var _forceRunInWsl = undefined;
var inMemoryCacheInstance = {};
var inMemoryMountPathCacheInstance = {};
var defaultResolveOptions = {
    wslCommand: "wsl",
};
exports.resetCache = function () {
    inMemoryCacheInstance = {};
    inMemoryMountPathCacheInstance = {};
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
    if (options === void 0) { options = __assign({}, defaultResolveOptions); }
    return resolveAsync(buildWindowsResolutionContext(windowsPath, options), options);
};
/**
 * Return a promise that resolves a POSIX path to it's corresponding windows path in the wsl environment.
 * This calls wslpath for resolving the base path and caches it in the default
 * resolve options. Subsequent calls with the same base path are then derived from the cache.
 *
 * If you do not want this, pass custom ResolveOptions with an empty or custom cache.
 * @param posixPath   The posix path to convert to a windos path
 * @param options     Overwrite the resolver options, e.g. for disabling base caching
 */
exports.wslToWindows = function (posixPath, options) {
    if (options === void 0) { options = __assign({}, defaultResolveOptions); }
    return resolveAsync(buildPosixResolutionContext(posixPath, options), options);
};
/**
 * Resolve the POSIX path for the given windows path in the wsl environment in a synchronous call.
 * This calls wslpath for resolving the base path and caches it in the default
 * resolve options. Subsequent calls with the same base path are then derived from the cache.
 *
 * If you do not want this, pass custom ResolveOptions with an empty or custom cache.
 * @param posixPath     The posix path to convert to a posix path
 * @param options       Overwrite the resolver options, e.g. for disabling base caching
 */
exports.wslToWindowsSync = function (posixPath, options) {
    if (options === void 0) { options = __assign({}, defaultResolveOptions); }
    return resolveSync(buildPosixResolutionContext(posixPath, options), options);
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
    if (options === void 0) { options = __assign({}, defaultResolveOptions); }
    return resolveSync(buildWindowsResolutionContext(windowsPath, options), options);
};
/**
 * Perform a path resolution for the given @see ResolutionContext in a asynchronous manner.
 *
 * @param context The @see ResolutionContext to resolve.
 * @param options The @see ResolveOptions to resolve
 */
var resolveAsync = function (context, options) {
    var cachedResult = lookupCache(context);
    if (cachedResult) {
        return Promise.resolve(cachedResult);
    }
    return callWslPathUtil(context).then(function (result) {
        var resultContext = buildResolutionContext(result, options);
        cacheValue(context, resultContext);
        return result;
    });
};
/**
 * Perform a path resolution for the given @see ResolutionContext in a synchronous manner.
 *
 * @param context The @see ResolutionContext to resolve.
 * @param options The @see ResolveOptions to resolve
 */
var resolveSync = function (context, options) {
    var cachedResult = lookupCache(context);
    if (cachedResult) {
        return cachedResult;
    }
    var result = callWslPathUtilSync(context);
    var resultContext = buildResolutionContext(result, context);
    cacheValue(context, resultContext);
    return result;
};
/**
 * Execute the wsl path resolution synchronously.
 *
 * @param context The @see ResolutionContext to resolve;
 */
var callWslPathUtilSync = function (context) {
    var wslCall = toWslCommand(context);
    var stdout = child_process_1.execSync(wslCall).toString();
    return path_handling_1.joinPath(stdout.trim(), context.restOfPath, !context.isWindowsPath);
};
/**
 * Execute the wsl path resolution asynchronously.
 *
 * @param context The @see ResolutionContext to resolve;
 */
var callWslPathUtil = function (context) {
    var wslCall = toWslCommand(context);
    return new Promise(function (resolve, reject) {
        child_process_1.exec(wslCall, function (err, stdout, stderr) {
            if (err) {
                reject(err);
            }
            else if (stderr && !stdout) {
                reject((stderr || "").trim());
            }
            else {
                resolve(path_handling_1.joinPath(stdout.trim(), context.restOfPath, !context.isWindowsPath));
            }
        });
    });
};
/**
 * Create the wsl command for resolving the given context.
 *
 * @param context The @see ResolutionContext that should be resolved.
 */
var toWslCommand = function (context) {
    var baseCommand = WSL_UTIL + " " + (!context.isWindowsPath ? "-w" : "") + " " + context.basePath;
    if (process.platform !== "win32" && _forceRunInWsl === false) {
        return baseCommand;
    }
    return context.wslCommand + " " + baseCommand.replace(/\\/g, "\\\\");
};
/**
 * Force to run/not run wslpath in a wsl environment.
 * This is mostly useful for testing scenarios
 */
exports._setForceRunInWsl = function (value) {
    return (_forceRunInWsl = value);
};
/**
 * Return the cache key used for storing and retrieving the given @see ResolutionContext.
 *
 * @param context The context to create the key for.
 */
var cacheKey = function (context) {
    return context.wslCommand + ":" + context.basePath;
};
/**
 * Mark the resultContext as being the resolution result for sourceContext.
 *
 * @param sourceContext The @see ResolutionContext defining the resolve input.
 * @param resultContext The @see ResolutionContext defining the resolve output.
 */
var cacheValue = function (sourceContext, resultContext) {
    if (sourceContext.isWindowsPath === resultContext.isWindowsPath) {
        return;
    }
    sourceContext.cache[cacheKey(sourceContext)] = resultContext.basePath;
    sourceContext.cache[cacheKey(resultContext)] = sourceContext.basePath;
};
/**
 * Return the result for the given context from the cache if resolution has been already peformed.
 *
 * @param context The @see ResolutionContext to lookup
 */
var lookupCache = function (context) {
    var result = context.cache[cacheKey(context)];
    if (!result) {
        return;
    }
    return path_handling_1.joinPath(result, context.restOfPath, !context.isWindowsPath);
};
var fetchMountPoints = function (wslCommand) {
    inMemoryMountPathCacheInstance[wslCommand] = mount_1.determineMountPoints(wslCommand);
    return inMemoryMountPathCacheInstance[wslCommand];
};
/**
 * Create a new @see ResolutionContext from the given path and parse options.
 *
 * @param path    The path to resolve. Can be either POSIX or Windows (see the reverse flag in the result)
 * @param options The parse options provided by the user.
 */
var buildResolutionContext = function (path, options, parser) {
    options.basePathCache = options.basePathCache || inMemoryCacheInstance;
    options.wslCommand = options.wslCommand || "wsl";
    options.mountPoints =
        options.mountPoints ||
            inMemoryMountPathCacheInstance[options.wslCommand] ||
            fetchMountPoints(options.wslCommand);
    // TODO: This actually doesn't cover network shares
    var isWindowsPath = /^\w:\\/i.test(path);
    var _a = (parser || (!isWindowsPath ? path_handling_1.parsePosixPath : path_handling_1.parseWindowsPath))(path, options.mountPoints), basePath = _a[0], restOfPath = _a[1];
    return {
        basePath: basePath,
        restOfPath: restOfPath,
        isWindowsPath: isWindowsPath,
        wslCommand: options.wslCommand,
        cache: options.basePathCache,
    };
};
/**
 * Stricter version of @see buildResolutionContext which only allows windows paths at path.
 * Throws an error if a non windows (with drive letter) path is provided
 *
 * @param path    The windows file path to create a context for.
 * @param options The user provided resolution options
 */
var buildWindowsResolutionContext = function (path, options) {
    var context = buildResolutionContext(path, options, path_handling_1.parseWindowsPath);
    if (!context.isWindowsPath) {
        throw Error("Invalid windows path provided:" + path);
    }
    return context;
};
/**
 * Stricter version of @see buildResolutionContext which only allows POSIX paths at path.
 * Throws an error if a non POSIX path is provided
 *
 * @param path    The POSIX file path to create a context for.
 * @param options The user provided resolution options
 */
var buildPosixResolutionContext = function (path, options) {
    var context = buildResolutionContext(path, options, path_handling_1.parsePosixPath);
    if (context.isWindowsPath) {
        throw Error("Invalid POSIX path provided:" + path);
    }
    return context;
};
