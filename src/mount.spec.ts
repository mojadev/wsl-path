const mountResult = `
rootfs on / type lxfs (rw,noatime)
none on /dev type tmpfs (rw,noatime,mode=755)
sysfs on /sys type sysfs (rw,nosuid,nodev,noexec,noatime)
proc on /proc type proc (rw,nosuid,nodev,noexec,noatime)
devpts on /dev/pts type devpts (rw,nosuid,noexec,noatime,gid=5,mode=620)
none on /run type tmpfs (rw,nosuid,noexec,noatime,mode=755)
none on /run/lock type tmpfs (rw,nosuid,nodev,noexec,noatime)
none on /run/shm type tmpfs (rw,nosuid,nodev,noatime)
none on /run/user type tmpfs (rw,nosuid,nodev,noexec,noatime,mode=755)
binfmt_misc on /proc/sys/fs/binfmt_misc type binfmt_misc (rw,relatime)
cgroup on /sys/fs/cgroup type tmpfs (rw,relatime,mode=755)
cgroup on /sys/fs/cgroup/devices type cgroup (rw,relatime,devices)
C:\\ on /mnt/c type drvfs (rw,noatime,uid=1000,gid=1000,case=off)
D:\\ on /aux type drvfs (rw,noatime,uid=1000,gid=1000,case=off)
`
import {  execSync } from "child_process";
import { determineMountPoints } from "./mount";
jest.mock("child_process", () => ({
    execSync: jest.fn()
}));

describe.only("mount point detection", () => {
    beforeEach(() => {
        (execSync as any).mockImplementation((cmd: string) => {
            if (cmd.indexOf("mount") >= 0) {
                return mountResult;
            }
            return "";
        })
    });

    it("should return set the target for windows mount points", () => {
        const result = determineMountPoints("wsl").filter(x => x.target);

        expect(result.length).toEqual(2);
        expect(result[0]).toEqual({ src: '/mnt/c', target: 'C:\\' });
        expect(result[1]).toEqual({ src: '/aux', target: 'D:\\' });
    });


    it("should return a map with all known drvfs mount points", () => {
        const result = determineMountPoints("wsl");

        expect(result.length).toEqual(14);
    });

    it("should order the mount types by length, so the most precise one is on top", () => {
        const result = determineMountPoints("wsl");

        expect(result[0].src).toEqual("/proc/sys/fs/binfmt_misc")
        expect(result[13].src).toEqual("/")
    });


    it("should throw an error when getting mounti paths fails", () => {
        (execSync as any).mockImplementation(() => { throw new Error("Could not spawn process") });

        try {
            const result = determineMountPoints("wsl");
            fail("No error thrown");
        } catch (e) {
            expect(e).toEqual(new Error("Could not spawn process"))
        }

    });
})