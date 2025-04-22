/* eslint-disable @typescript-eslint/no-explicit-any */
import { Buffer } from 'buffer';

(window as any).global = window;
(window as any).process = {
    env: { DEBUG: undefined },
    version: '',
    nextTick: (fn: () => void) => Promise.resolve().then(() => fn()),
    title: '',
    browser: true,
    argv: [],
    platform: '',
    release: {},
};
(window as any).Buffer = Buffer;
(window as any).setImmediate = (fn: () => void) => setTimeout(fn, 0);