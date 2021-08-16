
export interface ISerializableList<Value> {
    forEach(callback: (element: Value) => void): void
    isEmpty: () => boolean
}