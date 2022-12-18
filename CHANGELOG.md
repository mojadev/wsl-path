# Changelog
## [3.0.1](https://github.com/mojadev/wsl-path/compare/v3.0.1...v3.0.1) (2022-12-18)


### Bug Fixes

* fix release-please ([f1911f3](https://github.com/mojadev/wsl-path/commit/f1911f3d4e4c329bf7c04804b7eb921c1af9bea7))

## [3.0.1](https://github.com/mojadev/wsl-path/compare/v3.0.1...v3.0.1) (2022-12-18)


### Bug Fixes

* fix release-please ([f1911f3](https://github.com/mojadev/wsl-path/commit/f1911f3d4e4c329bf7c04804b7eb921c1af9bea7))

## [3.0.1](https://github.com/mojadev/wsl-path/compare/3.0.0...v3.0.1) (2022-12-18)


### Bug Fixes

* fix release-please ([f1911f3](https://github.com/mojadev/wsl-path/commit/f1911f3d4e4c329bf7c04804b7eb921c1af9bea7))
* fix wrong mount point being cached in wsl2 ([c8ae2d7](https://github.com/mojadev/wsl-path/commit/c8ae2d7e7cfe88ca3b483eef90eff6750a03dc50))


### Miscellaneous Chores

* release 2.0.0 ([99ac229](https://github.com/mojadev/wsl-path/commit/99ac2292a4d2d7ad8cce0a42eb34dc8bb8a108f9))
* release 3.0.1 ([8d76972](https://github.com/mojadev/wsl-path/commit/8d769727061ce84a410680a1b7bed8e4a4712575))
* update actions. ([9e35b36](https://github.com/mojadev/wsl-path/commit/9e35b36f0b2e064cebe9a9c4a400405360af86ae))

## [3.0.1](https://github.com/mojadev/wsl-path/compare/3.0.0...v3.0.1) (2022-12-18)


### Miscellaneous Chores

* release 2.0.0 ([99ac229](https://github.com/mojadev/wsl-path/commit/99ac2292a4d2d7ad8cce0a42eb34dc8bb8a108f9))
* release 3.0.1 ([8d76972](https://github.com/mojadev/wsl-path/commit/8d769727061ce84a410680a1b7bed8e4a4712575))
* update actions. ([9e35b36](https://github.com/mojadev/wsl-path/commit/9e35b36f0b2e064cebe9a9c4a400405360af86ae))

## v3.0.0

- Tested with WSL2 (no changes required). Didn't encounter any issues, let me know if you do
- Dendency updates

No breaking changes in wsl-path, but I updated the libraries, which reported some. I rather play
safe and go for a major update here. 

## v2.0.0

- Detect mount points and allow custom default mount paths (not in /mnt/c/) in wsl environment
