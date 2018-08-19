import { exec } from "child_process";
import { FilePath, ResolveOptions, WindowDrivePath } from "./types";
import * as path from "path";
import { SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS } from "constants";

export const ERROR_FILEPATH_MUST_BE_ABSOLUTE =
  "Can't resolve windows filepath to wsl path: Path must be an absolute windows path";
export const WRONG_POSIX_PATH_ROOT = "Linux path must reside in /mnt/";

const WSL_UTIL = "wslpath";

let defaultResolveOptions: ResolveOptions = {
  basePathCache: {}
};

export const resetCache = () => {
    defaultResolveOptions.basePathCache = {};
}

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
    const [driveLetter, restOfPath] = parseLinuxPath(windowsPath);
    const cachedResult = options.basePathCache[driveLetter];
    if (cachedResult) {
        return Promise.resolve(joinPath(cachedResult, restOfPath, true));
    }
    return callWslPathUtil(driveLetter, restOfPath, true);
  } catch (e) {
    return Promise.reject(e);
  }
};

const parseLinuxPath = (linuxPath: FilePath): [FilePath, FilePath] => {
  try {
    return splitByPattern(/^(\/mnt\/\w)(.*)$/gi, linuxPath);
  } catch (e) {
    throw Error(WRONG_POSIX_PATH_ROOT);
  }
};

const parseWindowsPath = (
  windowsPath: FilePath
): [WindowDrivePath, FilePath] => {
  try {
    return splitByPattern(/^(\w+:\\)(.*)$/gi, windowsPath);
  } catch (e) {
    throw Error(ERROR_FILEPATH_MUST_BE_ABSOLUTE);
  }
};

const splitByPattern = (
  pattern: RegExp,
  path: FilePath
): [FilePath, FilePath] => {
  const drivePattern = pattern.exec(path);
  if (!drivePattern) {
    throw Error("Pattern does not match");
  }

  const [driveLetter, restOfPath] = drivePattern.slice(1);
  return [driveLetter, restOfPath];
};

const callWslPathUtil = (
  driveLetter: FilePath,
  restOfPath: FilePath,
  reverse: boolean = false
): Promise<FilePath> => {

  const wslCall = `${WSL_UTIL} ${reverse ? "-w" : ""} ${driveLetter}`;
  return new Promise<FilePath>((resolve, reject) => {

    exec(wslCall, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else if (stderr && !stdout) {
        reject(stderr.trim());
      } else {
        const result = stdout.trim();
        defaultResolveOptions.basePathCache[result] = driveLetter;
        defaultResolveOptions.basePathCache[driveLetter] = result;
        resolve(joinPath(result, restOfPath, reverse));
      }
    });
  });
};

function joinPath(
  basePath: FilePath,
  restOfPath: FilePath,
  isWindowsPath: boolean
) {
  const platformPath = isWindowsPath ? path.win32 : path.posix;

  const result = platformPath.join(
    platformPath.resolve(basePath),
    restOfPath
  );
  return result;
}
