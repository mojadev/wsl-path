

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
 * Additional options that allow modifying the resolution behaviour.
 */
export interface ResolveOptions {
    /**
     * A hashmap containing Windows drive letters/POSIX mounting points as the key
     * and POSIX mounting points/Windows drive letters as the value.
     *
     * Static mappings that can be used to resolve paths without calling wslpath.
     */
    basePathCache: {[base: string]: FilePath}
}
