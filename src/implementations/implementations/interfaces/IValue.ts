import { ISerializableDictionary } from "./ISerializableDictionary";
import { ISerializableList } from "./ISerializableList";

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