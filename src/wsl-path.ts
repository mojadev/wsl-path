import { exec, execSync } from "child_process";
import { ResolveOptions, FilePath } from "./types";
import { parseWindowsPath, joinPath, parsePosixPath } from "./path-handling";

const WSL_UTIL = "wslpath";
let _forceRunInWsl: boolean | undefined = undefined;

let defaultResolveOptions: StrictResolveOptions = {
  basePathCache: {},
  wslCommand: "wsl"
};

export const resetCache = () => {
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
export const windowsToWsl = (
  windowsPath: FilePath,
  options: ResolveOptions = defaultResolveOptions
): Promise<FilePath> => {
  try {
    const resolveOptions: StrictResolveOptions = {
      ...options,
      ...defaultResolveOptions
    };
    const [driveLetter, restOfPath] = parseWindowsPath(windowsPath);
    const cachedResult =
      resolveOptions.basePathCache[
        cacheKey(resolveOptions.wslCommand, driveLetter)
      ];
    if (cachedResult) {
      return Promise.resolve(joinPath(cachedResult, restOfPath, false));
    }
    return callWslPathUtil(
      driveLetter,
      restOfPath,
      false,
      options.wslCommand
    ).then(value => {
      updateCache(driveLetter, value.basePath, resolveOptions);
      return value.result;
    });
  } catch (e) {
    return Promise.reject(e);
  }
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
  options: ResolveOptions = defaultResolveOptions
): Promise<FilePath> => {
  try {
    const resolveOptions: StrictResolveOptions = {
      ...options,
      ...defaultResolveOptions
    };
    const [driveLetter, restOfPath] = parsePosixPath(posixPath);
    const cachedResult =
      resolveOptions.basePathCache[cacheKey(options.wslCommand, driveLetter)];
    if (cachedResult) {
      return Promise.resolve(joinPath(cachedResult, restOfPath, true));
    }

    return callWslPathUtil(
      driveLetter,
      restOfPath,
      true,
      options.wslCommand
    ).then(value => {
      updateCache(driveLetter, value.basePath, resolveOptions);
      return value.result;
    });
  } catch (e) {
    return Promise.reject(e);
  }
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
  options: ResolveOptions = defaultResolveOptions
): FilePath => {
  const resolveOptions = { ...options, ...defaultResolveOptions };
  const [driveLetter, restOfPath] = parsePosixPath(posixPath);
  const cachedResult =
    resolveOptions.basePathCache[
      cacheKey(resolveOptions.wslCommand, driveLetter)
    ];
  if (cachedResult) {
    return joinPath(cachedResult, restOfPath, true);
  }
  const resolveResult = callWslPathUtilSync(
    driveLetter,
    restOfPath,
    true,
    options.wslCommand
  );
  updateCache(driveLetter, resolveResult.basePath, resolveOptions);
  return resolveResult.result;
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
  options: ResolveOptions = defaultResolveOptions
): FilePath => {
  const resolveOptions: StrictResolveOptions = {
    ...options,
    ...defaultResolveOptions
  };
  const [driveLetter, restOfPath] = parseWindowsPath(windowsPath);
  const cachedResult =
    resolveOptions.basePathCache[
      cacheKey(resolveOptions.wslCommand, driveLetter)
    ];
  if (cachedResult) {
    return joinPath(cachedResult, restOfPath, false);
  }

  const resolveResult = callWslPathUtilSync(
    driveLetter,
    restOfPath,
    false,
    options.wslCommand
  );
  updateCache(driveLetter, resolveResult.basePath, resolveOptions);
  return resolveResult.result;
};

const callWslPathUtilSync = (
  driveLetter: FilePath,
  restOfPath: FilePath,
  reverse: boolean = false,
  command: string = "wsl"
): ResolveResult => {
  const wslCall = `${WSL_UTIL} ${reverse ? "-w" : ""} ${driveLetter}`;
  const stdout = execSync(escapeWslCommand(wslCall, command)).toString();

  return {
    basePath: stdout.trim(),
    result: parseProcessResult(stdout, restOfPath, reverse)
  };
};

const callWslPathUtil = (
  driveLetter: FilePath,
  restOfPath: FilePath,
  reverse: boolean = false,
  command: string = WSL_UTIL
): Promise<ResolveResult> => {
  const wslCall = escapeWslCommand(
    `${WSL_UTIL} ${reverse ? "-w" : ""} ${driveLetter}`,
    command
  );

  return new Promise<ResolveResult>((resolve, reject) => {
    exec(wslCall, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else if (stderr && !stdout) {
        reject(stderr.trim());
      } else {
        return resolve({
          basePath: stdout.trim(),
          result: parseProcessResult(stdout, restOfPath, reverse)
        });
      }
    });
  });
};

function escapeWslCommand(command: string, wslShell: string) {
  if (
    !_forceRunInWsl &&
    (process.platform !== "win32" || _forceRunInWsl === false)
  ) {
    return command;
  }
  return wslShell + " " + command.replace(/\\/g, "\\\\");
}

function parseProcessResult(
  stdout: string,
  restOfPath: string,
  reverse: boolean
) {
  const result = stdout.trim();
  return joinPath(result, restOfPath, reverse);
}
/**
 * Force to run/not run wslpath in a wsl environment.
 * This is mostyl useful for testing scenarios
 */
export function _setForceRunInWsl(value: boolean): void {
  _forceRunInWsl = value;
}

function cacheKey(wslCommand: string | undefined, path: string): string {
  return (wslCommand || "") + ":" + path;
}

function updateCache(
  sourcePath: FilePath,
  targetPath: FilePath,
  options: StrictResolveOptions
) {
  options.basePathCache[cacheKey(options.wslCommand, targetPath)] = sourcePath;
  options.basePathCache[cacheKey(options.wslCommand, sourcePath)] = targetPath;
}

interface ResolveResult {
  /**
   * The base path or drive letter the resolved result resides in.
   */
  basePath: FilePath;
  /**
   * The complete resolved path.
   */
  result: FilePath;
}

interface StrictResolveOptions {
  basePathCache: { [base: string]: FilePath };
  wslCommand: string;
}
