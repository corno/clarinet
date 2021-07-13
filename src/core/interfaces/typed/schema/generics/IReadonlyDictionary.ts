export type RawObject<T> = { [key: string]: T }

export interface IReadonlyLookup<T> {
    getUnsafe(key: string): T
    /**
     * @deprecated
     */
    get(key: string): T | null
    /**
     * @deprecated
     */
    getKeys(): string[]
    with<RT>(
        key: string,
        ifExists: (v: T) => RT,
        ifNotExists: (keys: string[]) => RT
    ): RT
}

export interface IReadonlyDictionary<T> extends IReadonlyLookup<T> {
    forEach(callback: (entry: T, key: string) => void): void
}