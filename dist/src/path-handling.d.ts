import { FilePath, WindowDrivePath, MountPoint } from "./types";
export declare const ERROR_FILEPATH_MUST_BE_ABSOLUTE = "Can't resolve windows filepath to wsl path: Path must be an absolute windows path";
export declare const WRONG_POSIX_PATH_ROOT = "Linux path must reside in /mnt/";
export declare const parsePosixPath: (linuxPath: FilePath, mountPoints: MountPoint[]) => [FilePath, FilePath];
export declare const parseWindowsPath: (windowsPath: FilePath, _: MountPoint[]) => [WindowDrivePath, FilePath];
export declare const splitByPattern: (pattern: RegExp, path: FilePath) => [FilePath, FilePath];
export declare function joinPath(basePath: FilePath, restOfPath: FilePath, isWindowsPath?: boolean): string;
