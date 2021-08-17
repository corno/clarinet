import * as def from "../types/definitions"
import * as tokens from "../../parser/types/tokens"

export interface IGroupHandler<TokenAnnotation, NonTokenAnnotation> {
    onUnexpectedProperty($: {
        token: tokens.SimpleStringToken<TokenAnnotation> //cannot be shorthand, so there must be a token, so no null
        expectedProperties: string[]
        groupDefinition: def.GroupDefinition
    }): void
    onProperty($: {
        key: string
        token: null | tokens.SimpleStringToken<TokenAnnotation>
        definition: def.ValueDefinition
    }): ITypedValueHandler<TokenAnnotation, NonTokenAnnotation>
    onClose($: {
        token: null | tokens.CloseObjectToken<TokenAnnotation>
    }): void
}

export interface IDictionaryHandler<TokenAnnotation, NonTokenAnnotation> {
    onEntry($: {
        token: tokens.SimpleStringToken<TokenAnnotation>
    }): ITypedValueHandler<TokenAnnotation, NonTokenAnnotation>
    onClose($: {
        token: null | tokens.CloseObjectToken<TokenAnnotation>
    }): void
}

export interface IListHandler<TokenAnnotation, NonTokenAnnotation> {
    onClose($: {
        token: null | tokens.CloseArrayToken<TokenAnnotation>
    }): void
    onElement($: {
        annotation: NonTokenAnnotation
    }): ITypedValueHandler<TokenAnnotation, NonTokenAnnotation>
}

export interface ITypedTaggedUnionHandler<TokenAnnotation, NonTokenAnnotation> {
    onOption($: {
        name: string
        token: null | tokens.SimpleStringToken<TokenAnnotation>
        definition: def.OptionDefinition
    }): ITypedValueHandler<TokenAnnotation, NonTokenAnnotation>
    onUnexpectedOption($: {
        token: tokens.SimpleStringToken<TokenAnnotation>
        expectedOptions: string[]
        defaultOption: string //the unmarshaller will initialize the default option.
    }): ITypedValueHandler<TokenAnnotation, NonTokenAnnotation>
    onEnd($: {
        annotation: NonTokenAnnotation
    }): void
}

export type IGroupType<TokenAnnotation> =
    | ["verbose", tokens.OpenObjectToken<TokenAnnotation>]
    | ["shorthand", tokens.OpenArrayToken<TokenAnnotation>]
    | ["mixin"]
    | ["omitted"]

export interface ITypedValueHandler<TokenAnnotation, NonTokenAnnotation> {
    onGroup($: {
        type: IGroupType<TokenAnnotation>
        definition: def.GroupDefinition
    }): IGroupHandler<TokenAnnotation, NonTokenAnnotation>
    onList($: {
        token: null | tokens.OpenArrayToken<TokenAnnotation>
        definition: def.ListDefinition
    }): IListHandler<TokenAnnotation, NonTokenAnnotation>
    onDictionary($: {
        token: null | tokens.OpenObjectToken<TokenAnnotation>
        definition: def.DictionaryDefinition
    }): IDictionaryHandler<TokenAnnotation, NonTokenAnnotation>
    onTypeReference($: {
        definition: def.TypeReferenceDefinition
    }): ITypedValueHandler<TokenAnnotation, NonTokenAnnotation>
    onTaggedUnion($: {
        definition: def.TaggedUnionDefinition
        token: null | tokens.TaggedUnionToken<TokenAnnotation>
    }): ITypedTaggedUnionHandler<TokenAnnotation, NonTokenAnnotation>
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
    root: ITypedValueHandler<TokenAnnotation, NonTokenAnnotation>
    onEnd: ($: {
    }) => void
}