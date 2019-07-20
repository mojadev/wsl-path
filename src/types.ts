import { MountPoint } from "./mount";


/**
 * Textual representation of a system file path.
 */
export type FilePath = string;

/**
 * A string containing a windows drive path, like
 * C:\, D:\...
 */
export type WindowDrivePath = string;

/**
 * A wsl command line, e.g. 'wsl', 'bash', 'ubuntu run', etc.
 */
export type WslCommand = string;

/**
 * Additional options that allow modifying the resolution behaviour.
 */
export interface ResolveOptions {
    /**
     * A hashmap containing Windows drive letters/POSIX mounting points as the key
     * and POSIX mounting points/Windows drive letters as the value.
     *
     * Static mappings that can be used to resolve paths without calling wslpath.
     */
    basePathCache?: {[base: string]: FilePath},

    /**
     * The command to use for the wsl commanline (default is wsl, but this could
     * also be something like 'ubuntu' or 'bash'). Use this parameter to distinguish
     * between multiple wsl environments.
     */
    wslCommand?: WslCommand,

    /**
     * A list of known mount points from WSL and Windows.
     */
    mountPoints?: MountPoint[]
}

export type PathCache = {[key: string]: FilePath};
/**
 * The resolution context of a resolve operation.
 */
export interface ResolutionContext {
    /**
     * The mount path or drive letter of input.
     */
    basePath: FilePath,
    /**
     * The rest of the path, relative to basePath.
     */
    restOfPath: FilePath,
    /**
     * The wsl command that is used for resolving.
     */
    wslCommand: WslCommand
    /**
     * Flag marking a operation from the wsl context to the windows environment.
     */
    isWindowsPath?: boolean,

    /**
     * The cache that must be looked up/populated in order to resolve paths.
     */
    cache: {[key:string]: FilePath}
}

/**
 * A mountpoint in the wsl environment
 */
export interface MountPoint {
    /**
     * The (POSIX) source path.
     */
    src: FilePath,
    /**
     * The mapped windows drive, if applicable.
     */
    target?: WindowDrivePath
}