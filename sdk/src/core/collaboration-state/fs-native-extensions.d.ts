declare module "fs-native-extensions" {
  /** Non-blocking whole-file exclusive lock. False means actual contention. */
  export function tryLock(fd: number): boolean;
}
