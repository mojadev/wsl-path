import { WslCommand, MountPoint } from "./types";
import { execSync } from "child_process";

/**
 * Module for determining the (linux) mount point of a file
 */
export const determineMountPoints = (wslCommand: WslCommand): MountPoint[] => {
  const stdout = execSync(`${wslCommand} -e mount`).toString();
  return stdout
    .trim()
    .split("\n")
    .map((line) => line.split(" "))
    .map(([windowsPath, _, linuxPath, __, type]) => ({
      src: linuxPath,
      target: type === "9p" || type === "drvfs" ? windowsPath : undefined,
    }))
    .sort((a, b) => b.src.length - a.src.length);
};
