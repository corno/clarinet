
export interface IReadonlyLookup<T> {
    getUnsafe(key: string): T
    with<RT>(
        key: string,
        ifExists: (v: T) => RT,
        ifNotExists: (keys: string[]) => RT
    ): RT
}