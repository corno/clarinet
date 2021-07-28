export type RawObject<T> = { [key: string]: T }

export interface IReadonlyLookup<T> {
    getUnsafe(key: string): T
    get(key: string): T | null
    getKeys(): string[]
    with<RT>(
        key: string,
        ifExists: (v: T) => RT,
        ifNotExists: (keys: string[]) => RT
    ): RT
}

export interface IReadonlyDictionary<T> {
    forEach(callback: (entry: T, key: string) => void): void
}