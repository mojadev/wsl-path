/**
 * Textual representation of a system file path.
 */
export type FilePath = string;

/**
 * A string containing a windows drive path, like
 * C:\, D:\...
 */
export type WindowDrivePath = string;


export interface ResolveOptions {
    basePathCache: {[windowsFolder: string]: FilePath}
}
