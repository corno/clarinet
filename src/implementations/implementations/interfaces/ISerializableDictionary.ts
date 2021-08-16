
export interface ISerializableDictionary<Value> {
    forEach(callback: (entry: Value, key: string) => void): void
    isEmpty: () => boolean
}
