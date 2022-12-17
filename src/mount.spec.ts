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
`;

const mountResultWSL2 = `
/dev/sdb on / type ext4 (rw,relatime,discard,errors=remount-ro,data=ordered)
tmpfs on /mnt/wsl type tmpfs (rw,relatime)
tools on /init type 9p (ro,relatime,dirsync,aname=tools;fmask=022,loose,access=client,trans=fd,rfd=6,wfd=6)
none on /dev type devtmpfs (rw,nosuid,relatime,size=6485592k,nr_inodes=1621398,mode=755)
sysfs on /sys type sysfs (rw,nosuid,nodev,noexec,noatime)
proc on /proc type proc (rw,nosuid,nodev,noexec,noatime)
devpts on /dev/pts type devpts (rw,nosuid,noexec,noatime,gid=5,mode=620,ptmxmode=000)
none on /run type tmpfs (rw,nosuid,noexec,noatime,mode=755)
none on /run/lock type tmpfs (rw,nosuid,nodev,noexec,noatime)
none on /run/shm type tmpfs (rw,nosuid,nodev,noatime)
none on /run/user type tmpfs (rw,nosuid,nodev,noexec,noatime,mode=755)
binfmt_misc on /proc/sys/fs/binfmt_misc type binfmt_misc (rw,relatime)
tmpfs on /sys/fs/cgroup type tmpfs (rw,nosuid,nodev,noexec,relatime,mode=755)
drivers on /usr/lib/wsl/drivers type 9p (ro,nosuid,nodev,noatime,dirsync,aname=drivers;fmask=222;dmask=222,mmap,access=client,msize=65536,trans=fd,rfd=4,wfd=4)
lib on /usr/lib/wsl/lib type 9p (ro,nosuid,nodev,noatime,dirsync,aname=lib;fmask=222;dmask=222,mmap,access=client,msize=65536,trans=fd,rfd=4,wfd=4)
cgroup2 on /sys/fs/cgroup/unified type cgroup2 (rw,nosuid,nodev,noexec,relatime,nsdelegate)
cgroup on /sys/fs/cgroup/cpuset type cgroup (rw,nosuid,nodev,noexec,relatime,cpuset)
cgroup on /sys/fs/cgroup/cpu type cgroup (rw,nosuid,nodev,noexec,relatime,cpu)
cgroup on /sys/fs/cgroup/cpuacct type cgroup (rw,nosuid,nodev,noexec,relatime,cpuacct)
cgroup on /sys/fs/cgroup/blkio type cgroup (rw,nosuid,nodev,noexec,relatime,blkio)
cgroup on /sys/fs/cgroup/memory type cgroup (rw,nosuid,nodev,noexec,relatime,memory)
cgroup on /sys/fs/cgroup/devices type cgroup (rw,nosuid,nodev,noexec,relatime,devices)
cgroup on /sys/fs/cgroup/freezer type cgroup (rw,nosuid,nodev,noexec,relatime,freezer)
cgroup on /sys/fs/cgroup/net_cls type cgroup (rw,nosuid,nodev,noexec,relatime,net_cls)
cgroup on /sys/fs/cgroup/perf_event type cgroup (rw,nosuid,nodev,noexec,relatime,perf_event)
cgroup on /sys/fs/cgroup/net_prio type cgroup (rw,nosuid,nodev,noexec,relatime,net_prio)
cgroup on /sys/fs/cgroup/hugetlb type cgroup (rw,nosuid,nodev,noexec,relatime,hugetlb)
cgroup on /sys/fs/cgroup/pids type cgroup (rw,nosuid,nodev,noexec,relatime,pids)
cgroup on /sys/fs/cgroup/rdma type cgroup (rw,nosuid,nodev,noexec,relatime,rdma)
C:\\ on /mnt/c type 9p (rw,noatime,dirsync,aname=drvfs;path=C:\\;uid=1000;gid=1000;symlinkroot=/mnt/,mmap,access=client,msize=65536,trans=fd,rfd=8,wfd=8)

`;

import { execSync } from "child_process";
import { determineMountPoints } from "./mount";
jest.mock("child_process", () => ({
  execSync: jest.fn(),
}));

describe("mount point detection", () => {
  let isWSL2 = false;

  beforeEach(() => {
    isWSL2 = false;
    (execSync as any).mockImplementation((cmd: string) => {
      if (cmd.indexOf("mount") >= 0) {
        return isWSL2 ? mountResultWSL2 : mountResult;
      }
      return "";
    });
  });

  it("should return set the target for windows mount points", () => {
    const result = determineMountPoints("wsl").filter((x) => x.target);

    expect(result.length).toEqual(2);
    expect(result[0]).toEqual({ src: "/mnt/c", target: "C:\\" });
    expect(result[1]).toEqual({ src: "/aux", target: "D:\\" });
  });

  it("should return set the target for windows mount points (WSL 2)", () => {
    isWSL2 = true;
    const result = determineMountPoints("wsl").filter((x) => x.target);

    expect(result.length).toEqual(4);
    expect(result[0]).toEqual({
      src: "/usr/lib/wsl/drivers",
      target: "drivers",
    });
    expect(result[1]).toEqual({ src: "/usr/lib/wsl/lib", target: "lib" });
    expect(result[2]).toEqual({ src: "/mnt/c", target: "C:\\" });
    expect(result[3]).toEqual({ src: "/init", target: "tools" });
  });

  it("should return a map with all known drvfs mount points", () => {
    const result = determineMountPoints("wsl");

    expect(result.length).toEqual(14);
  });

  it("should order the mount types by length, so the most precise one is on top", () => {
    const result = determineMountPoints("wsl");

    expect(result[0].src).toEqual("/proc/sys/fs/binfmt_misc");
    expect(result[13].src).toEqual("/");
  });

  it("should throw an error when getting mount paths fails", () => {
    (execSync as any).mockImplementation(() => {
      throw new Error("Could not spawn process");
    });

    try {
      const result = determineMountPoints("wsl");
      fail("No error thrown");
    } catch (e) {
      expect(e).toEqual(new Error("Could not spawn process"));
    }
  });
});
