export interface ISerializableDictionary<Value> {
    forEach(callback: (entry: Value, key: string) => void): void
    isEmpty: () => boolean
}

export interface ISerializableList<Value> {
    forEach(callback: (element: Value) => void): void
    isEmpty: () => boolean
}
export interface ISerializableValue {
    toDictionary(callback: ($: {
        entries: ISerializableDictionary<ISerializableValue>
    }) => void): void
    toGroup(callback: ($: {
        onProperty(key: string, callback: ($: ISerializableValue) => void): void
    }) => void): void
    toList(callback: ($: {
        elements: ISerializableList<ISerializableValue>
    }) => void): void
    toTaggedUnion(callback: ($: {
        option: string
        value: ISerializableValue
    }) => void): void
    toSimpleString(callback: ($: string) => void): void
    toMultilineString(callback: ($: string[]) => void): void
}
export interface ISerializableDataset {
    root: ISerializableValue
}