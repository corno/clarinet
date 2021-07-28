import { IReadonlyDictionary } from "./generics"

export interface DictionaryBuilder<T> {
    add(key: string, value: T): void
    toDictionary(): IReadonlyDictionary<T>
}

export function createDictionary<T>(): DictionaryBuilder<T> {
    const imp: { [key: string]: T } = {}
    return {
        add: (key: string, value: T) => {
            imp[key] = value
        },
        toDictionary: () => {
            class Dictionary {
                constructor() {
                }
                public forEach(callback: (entry: T, key: string) => void): void {
                    Object.keys(imp).sort().forEach(key => callback(imp[key], key))
                }
                public getUnsafe(key: string): T {
                    const entry = imp[key]
                    if (entry === undefined) {
                        throw new Error(`no such entry: ${key}, options: ${Object.keys(imp).join(", ")}`)
                    }
                    return entry
                }
                public with<RT>(
                    key: string,
                    ifFound: (v: T) => RT,
                    ifNotFound: (keys: string[]) => RT,
                ): RT {
                    const entry = imp[key]
                    if (entry === undefined) {
                        return ifNotFound(Object.keys(imp).sort())
                    }
                    return ifFound(entry)
                }
            }
            return new Dictionary()
        },
    }
}