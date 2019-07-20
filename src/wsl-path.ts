import { exec, execSync } from "child_process";
import {
  ResolveOptions,
  FilePath,
  ResolutionContext,
  PathCache,
  WslCommand,
  MountPoint
} from "./types";
import { parseWindowsPath, joinPath, parsePosixPath } from "./path-handling";
import { determineMountPoints } from "./mount";


const WSL_UTIL = "wslpath";

let _forceRunInWsl: boolean | undefined = undefined;

let inMemoryCacheInstance: PathCache = {};
let inMemoryMountPathCacheInstance: { [key: string]: MountPoint[] } = {};

const defaultResolveOptions: ResolveOptions = {
  wslCommand: "wsl"
};

export const resetCache = () => {
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
export const windowsToWsl = (
  windowsPath: FilePath,
  options: ResolveOptions = {...defaultResolveOptions}
): Promise<FilePath> => {
  return resolveAsync(buildWindowsResolutionContext(windowsPath, options));
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
export const wslToWindows = (
  posixPath: FilePath,
  options: ResolveOptions = {...defaultResolveOptions}
): Promise<FilePath> => {
  return resolveAsync(buildPosixResolutionContext(posixPath, options));
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
export const wslToWindowsSync = (
  posixPath: FilePath,
  options: ResolveOptions = {...defaultResolveOptions}
): FilePath => {
  return resolveSync(buildPosixResolutionContext(posixPath, options));
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
export const windowsToWslSync = (
  windowsPath: FilePath,
  options: ResolveOptions = {...defaultResolveOptions}
): FilePath => {
  return resolveSync(buildWindowsResolutionContext(windowsPath, options));
};

/**
 * Perform a path resolution for the given @see ResolutionContext in a asynchronous manner.
 *
 * @param context The @see ResolutionContext to resolve.
 */
const resolveAsync = (context: ResolutionContext): Promise<FilePath> => {
  const cachedResult = lookupCache(context);
  if (cachedResult) {
    return Promise.resolve(cachedResult);
  }
  return callWslPathUtil(context).then(result => {
    const resultContext = buildResolutionContext(result, {});

    cacheValue(context, resultContext);
    return result;
  });
};

/**
 * Perform a path resolution for the given @see ResolutionContext in a synchronous manner.
 *
 * @param context The @see ResolutionContext to resolve.
 */
const resolveSync = (context: ResolutionContext): FilePath => {
  const cachedResult = lookupCache(context);
  if (cachedResult) {
    return cachedResult;
  }
  const result = callWslPathUtilSync(context);
  const resultContext = buildResolutionContext(result, context);
  cacheValue(context, resultContext);
  return result;
};

/**
 * Execute the wsl path resolution synchronously.
 *
 * @param context The @see ResolutionContext to resolve;
 */
const callWslPathUtilSync = (context: ResolutionContext): FilePath => {
  const wslCall = toWslCommand(context);
  const stdout = execSync(wslCall).toString();

  return joinPath(stdout.trim(), context.restOfPath, !context.isWindowsPath);
};

/**
 * Execute the wsl path resolution asynchronously.
 *
 * @param context The @see ResolutionContext to resolve;
 */
const callWslPathUtil = (context: ResolutionContext) => {
  const wslCall = toWslCommand(context);

  return new Promise<FilePath>((resolve, reject) => {
    exec(wslCall, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else if (stderr && !stdout) {
        reject((stderr || "").trim());
      } else {
        resolve(
          joinPath(stdout.trim(), context.restOfPath, !context.isWindowsPath)
        );
      }
    });
  });
};

/**
 * Create the wsl command for resolving the given context.
 *
 * @param context The @see ResolutionContext that should be resolved.
 */
const toWslCommand = (context: ResolutionContext) => {
  const baseCommand = `${WSL_UTIL} ${!context.isWindowsPath ? "-w" : ""} ${
    context.basePath
  }`;
  if (process.platform !== "win32" && _forceRunInWsl === false) {
    return baseCommand;
  }
  return context.wslCommand + " " + baseCommand.replace(/\\/g, "\\\\");
};

/**
 * Force to run/not run wslpath in a wsl environment.
 * This is mostly useful for testing scenarios
 */
export const _setForceRunInWsl = (value: boolean): boolean =>
  (_forceRunInWsl = value);

/**
 * Return the cache key used for storing and retrieving the given @see ResolutionContext.
 *
 * @param context The context to create the key for.
 */
const cacheKey = (context: ResolutionContext): string =>
  `${context.wslCommand}:${context.basePath}`;

/**
 * Mark the resultContext as being the resolution result for sourceContext.
 *
 * @param sourceContext The @see ResolutionContext defining the resolve input.
 * @param resultContext The @see ResolutionContext defining the resolve output.
 */
const cacheValue = (
  sourceContext: ResolutionContext,
  resultContext: ResolutionContext
) => {
  // this shouldn't happen, and even if it does so it should not be put in the cache
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
const lookupCache = (context: ResolutionContext): FilePath | undefined => {
  const result = context.cache[cacheKey(context)];
  if (!result) {
    return;
  }
  return joinPath(result, context.restOfPath, !context.isWindowsPath);
}

const fetchMountPoints = (wslCommand: WslCommand): MountPoint[] => {
  inMemoryMountPathCacheInstance[wslCommand] = determineMountPoints(wslCommand);
  return inMemoryMountPathCacheInstance[wslCommand];
}

/**
 * Create a new @see ResolutionContext from the given path and parse options.
 *
 * @param path    The path to resolve. Can be either POSIX or Windows (see the reverse flag in the result)
 * @param options The parse options provided by the user.
 */
const buildResolutionContext = (
  path: FilePath,
  options: ResolveOptions,
  parser?: (inPath: FilePath, mountPoints: MountPoint[]) => [FilePath, FilePath]
): ResolutionContext => {
  options.basePathCache = options.basePathCache || inMemoryCacheInstance;
  options.wslCommand = options.wslCommand || "wsl";
  options.mountPoints = options.mountPoints || inMemoryMountPathCacheInstance[options.wslCommand] || fetchMountPoints(options.wslCommand);
  // TODO: This actually doesn't cover network shares
  const isWindowsPath = /^\w:\\/i.test(path);
  const [basePath, restOfPath] = (parser ||
    (!isWindowsPath ? parsePosixPath : parseWindowsPath))(path, options.mountPoints);

  return {
    basePath,
    restOfPath,
    isWindowsPath,
    wslCommand: options.wslCommand,
    cache: options.basePathCache
  };
};

/**
 * Stricter version of @see buildResolutionContext which only allows windows paths at path.
 * Throws an error if a non windows (with drive letter) path is provided
 *
 * @param path    The windows file path to create a context for.
 * @param options The user provided resolution options
 */
const buildWindowsResolutionContext = (
  path: FilePath,
  options: ResolveOptions
) => {
  const context = buildResolutionContext(path, options, parseWindowsPath);
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
const buildPosixResolutionContext = (
  path: FilePath,
  options: ResolveOptions
) => {
  const context = buildResolutionContext(path, options, parsePosixPath);
  if (context.isWindowsPath) {
    throw Error("Invalid POSIX path provided:" + path);
  }
  return context;
};
