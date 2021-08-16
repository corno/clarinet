
import * as def from "../../../generics"

export type TypeReferenceDefinition = {
    readonly "type": def.IReference<TypeDefinition>
}

export type TypeDefinition = {
    readonly "value": ValueDefinition
}

export type DictionaryDefinition = {
    readonly "key": SimpleStringDefinition
    readonly "value": ValueDefinition
}

export type ListDefinition = {
    readonly "value": ValueDefinition
}

export type GroupDefinition = {
    readonly "properties": def.IReadonlyDictionary<ValueDefinition>
}

export type ValueDefinition = {
    readonly "type": ValueTypeDefinition
}

export type ValueTypeDefinition =
    | ["group", GroupDefinition]
    | ["dictionary", DictionaryDefinition]
    | ["list", ListDefinition]
    | ["type reference", TypeReferenceDefinition]
    | ["tagged union", TaggedUnionDefinition]
    | ["simple string", SimpleStringDefinition]
    | ["multiline string", MultiLineStringDefinition]

export type Schema = {
    readonly "types": def.IReadonlyDictionary<TypeDefinition>
    readonly "root type": def.IReference<TypeDefinition>
}

export type OptionDefinition = {
    readonly "value": ValueDefinition
}

export type TaggedUnionDefinition = {
    readonly "options": def.IReadonlyDictionary<OptionDefinition>
    readonly "default option": def.IReference<OptionDefinition>
}

export type SimpleStringDefinition = {
    readonly "default value": string
    readonly "quoted": boolean
}

export type MultiLineStringDefinition = {
}