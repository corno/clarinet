import { IReadonlyDictionary } from "../../../generics/interfaces/IReadonlyDictionary"
import { IReference } from "../../../generics/interfaces/IReference"


export type TypeReferenceDefinition = {
    readonly "type": IReference<TypeDefinition>
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
    readonly "properties": IReadonlyDictionary<ValueDefinition>
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
    readonly "types": IReadonlyDictionary<TypeDefinition>
    readonly "root type": IReference<TypeDefinition>
}

export type OptionDefinition = {
    readonly "value": ValueDefinition
}

export type TaggedUnionDefinition = {
    readonly "options": IReadonlyDictionary<OptionDefinition>
    readonly "default option": IReference<OptionDefinition>
}

export type SimpleStringDefinition = {
    readonly "default value": string
    readonly "quoted": boolean
}

export type MultiLineStringDefinition = {
}