# Changelog

## [4.0.0](https://github.com/mojadev/wsl-path/compare/v3.0.4...v4.0.0) (2022-12-26)


### Miscellaneous Chores

* update versions ([dc2c517](https://github.com/mojadev/wsl-path/commit/dc2c517123b8842879603392e85a05baf371dc51))

## [3.0.4](https://github.com/mojadev/wsl-path/compare/v3.0.3...v3.0.4) (2022-12-25)


### Bug Fixes

* fix build ignoring src ([883c1d8](https://github.com/mojadev/wsl-path/commit/883c1d807c431f921d191e2f3e19f098ffa2d8ee))

## [3.0.3](https://github.com/mojadev/wsl-path/compare/v3.0.2...v3.0.3) (2022-12-25)


### Bug Fixes

* bundle typescript types ([d0945a7](https://github.com/mojadev/wsl-path/commit/d0945a7468f6010210706b81ced09197dfe682c1))

## [3.0.2](https://github.com/mojadev/wsl-path/compare/v3.0.1...v3.0.2) (2022-12-18)


### Bug Fixes

* do not publish whole repository automatically ([1bbd3f5](https://github.com/mojadev/wsl-path/commit/1bbd3f5eedccf384cc4da26388ffae1640141aee))
* fix release-please ([f1911f3](https://github.com/mojadev/wsl-path/commit/f1911f3d4e4c329bf7c04804b7eb921c1af9bea7))


### Miscellaneous Chores

* release 3.0.2 ([9a48cc7](https://github.com/mojadev/wsl-path/commit/9a48cc7490a11d9a7daf30b224cad2676267ee87))

## [3.0.1](https://github.com/mojadev/wsl-path/compare/v3.0.1...v3.0.1) (2022-12-18)

- fix release-please ([f1911f3](https://github.com/mojadev/wsl-path/commit/f1911f3d4e4c329bf7c04804b7eb921c1af9bea7))
- fix wrong mount point being cached in wsl2 ([c8ae2d7](https://github.com/mojadev/wsl-path/commit/c8ae2d7e7cfe88ca3b483eef90eff6750a03dc50))

## v3.0.0

- Tested with WSL2 (no changes required). Didn't encounter any issues, let me know if you do
- Dendency updates

No breaking changes in wsl-path, but I updated the libraries, which reported some. I rather play
safe and go for a major update here.

## v2.0.0

- Detect mount points and allow custom default mount paths (not in /mnt/c/) in wsl environment
