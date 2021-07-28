import { IReadonlyDictionary, IReadonlyLookup } from "./generics"

export interface MutableDictionary<T> extends IReadonlyLookup<T>, IReadonlyDictionary<T> {
    add(key: string, value: T): void
}

export function createDictionary<T>(imp: { [key: string]: T }): MutableDictionary<T> {
    class Dictionary {
        private readonly imp: { [key: string]: T } = {}
        constructor() {
            this.imp = imp
        }
        public forEach(callback: (entry: T, key: string) => void): void {
            Object.keys(this.imp).sort().forEach(key => callback(this.imp[key], key))
        }
        // public map<RT>(callback: (entry: T, key: string) => RT): RawObject<RT> {
        //     const rt: astncore.RawObject<RT> = {}
        //     Object.keys(this.imp).sort().forEach(key => {
        //         rt[key] = callback(this.imp[key], key)
        //     })
        //     return rt
        // }
        public toArray<RT>(callback: (entry: T, key: string) => RT): RT[] {
            const rt: RT[] = []
            Object.keys(this.imp).sort().forEach(key => {
                rt.push(callback(this.imp[key], key))
            })
            return rt
        }
        // public filter<RT>(callback: (entry: T, key: string) => null | RT): astncore.IReadonlyDictionary<RT> {
        //     const rt: astncore.RawObject<RT> = {}
        //     Object.keys(this.imp).sort().forEach(key => {
        //         const result = callback(this.imp[key], key)
        //         if (result !== null) {
        //             rt[key] = result
        //         }
        //     })
        //     return createDictionary(rt)
        // }
        public add(key: string, value: T): void {
            this.imp[key] = value
        }
        public getUnsafe(key: string): T {
            const entry = this.imp[key]
            if (entry === undefined) {
                throw new Error(`no such entry: ${key}, options: ${Object.keys(this.imp).join(", ")}`)
            }
            return entry
        }
        public with<RT>(
            key: string,
            ifFound: (v: T) => RT,
            ifNotFound: (keys: string[]) => RT,
        ): RT {
            const entry = this.imp[key]
            if (entry === undefined) {
                return ifNotFound(Object.keys(this.imp).sort())
            }
            return ifFound(entry)
        }
        public get(key: string): T | null {
            const entry = this.imp[key]
            if (entry === undefined) {
                return null
            }
            return entry
        }
        public isEmpty(): boolean {
            return Object.keys(this.imp).length === 0
        }
        public getKeys(): string[] {
            return Object.keys(this.imp).sort()
        }
    }
    return new Dictionary()

}

export class Lookup<T> {
    private readonly imp: { [key: string]: T } = {}
    constructor(imp: { [key: string]: T }) {
        this.imp = imp
    }
    public add(key: string, value: T): void {
        this.imp[key] = value
    }
    public get(key: string): T {
        const entry = this.imp[key]
        if (entry === undefined) {
            throw new Error(`no such entry: ${key}, options: ${Object.keys(this.imp).join(", ")}`)
        }
        return entry
    }
}