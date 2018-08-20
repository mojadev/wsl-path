[![Build Status](https://travis-ci.org/mojadev/wsl-path.svg?branch=master)](https://travis-ci.org/mojadev/wsl-path)

# wsl-path

A small node utlity for converting file paths from POSIX paths in wsl (Windows Subsystem for Linux) to their counterparts in the Windows Filesystem and vice versa.

## How it works

This utility requires the wslpath CLI tool to be installed on the running machine and a wsl environment. Only the base drive letter (Windows) / mount folder (POSIX) is being translated into the windows world, the rest of the path is then appended in the correct form. Base path resolutions are cached, so only the first resolution causes wslpath to be called, while subsequent paths in the same drive/mount folder are resolved by the cache.

## Usage

The following examples are taken from the unit tests:

### windowsToWsl(path, options?)

Converts a windows path to a WSL (POSIX) path.

```
const correctPath = "C:\\Users";

const result = await windowsToWsl(correctPath);

expect(result).toEqual("/mnt/c/Users");
```

### wslToWindows(path, options?)
Converts a WSL (POSIX) Path to a windows path.

```
const mountedPath = "/mnt/c/Users";

const result = await wslToWindows(mountedPath);

expect(result).toEqual("C:\\Users");
```

## Resolving without wslpath

If you want to resolve without having wslpath (or without wanting to spawn a process calling it) you can provide your own cache in the options containing the base path resolution:

```
const windowsPath = "C:\\Users";

const result1 = await windowsToWsl(windowsPath, {
   basePathCache: { "C:\\": "/mnt/x" }
});

expect(result1).toEqual("/mnt/x/Users");
```

## Building and testing

Install packages:
`yarn install`

Build:
`yarn build`

Test:
`yarn test` or `yarn test --watch`

Integration Test, which does not mock wslpath:
`CALL_WSL_PROCESS=1 yarn test`

