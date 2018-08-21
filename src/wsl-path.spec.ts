import {
  windowsToWsl,
  wslToWindows,
  resetCache,
  wslToWindowsSync,
  windowsToWslSync
} from "./wsl-path";
import { exec, execSync } from "child_process";
import { ERROR_FILEPATH_MUST_BE_ABSOLUTE, WRONG_POSIX_PATH_ROOT } from "./path-handling";

jest.mock("child_process", () => ({
  exec: jest.fn(),
  execSync: jest.fn()
}));

describe("WslPath utility", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    resetCache();
    mockProcessResult(null, "?");
  });

  it("should throw an error on windowsToWsl when the path cannot be resolved", async () => {
    expect.assertions(1);
    const wrongPath = "X\\something";
    try {
      await windowsToWsl(wrongPath);
    } catch (e) {
      expect(e).toEqual(Error(ERROR_FILEPATH_MUST_BE_ABSOLUTE));
    }
  });

  it("should resolve a valid windows path to a POSIX path with windowsToWslfrom the wsl context", async () => {
    const correctPath = "C:\\Users";
    mockProcessResult("/mnt/c   ");

    const result = await windowsToWsl(correctPath);

    expect(result).toEqual("/mnt/c/Users");
  });

  it("should throw an error when a non /mnt/* linux path is provided in wslToWindows", async () => {
    const wrongLinuxPath = "/home/user/myFile.tx";
    expect.assertions(1);

    try {
      await wslToWindows(wrongLinuxPath);
    } catch (e) {
      expect(e).toEqual(Error(WRONG_POSIX_PATH_ROOT));
    }
  });

  it("should resolve valid wsl paths to windows paths", async () => {
    const mountedPath = "/mnt/c/Users";
    mockProcessResult("C:\\ ");

    const result = await wslToWindows(mountedPath);

    expect(result).toEqual("C:\\Users");
  });


  it("should resolve a valid windows path to a POSIX path with windowsToWslfrom the wsl context with the sync api", () => {
    const correctPath = "C:\\Users";
    mockProcessResult("/mnt/c   ");

    const result =  windowsToWslSync(correctPath);

    expect(result).toEqual("/mnt/c/Users");
  });

  it("should resolve valid wsl paths to windows paths with the sync api", () => {
    const mountedPath = "/mnt/c/Users";
    mockProcessResult("C:\\ ");

    const result = wslToWindowsSync(mountedPath);

    expect(result).toEqual("C:\\Users");
  });

  it("should reject on unknown paths for wslToWindows", async () => {
    const mountedPath = "/mnt/J/Users";
    mockProcessResult(null, "Command failed: wslpath -w ....");

    expect.assertions(1);

    try {
      await wslToWindows(mountedPath);
    } catch (e) {
      expect(String(e)).toMatch(/Command failed: wslpath -w /);
    }
  });

  it("should retrieve results from the cache as soon as the base path has been resolved (posix -> windows) ", async () => {
    const mountedPath1 = "/mnt/c/Users";
    const mountedPath2 = "/mnt/c/Test";
    mockProcessResult("C:\\ ");

    const result1 = await wslToWindows(mountedPath1);
    const result2 = await wslToWindows(mountedPath2);

    expect(result1).toEqual("C:\\Users");
    expect(result2).toEqual("C:\\Test");
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it("should retrieve results from the cache as soon as the base path has been resolved (windows -> posix -> windows) ", async () => {
    const mountedPath1 = "C:\\Users";
    const mountedPath2 = "C:\\Test";
    mockProcessResult("/mnt/c/");

    const result1 = await windowsToWsl(mountedPath1);
    const result2 = await windowsToWsl(mountedPath2);

    expect(result1).toEqual("/mnt/c/Users");
    expect(result2).toEqual("/mnt/c/Test");
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it("should allow to overwrite the path resolution using the cache options", async () => {
    const windowsPath = "C:\\Users";
    mockProcessResult("/mnt/x");

    const result1 = await windowsToWsl(windowsPath, {
      basePathCache: { "C:\\": "/mnt/x" }
    });

    expect(result1).toEqual("/mnt/x/Users");
  });
});

function mockProcessResult(
  stdout: string | null,
  stderr: string | null = null,
  err: string | null = null
) {
  if (process.env.CALL_WSL_PROCESS) {
    (execSync as any).mockImplementation((_: string) =>
      require.requireActual("child_process").execSync(_)
    );
    (exec as any).mockImplementation((_: string, callback: ExecCallback) =>
      require.requireActual("child_process").exec(_, callback)
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
