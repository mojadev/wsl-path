import { FilePath } from "./types";
import { MountPoint } from "./mount";
export declare const ERROR_FILEPATH_MUST_BE_ABSOLUTE = "Can't resolve windows filepath to wsl path: Path must be an absolute windows path";
export declare const WRONG_POSIX_PATH_ROOT = "Linux path must reside in /mnt/";
export declare const parsePosixPath: (linuxPath: string, mountPoints: MountPoint[]) => [string, string];
export declare const parseWindowsPath: (windowsPath: string, _: MountPoint[]) => [string, string];
export declare const splitByPattern: (pattern: RegExp, path: string) => [string, string];
export declare function joinPath(basePath: FilePath, restOfPath: FilePath, isWindowsPath?: boolean): string;
