import { exec, execSync } from "child_process";
import { ResolveOptions, FilePath } from "./types";
import { parseWindowsPath, joinPath, parsePosixPath } from "./path-handling";

const WSL_UTIL = "wslpath";
let _forceRunInWsl: (boolean | undefined) = undefined;

let defaultResolveOptions: ResolveOptions = {
  basePathCache: {}
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
    const [driveLetter, restOfPath] = parseWindowsPath(windowsPath);
    const cachedResult = options.basePathCache[driveLetter];
    if (cachedResult) {
      return Promise.resolve(joinPath(cachedResult, restOfPath, false));
    }
    return callWslPathUtil(driveLetter, restOfPath);
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
 * @param windowsPath   The windows path to convert to a posix path
 * @param options       Overwrite the resolver options, e.g. for disabling base caching
 */
export const wslToWindows = (
  windowsPath: FilePath,
  options: ResolveOptions = defaultResolveOptions
): Promise<FilePath> => {
  try {
    const [driveLetter, restOfPath] = parsePosixPath(windowsPath);
    const cachedResult = options.basePathCache[driveLetter];
    if (cachedResult) {
      return Promise.resolve(joinPath(cachedResult, restOfPath, true));
    }
    return callWslPathUtil(driveLetter, restOfPath, true);
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
 * @param windowsPath   The windows path to convert to a posix path
 * @param options       Overwrite the resolver options, e.g. for disabling base caching
 */
export const wslToWindowsSync = (windowsPath: FilePath,options: ResolveOptions = defaultResolveOptions): FilePath => {
  const [driveLetter, restOfPath] = parsePosixPath(windowsPath);
  const cachedResult = options.basePathCache[driveLetter];
  if (cachedResult) {
    return joinPath(cachedResult, restOfPath, true);
  }
  return callWslPathUtilSync(driveLetter, restOfPath, true);
}


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

  const [driveLetter, restOfPath] = parseWindowsPath(windowsPath);
  const cachedResult = options.basePathCache[driveLetter];
  if (cachedResult) {
    return joinPath(cachedResult, restOfPath, false);
  }
  return callWslPathUtilSync(driveLetter, restOfPath);
};



const callWslPathUtilSync = (driveLetter: FilePath, restOfPath: FilePath, reverse: boolean = false): FilePath => {
  const wslCall = `${WSL_UTIL} ${reverse ? "-w" : ""} ${driveLetter}`;
  const stdout = execSync(escapeWslCommand(wslCall)).toString();

  return parseProcessResult(stdout, driveLetter, restOfPath, reverse);
};

const callWslPathUtil = (
  driveLetter: FilePath,
  restOfPath: FilePath,
  reverse: boolean = false
): Promise<FilePath> => {
  const wslCall = escapeWslCommand(`${WSL_UTIL} ${reverse ? "-w" : ""} ${driveLetter}`);

  return new Promise<FilePath>((resolve, reject) => {
    exec(wslCall, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else if (stderr && !stdout) {
        reject(stderr.trim());
      } else {
        resolve(parseProcessResult(stdout, driveLetter, restOfPath, reverse));
      }
    });
  });
};

function escapeWslCommand(command: string) {
  if (!_forceRunInWsl && (process.platform !== 'win32' || _forceRunInWsl === false)) {
    return command;
  }
  return 'wsl ' + command.replace(/\\/g, '\\\\');
}

function parseProcessResult(stdout: string, driveLetter: string, restOfPath: string, reverse: boolean) {
  const result = stdout.trim();
  defaultResolveOptions.basePathCache[result] = driveLetter;
  defaultResolveOptions.basePathCache[driveLetter] = result;
  return joinPath(result, restOfPath, reverse);
}
/**
 * Force to run/not run wslpath in a wsl environment.
 * This is mostyl useful for testing scenarios
 */
export function _setForceRunInWsl(value: boolean): void {
  _forceRunInWsl = value;
}