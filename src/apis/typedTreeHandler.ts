import * as def from "./definitions"

export type Token<Data, TokenAnnotation> = {
    data: Data
    annotation: TokenAnnotation
}
export type OpenObject = {
    type:
    | ["verbose group"]
    | ["dictionary"]
}

export type OpenArray = {
    type:
    | ["shorthand group"]
    | ["list"]
}

export type SimleStringWrapping =
    | ["apostrophe", {
    }]
    | ["none", {
    }]
    | ["quote", {
    }]

export type SimpleString = {
    wrapping: SimleStringWrapping
    value: string
}

export type MultilineString = {
    lines: string[]
}

export type CloseObject = {
}

export type CloseArray = {
}

export type TaggedUnion = {
}

export interface GroupHandler<TokenAnnotation, NonTokenAnnotation> {
    onUnexpectedProperty($: {
        token: SimpleStringToken<TokenAnnotation> //cannot be shorthand, so there must be a token, so no null
        expectedProperties: string[]
        groupDefinition: def.GroupDefinition
    }): void
    onProperty($: {
        key: string
        token: null | SimpleStringToken<TokenAnnotation>
        definition: def.ValueDefinition
    }): TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
    onClose($: {
        token: null | CloseObjectToken<TokenAnnotation>
    }): void
}

export type CloseArrayToken<TokenAnnotation> = Token<CloseArray, TokenAnnotation>

export type CloseObjectToken<TokenAnnotation>  = Token<CloseObject, TokenAnnotation>

export type OpenArrayToken<TokenAnnotation> = Token<OpenArray, TokenAnnotation>

export type OpenObjectToken<TokenAnnotation> = Token<OpenObject, TokenAnnotation>

export type SimpleStringToken<TokenAnnotation> = Token<SimpleString, TokenAnnotation>

export type MultilineStringToken<TokenAnnotation> = Token<MultilineString, TokenAnnotation>

export type TaggedUnionToken<TokenAnnotation> = Token<TaggedUnion, TokenAnnotation>

export type GroupType<TokenAnnotation> =
| ["verbose", OpenObjectToken<TokenAnnotation>]
| ["shorthand", OpenArrayToken<TokenAnnotation>]
| ["mixin"]
| ["omitted"]


export interface DictionaryHandler<TokenAnnotation, NonTokenAnnotation> {
    onEntry($: {
        token: SimpleStringToken<TokenAnnotation>
    }): TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
    onClose($: {
        token: null | CloseObjectToken<TokenAnnotation>
    }): void
}

export interface ListHandler<TokenAnnotation, NonTokenAnnotation> {
    onClose($: {
        token: null | CloseArrayToken<TokenAnnotation>
    }): void
    onElement($: {
        annotation: NonTokenAnnotation
    }): TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
}

export interface TypedTaggedUnionHandler<TokenAnnotation, NonTokenAnnotation> {
    onOption($: {
        name: string
        token: null | SimpleStringToken<TokenAnnotation>
        definition: def.OptionDefinition
    }): TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
    onUnexpectedOption($: {
        token: SimpleStringToken<TokenAnnotation>
        expectedOptions: string[]
        defaultOption: string //the unmarshaller will initialize the default option.
    }): TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
    onEnd($: {
        annotation: NonTokenAnnotation
    }): void
}


export interface TypedValueHandler<TokenAnnotation, NonTokenAnnotation> {
    onGroup($: {
        type: GroupType<TokenAnnotation>
        definition: def.GroupDefinition
    }): GroupHandler<TokenAnnotation, NonTokenAnnotation>
    onList($: {
        token: null | OpenArrayToken<TokenAnnotation>
        definition: def.ListDefinition
    }): ListHandler<TokenAnnotation, NonTokenAnnotation>
    onDictionary($: {
        token: null | OpenObjectToken<TokenAnnotation>
        definition: def.DictionaryDefinition
    }): DictionaryHandler<TokenAnnotation, NonTokenAnnotation>
    onTypeReference($: {
        definition: def.TypeReference
    }): TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
    onTaggedUnion($: {
        definition: def.TaggedUnionDefinition
        token: null | TaggedUnionToken<TokenAnnotation>
    }): TypedTaggedUnionHandler<TokenAnnotation, NonTokenAnnotation>
    onSimpleString($: {
        value: string
        token: null | SimpleStringToken<TokenAnnotation>
        definition: def.SimpleStringDefinition
    }): void
    onMultilineString($: {
        token: null | MultilineStringToken<TokenAnnotation>
        definition: def.MultiLineStringDefinition
    }): void
}

export interface ITypedTreeHandler<TokenAnnotation, NonTokenAnnotation> {
    root: TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
    onEnd: ($: {
    }) => void
}