
export type TypeReferenceDefinition = {
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
    | ["type reference", TypeReferenceDefinition]
    | ["tagged union", TaggedUnionDefinition]
    | ["simple string", SimpleStringDefinition]
    | ["multiline string", MultiLineStringDefinition]

export type Schema = {
    readonly "types": g.IReadonlyDictionary<TypeDefinition>
    readonly "root type": g.IReference<TypeDefinition>
}

import * as g from "../generics"

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
        groupDefinition: GroupDefinition
    }): void
    onProperty($: {
        key: string
        token: null | SimpleStringToken<TokenAnnotation>
        definition: ValueDefinition
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
        definition: OptionDefinition
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
        definition: GroupDefinition
    }): GroupHandler<TokenAnnotation, NonTokenAnnotation>
    onList($: {
        token: null | OpenArrayToken<TokenAnnotation>
        definition: ListDefinition
    }): ListHandler<TokenAnnotation, NonTokenAnnotation>
    onDictionary($: {
        token: null | OpenObjectToken<TokenAnnotation>
        definition: DictionaryDefinition
    }): DictionaryHandler<TokenAnnotation, NonTokenAnnotation>
    onTypeReference($: {
        definition: TypeReferenceDefinition
    }): TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
    onTaggedUnion($: {
        definition: TaggedUnionDefinition
        token: null | TaggedUnionToken<TokenAnnotation>
    }): TypedTaggedUnionHandler<TokenAnnotation, NonTokenAnnotation>
    onSimpleString($: {
        value: string
        token: null | SimpleStringToken<TokenAnnotation>
        definition: SimpleStringDefinition
    }): void
    onMultilineString($: {
        token: null | MultilineStringToken<TokenAnnotation>
        definition: MultiLineStringDefinition
    }): void
}

export interface ITypedTreeHandler<TokenAnnotation, NonTokenAnnotation> {
    root: TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
    onEnd: ($: {
    }) => void
}
export interface ITreeParser<TokenAnnotation> {
    closeArray(
        token: CloseArrayToken<TokenAnnotation>,
    ): void
    closeObject(
        token: CloseObjectToken<TokenAnnotation>,
    ): void
    openArray(
        token: OpenArrayToken<TokenAnnotation>,
    ): void
    openObject(
        token: OpenObjectToken<TokenAnnotation>,
    ): void
    simpleString(
        token: SimpleStringToken<TokenAnnotation>,
    ): void
    multilineString(
        token: MultilineStringToken<TokenAnnotation>,
    ): void
    taggedUnion(
        token: TaggedUnionToken<TokenAnnotation>,
    ): void
    forceEnd(
        annotation: TokenAnnotation
    ): void
}
