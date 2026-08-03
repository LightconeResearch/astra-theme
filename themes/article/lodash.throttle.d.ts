declare module 'lodash.throttle' {
  const throttle: <T extends (...args: any[]) => any>(
    callback: T,
    wait?: number,
    options?: { leading?: boolean; trailing?: boolean },
  ) => T & { cancel(): void; flush(): ReturnType<T> };
  export default throttle;
}
