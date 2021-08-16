import * as def from "../types/definitions"
import * as tokens from "../../treeParser/types/tokens"

export interface GroupHandler<TokenAnnotation, NonTokenAnnotation> {
    onUnexpectedProperty($: {
        token: tokens.SimpleStringToken<TokenAnnotation> //cannot be shorthand, so there must be a token, so no null
        expectedProperties: string[]
        groupDefinition: def.GroupDefinition
    }): void
    onProperty($: {
        key: string
        token: null | tokens.SimpleStringToken<TokenAnnotation>
        definition: def.ValueDefinition
    }): TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
    onClose($: {
        token: null | tokens.CloseObjectToken<TokenAnnotation>
    }): void
}

export interface DictionaryHandler<TokenAnnotation, NonTokenAnnotation> {
    onEntry($: {
        token: tokens.SimpleStringToken<TokenAnnotation>
    }): TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
    onClose($: {
        token: null | tokens.CloseObjectToken<TokenAnnotation>
    }): void
}

export interface ListHandler<TokenAnnotation, NonTokenAnnotation> {
    onClose($: {
        token: null | tokens.CloseArrayToken<TokenAnnotation>
    }): void
    onElement($: {
        annotation: NonTokenAnnotation
    }): TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
}

export interface TypedTaggedUnionHandler<TokenAnnotation, NonTokenAnnotation> {
    onOption($: {
        name: string
        token: null | tokens.SimpleStringToken<TokenAnnotation>
        definition: def.OptionDefinition
    }): TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
    onUnexpectedOption($: {
        token: tokens.SimpleStringToken<TokenAnnotation>
        expectedOptions: string[]
        defaultOption: string //the unmarshaller will initialize the default option.
    }): TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
    onEnd($: {
        annotation: NonTokenAnnotation
    }): void
}

export type GroupType<TokenAnnotation> =
    | ["verbose", tokens.OpenObjectToken<TokenAnnotation>]
    | ["shorthand", tokens.OpenArrayToken<TokenAnnotation>]
    | ["mixin"]
    | ["omitted"]

export interface TypedValueHandler<TokenAnnotation, NonTokenAnnotation> {
    onGroup($: {
        type: GroupType<TokenAnnotation>
        definition: def.GroupDefinition
    }): GroupHandler<TokenAnnotation, NonTokenAnnotation>
    onList($: {
        token: null | tokens.OpenArrayToken<TokenAnnotation>
        definition: def.ListDefinition
    }): ListHandler<TokenAnnotation, NonTokenAnnotation>
    onDictionary($: {
        token: null | tokens.OpenObjectToken<TokenAnnotation>
        definition: def.DictionaryDefinition
    }): DictionaryHandler<TokenAnnotation, NonTokenAnnotation>
    onTypeReference($: {
        definition: def.TypeReferenceDefinition
    }): TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
    onTaggedUnion($: {
        definition: def.TaggedUnionDefinition
        token: null | tokens.TaggedUnionToken<TokenAnnotation>
    }): TypedTaggedUnionHandler<TokenAnnotation, NonTokenAnnotation>
    onSimpleString($: {
        value: string
        token: null | tokens.SimpleStringToken<TokenAnnotation>
        definition: def.SimpleStringDefinition
    }): void
    onMultilineString($: {
        token: null | tokens.MultilineStringToken<TokenAnnotation>
        definition: def.MultiLineStringDefinition
    }): void
}

export interface ITypedTreeHandler<TokenAnnotation, NonTokenAnnotation> {
    root: TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
    onEnd: ($: {
    }) => void
}