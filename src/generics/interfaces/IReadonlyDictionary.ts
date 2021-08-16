import { IReadonlyLookup } from "./IReadonlyLookup"

export interface IReadonlyDictionary<T> {
    forEach(callback: (entry: T, key: string) => void): void
    getLookup: () => IReadonlyLookup<T>
}