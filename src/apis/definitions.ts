import * as g from "../generics"

/**
 * this set of types defines a schema that only describes the data structure,
 * not any additional validation rules to which a dataset should confirm.
 */

export type TypeReference = {
    readonly "type": g.IReference<TypeDefinition>
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
    readonly "properties": g.IReadonlyDictionary<ValueDefinition>
}

export type ValueDefinition = {
    readonly "type": ValueTypeDefinition
}

export type ValueTypeDefinition =
    | ["group", GroupDefinition]
    | ["dictionary", DictionaryDefinition]
    | ["list", ListDefinition]
    | ["type reference", TypeReference]
    | ["tagged union", TaggedUnionDefinition]
    | ["simple string", SimpleStringDefinition]
    | ["multiline string", MultiLineStringDefinition]

export type Schema = {
    readonly "types": g.IReadonlyDictionary<TypeDefinition>
    readonly "root type": g.IReference<TypeDefinition>
}

export type OptionDefinition = {
    readonly "value": ValueDefinition
}

export type TaggedUnionDefinition = {
    readonly "options": g.IReadonlyDictionary<OptionDefinition>
    readonly "default option": g.IReference<OptionDefinition>
}

export type SimpleStringDefinition = {
    readonly "default value": string
    readonly "quoted": boolean
}

export type MultiLineStringDefinition = {
}
