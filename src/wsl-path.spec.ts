import {
  windowsToWsl,
  wslToWindows,
  resetCache,
  wslToWindowsSync,
  windowsToWslSync,
  _setForceRunInWsl,
} from "./wsl-path";
import { exec, execSync } from "child_process";
import { ERROR_FILEPATH_MUST_BE_ABSOLUTE } from "./path-handling";

const DEFAULT_OPTIONS = { mountPoints: [{ src: "/mnt/c", target: "C:\\" }] };
jest.mock("child_process", () => ({
  exec: jest.fn(),
  execSync: jest.fn(),
}));

describe("WslPath utility", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    resetCache();
    mockProcessResult(null, "?");
    _setForceRunInWsl(true);
  });

  afterEach(() => {
    _setForceRunInWsl(false);
  });

  it("should throw an error on windowsToWsl when the path cannot be resolved", async () => {
    expect.assertions(1);
    const wrongPath = "X\\something";
    try {
      await windowsToWsl(wrongPath, { ...DEFAULT_OPTIONS });
    } catch (e) {
      expect(e).toEqual(Error(ERROR_FILEPATH_MUST_BE_ABSOLUTE));
    }
  });

  it("should resolve a valid windows path to a POSIX path with windowsToWslfrom the wsl context", async () => {
    const correctPath = "C:\\Users";
    mockProcessResult("/mnt/c   ");

    const result = await windowsToWsl(correctPath, { ...DEFAULT_OPTIONS });

    expect(result).toEqual("/mnt/c/Users");
  });

  it("should resolve a valid nested windows path to a POSIX path with windowsToWslfrom the wsl context", async () => {
    const correctPath = "C:\\Users\\Test";
    mockProcessResult("/mnt/c   ");

    const result = await windowsToWsl(correctPath, { ...DEFAULT_OPTIONS });

    expect(result).toEqual("/mnt/c/Users/Test");
  });

  it("should be able to resolve wsl paths that are under the \\\\wsl$\\ network share", async () => {
    const wrongLinuxPath = "/home/user/myFile.txt";
    mockProcessResult("\\\\wsl$\\Ubuntu\\home\\user   ");

    const result = await wslToWindows(wrongLinuxPath, { ...DEFAULT_OPTIONS });

    expect(result).toEqual("\\\\wsl$\\Ubuntu\\home\\user\\myFile.txt");
  });

  it("should resolve valid wsl paths to windows paths", async () => {
    const mountedPath = "/mnt/c/Users";
    mockProcessResult("C:\\ ");

    const result = await wslToWindows(mountedPath, { ...DEFAULT_OPTIONS });

    expect(result).toEqual("C:\\Users");
  });

  it("should resolve valid nested wsl paths to windows paths", async () => {
    const mountedPath = "/mnt/c/Users/Test";
    mockProcessResult("C:\\ ");

    const result = await wslToWindows(mountedPath, { ...DEFAULT_OPTIONS });

    expect(result).toEqual("C:\\Users\\Test");
  });

  it("should resolve a valid windows path to a POSIX path with windowsToWslfrom the wsl context with the sync api", () => {
    const correctPath = "C:\\Users";
    mockProcessResult("/mnt/c   ");

    const result = windowsToWslSync(correctPath, { ...DEFAULT_OPTIONS });

    expect(result).toEqual("/mnt/c/Users");
  });

  it("should resolve valid wsl paths to windows paths with the sync api", () => {
    const mountedPath = "/mnt/c/Users";
    mockProcessResult("C:\\ ");

    const result = wslToWindowsSync(mountedPath, { ...DEFAULT_OPTIONS });

    expect(result).toEqual("C:\\Users");
  });

  it("should retrieve results from the cache as soon as the base path has been resolved (posix -> windows) ", async () => {
    const mountedPath1 = "/mnt/c/Users";
    const mountedPath2 = "/mnt/c/Test";
    mockProcessResult("C:\\ ");

    const result1 = await wslToWindows(mountedPath1, { ...DEFAULT_OPTIONS });
    const result2 = await wslToWindows(mountedPath2, { ...DEFAULT_OPTIONS });

    expect(result1).toEqual("C:\\Users");
    expect(result2).toEqual("C:\\Test");
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it("should not results from the cache when not requesting from a windows mount", async () => {
    const mountedPath1 = "/usr/bin/test";
    const mountedPath2 = "/usr/bin/test2";
    mockProcessResult("\\wsl$\\usr\\bin ");

    await wslToWindows(mountedPath1, { ...DEFAULT_OPTIONS });
    await wslToWindows(mountedPath2, { ...DEFAULT_OPTIONS });

    expect(exec).toHaveBeenCalledTimes(2);
  });

  it("should retrieve results from the cache as soon as the base path has been resolved (windows -> posix -> windows) ", async () => {
    const mountedPath1 = "C:\\Users";
    const mountedPath2 = "C:\\Test";
    mockProcessResult("/mnt/c/");

    const result1 = await windowsToWsl(mountedPath1, { ...DEFAULT_OPTIONS });
    const result2 = await windowsToWsl(mountedPath2, { ...DEFAULT_OPTIONS });

    expect(result1).toEqual("/mnt/c/Users");
    expect(result2).toEqual("/mnt/c/Test");
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it("should allow to overwrite the path resolution using the cache options", async () => {
    const windowsPath = "C:\\Users";
    mockProcessResult("/mnt/x");

    const result1 = await windowsToWsl(windowsPath, {
      basePathCache: { "wsl:C:\\": "/mnt/x" },
      wslCommand: "wsl",
      ...DEFAULT_OPTIONS,
    });

    expect(result1).toEqual("/mnt/x/Users");
  });

  it("should run in a wsl shell for windows users", async () => {
    _setForceRunInWsl(true);
    const windowsPath = "C:\\Users";
    mockProcessResult("/mnt/x");

    await windowsToWsl(windowsPath);

    expect((exec as any).mock.calls[0][0]).toEqual("wsl wslpath  C:\\\\");
  });

  it("should allow to set a custom wsl environment when calling", async () => {
    _setForceRunInWsl(true);
    const windowsPath = "C:\\Users";
    mockProcessResult("/mnt/x");

    await windowsToWsl(windowsPath, { wslCommand: "ubuntu run" });

    expect((exec as any).mock.calls[0][0]).toEqual(
      "ubuntu run wslpath  C:\\\\"
    );
  });

  it("should return the same path for results that have been resolved during runtime and results from the cache", async () => {
    const windowsPath = "C:\\Users\\someUser\\Documents\\path.txt";
    mockProcessResult("/mnt/c");
    const cache = {};

    const resolveParams = {
      basePathCache: cache,
      wslCommand: "wsl",
      ...DEFAULT_OPTIONS,
    };

    const result1 = await windowsToWsl(windowsPath, resolveParams);
    const result2 = await windowsToWsl(windowsPath, resolveParams);
    expect(result2).toEqual(result1);
  });
});

function mockProcessResult(
  stdout: string | null,
  stderr: string | null = null,
  err: string | null = null
) {
  if (process.env.CALL_WSL_PROCESS) {
    (execSync as any).mockImplementation((_: string) =>
      jest.requireActual("child_process").execSync(_)
    );
    (exec as any).mockImplementation((_: string, callback: ExecCallback) =>
      jest.requireActual("child_process").exec(_, callback)
    );
    return;
  }
  (execSync as any).mockImplementation((_: string) => {
    if (stdout) {
      return stdout;
    }
    throw stderr || err;
  });
  (exec as any).mockImplementation((_: string, callback: ExecCallback) =>
    callback(err, stdout, stderr)
  );
}

type ExecCallback = (
  err: string | null,
  stdout: string | null,
  stderr: string | null
) => void;
