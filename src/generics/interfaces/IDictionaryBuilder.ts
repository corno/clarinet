import { IReadonlyDictionary } from "./IReadonlyDictionary";

export interface IDictionaryBuilder<T> {
    add(key: string, value: T): void
    toDictionary(): IReadonlyDictionary<T>
}