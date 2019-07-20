import { FilePath, WindowDrivePath, MountPoint } from "./types";
import * as path from "path";

export const ERROR_FILEPATH_MUST_BE_ABSOLUTE =
  "Can't resolve windows filepath to wsl path: Path must be an absolute windows path";
export const WRONG_POSIX_PATH_ROOT = "Linux path must reside in /mnt/";

export const parsePosixPath = (linuxPath: FilePath, mountPoints: MountPoint[]): [FilePath, FilePath] => {
  const mountPoint = mountPoints.find(({ src }) => linuxPath.startsWith(src));
  if (!mountPoint || !mountPoint.target) {
    return [path.dirname(linuxPath), path.basename(linuxPath)]
  }
  return [mountPoint.src, linuxPath.substring(mountPoint.src.length)];
};

export const parseWindowsPath = (
  windowsPath: FilePath,
  _: MountPoint[]
): [WindowDrivePath, FilePath] => {
  try {
    return splitByPattern(/^(\w+:\\)(.*)$/gi, windowsPath);
  } catch (e) {
    throw Error(ERROR_FILEPATH_MUST_BE_ABSOLUTE);
  }
};

export const splitByPattern = (
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

export function joinPath(
  basePath: FilePath,
  restOfPath: FilePath,
  isWindowsPath: boolean = false
) {
  const platformPath = isWindowsPath ? path.win32 : path.posix;
  if (!isWindowsPath) {
    restOfPath = restOfPath.replace(/\\/gi, '/');
  } else {
    restOfPath = restOfPath.replace(/\//gi, '\\');
  }
  return platformPath.join(basePath, restOfPath).trim();
}
