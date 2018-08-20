import { ResolveOptions } from './types';
export declare const ERROR_FILEPATH_MUST_BE_ABSOLUTE = "Can't resolve windows filepath to wsl path: Path must be an absolute windows path";
export declare const WRONG_POSIX_PATH_ROOT = "Linux path must reside in /mnt/";
export declare const resetCache: () => void;
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
export declare const windowsToWsl: (windowsPath: string, options?: ResolveOptions) => Promise<string>;
/**
 * Return a promise that resolves a POSIX path to it's corresponding windows path in the wsl environment.
 * This calls wslpath for resolving the base path and caches it in the default
 * resolve options. Subsequent calls with the same base path are then derived from the cache.
 *
 * If you do not want this, pass custom ResolveOptions with an empty or custom cache.
 * @param windowsPath   The windows path to convert to a posix path
 * @param options       Overwrite the resolver options, e.g. for disabling base caching
 */
export declare const wslToWindows: (windowsPath: string, options?: ResolveOptions) => Promise<string>;
