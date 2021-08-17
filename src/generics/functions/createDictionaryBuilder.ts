import { IDictionaryBuilder } from "../interfaces/IDictionaryBuilder"

export function createDictionaryBuilder<T>(): IDictionaryBuilder<T> {
    const imp: { [key: string]: T } = {}
    return {
        add: (key: string, value: T) => {
            imp[key] = value
        },
        toDictionary: () => {
            return {
                forEach: (callback: (entry: T, key: string) => void): void => {
                    Object.keys(imp).sort().forEach(key => callback(imp[key], key))
                },
                getLookup: () => {
                    return {
                        getUnsafe: (key: string): T => {
                            const entry = imp[key]
                            if (entry === undefined) {
                                throw new Error(`no such entry: ${key}, options: ${Object.keys(imp).join(", ")}`)
                            }
                            return entry
                        },
                        with: <RT>(
                            key: string,
                            ifFound: (v: T) => RT,
                            ifNotFound: (keys: string[]) => RT,
                        ): RT => {
                            const entry = imp[key]
                            if (entry === undefined) {
                                return ifNotFound(Object.keys(imp).sort())
                            }
                            return ifFound(entry)
                        },

                    }
                },
            }
        },
    }
}