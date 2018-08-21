import { FilePath } from "./types";
export declare const ERROR_FILEPATH_MUST_BE_ABSOLUTE = "Can't resolve windows filepath to wsl path: Path must be an absolute windows path";
export declare const WRONG_POSIX_PATH_ROOT = "Linux path must reside in /mnt/";
export declare const parsePosixPath: (linuxPath: string) => [string, string];
export declare const parseWindowsPath: (windowsPath: string) => [string, string];
export declare const splitByPattern: (pattern: RegExp, path: string) => [string, string];
export declare function joinPath(basePath: FilePath, restOfPath: FilePath, isWindowsPath?: boolean): string;
