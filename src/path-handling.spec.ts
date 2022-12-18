import {
  parsePosixPath,
  ERROR_FILEPATH_MUST_BE_ABSOLUTE,
  parseWindowsPath,
  joinPath,
} from "./path-handling";

const DEFAULT_MOUNT_POINT = [{ src: "/mnt/c", target: "C:\\" }];

describe("Path handling", () => {
  describe("parsePosixPath", () => {
    it("should split a up a POSIX path into the mount point and rest of path", () => {
      const validPosixPath = "/mnt/c/Users/Bob";

      const [base, restOfPath] = parsePosixPath(
        validPosixPath,
        DEFAULT_MOUNT_POINT
      );

      expect(base).toEqual("/mnt/c");
      expect(restOfPath).toEqual("/Users/Bob");
    });

    it("should use the full path when the path is not in the mount paths ", () => {
      const posixPath = "/home/bob";

      const [base, restOfPath] = parsePosixPath(posixPath, DEFAULT_MOUNT_POINT);

      expect(base).toEqual("/home");
      expect(restOfPath).toEqual("bob");
    });
  });

  describe("parseWindowsPath", () => {
    it("should split a up a Windows path into the mount point and rest of path", () => {
      const validWindowPath = "C:\\Users\\Bob";

      const [base, restOfPath] = parseWindowsPath(validWindowPath, []);

      expect(base).toEqual("C:\\");
      expect(restOfPath).toEqual("Users\\Bob");
    });

    it("should throw an error when a path is not absolute ", () => {
      const invalidWindowsPath = "Users\\Bob";
      expect.assertions(1);

      try {
        parseWindowsPath(invalidWindowsPath, []);
      } catch (e) {
        expect(e).toEqual(Error(ERROR_FILEPATH_MUST_BE_ABSOLUTE));
      }
    });
  });

  describe("joinPath", () => {
    it("joins POSIX paths and normalizes them", () => {
      const joined = joinPath("/mnt/c", "Users/Bob ");

      expect(joined).toEqual("/mnt/c/Users/Bob");
    });

    it("joins windows  paths and normalizes them", () => {
      const joined = joinPath("C:\\", "Users\\Bob ", true);

      expect(joined).toEqual("C:\\Users\\Bob");
    });
  });
});
