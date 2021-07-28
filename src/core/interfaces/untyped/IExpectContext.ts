import * as h from "./handlers"
import * as sp from "./ITreeParser"


export type ExpectErrorValueType =
    | "array"
    | "boolean"
    | "dictionary"
    | "list"
    | "nothing"
    | "null"
    | "number"
    | "object"
    | "quoted string"
    | "shorthand group"
    | "string"
    | "tagged union"
    | "type or shorthand group"
    | "type"
    | "verbose group"

export type ExpectErrorValue = {
    type: ExpectErrorValueType
    "null allowed": boolean
}

export type ExpectedToken =
    | "close angle bracket"
    | "close bracket"
    | "close curly"
    | "close paren"
    | "open angle bracket"
    | "open bracket"
    | "open curly"
    | "open paren"


export type OnInvalidType<TokenAnnotation> = null | (($: {
    annotation: TokenAnnotation
}) => void)

export type ExpectedElement<TokenAnnotation, NonTokenAnnotation> = {
    name: string
    getHandler: () => h.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation>
}

export type ExpectedElements<TokenAnnotation, NonTokenAnnotation> = ExpectedElement<TokenAnnotation, NonTokenAnnotation>[]

export type ExpectedProperty<TokenAnnotation, NonTokenAnnotation> = {
    onExists: ($: {
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => h.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation>
    onNotExists: null | (($: {
        beginToken: sp.OpenObjectToken<TokenAnnotation>
        endToken: sp.CloseObjectToken<TokenAnnotation>
    }) => void) //if onNotExists is null and the property does not exist, an error will be raised
}

export type ExpectedProperties<TokenAnnotation, NonTokenAnnotation> = {
    [key: string]: ExpectedProperty<TokenAnnotation, NonTokenAnnotation>
}

export type Options<TokenAnnotation, NonTokenAnnotation> = {
    [key: string]: (
        taggedUnionToken: sp.TaggedUnionToken<TokenAnnotation>,
        optionData: sp.SimpleStringToken<TokenAnnotation>,
    ) => h.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation>
}

export type ExpectBooleanParameters<TokenAnnotation> = {
    callback: ($: {
        value: boolean
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => void
    onInvalidType?: OnInvalidType<TokenAnnotation>
    onNull?: ($: {
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => void
}

export type ExpectDictionaryParameters<TokenAnnotation, NonTokenAnnotation> = {
    onBegin?: ($: {
        token: sp.OpenObjectToken<TokenAnnotation>
    }) => void
    onProperty: ($: {
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => h.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation>
    onEnd?: ($: {
        annotation: TokenAnnotation
    }) => void
    onInvalidType?: OnInvalidType<TokenAnnotation>
    onNull?: ($: {
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => void
}

export type ExpectValueParameters<TokenAnnotation, NonTokenAnnotation> = {
    handler: h.ValueHandler<TokenAnnotation, NonTokenAnnotation>
    onMissing?: () => void
}

export type ExpectStringParameters<TokenAnnotation> = {
    callback: ($: {
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => void
    onInvalidType?: OnInvalidType<TokenAnnotation>
    onNull?: ($: {
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => void
}

export type ExpectNullParameters<TokenAnnotation> = {
    callback: ($: {
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => void
    onInvalidType?: OnInvalidType<TokenAnnotation>
}

export type ExpectListParameters<TokenAnnotation, NonTokenAnnotation> = {
    onBegin?: ($: {
        token: sp.OpenArrayToken<TokenAnnotation>
    }) => void
    onElement: () => h.ValueHandler<TokenAnnotation, NonTokenAnnotation>
    onEnd?: ($: {
        annotation: TokenAnnotation
    }) => void
    onInvalidType?: OnInvalidType<TokenAnnotation>
    onNull?: ($: {
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => void
}

export type ExpectNumberParameters<TokenAnnotation> = {
    callback: ($: {
        value: number
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => void
    onInvalidType?: OnInvalidType<TokenAnnotation>
    onNull?: ($: {
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => void
}

export type ExpectTaggedUnionParameters<TokenAnnotation, NonTokenAnnotation> = {
    options?: Options<TokenAnnotation, NonTokenAnnotation>
    onUnexpectedOption?: ($: {
        taggedUnionToken: sp.TaggedUnionToken<TokenAnnotation>
        optionToken: sp.SimpleStringToken<TokenAnnotation>
    }) => void
    onMissingOption?: () => void
    onInvalidType?: OnInvalidType<TokenAnnotation>
    onNull?: ($: {
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => void
}

export type ExpectVerboseGroupParameters<TokenAnnotation, NonTokenAnnotation> = {
    properties?: ExpectedProperties<TokenAnnotation, NonTokenAnnotation>
    onBegin?: ($: {
        token: sp.OpenObjectToken<TokenAnnotation>
    }) => void
    onEnd?: ($: {
        hasErrors: boolean
        annotation: TokenAnnotation
    }) => void
    onUnexpectedProperty?: ($: {
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => h.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation>
    onInvalidType?: OnInvalidType<TokenAnnotation>
    onNull?: ($: {
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => void
}

export type ExpectQuotedStringParameters<TokenAnnotation> = {
    callback: ($: {
        value: string
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => void
    onInvalidType?: OnInvalidType<TokenAnnotation>
    onNull?: ($: {
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => void
    warningOnly?: boolean
}

export type ExpectShorthandGroupParameters<TokenAnnotation, NonTokenAnnotation> = {
    elements?: ExpectedElements<TokenAnnotation, NonTokenAnnotation>
    onBegin?: ($: {
        token: sp.OpenArrayToken<TokenAnnotation>
    }) => void
    onEnd?: ($: {
        annotation: TokenAnnotation
    }) => void
    onInvalidType?: OnInvalidType<TokenAnnotation>
    onNull?: ($: {
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => void
}

export type ExpectTypeParameters<TokenAnnotation, NonTokenAnnotation> = {
    properties?: ExpectedProperties<TokenAnnotation, NonTokenAnnotation>
    elements?: ExpectedElements<TokenAnnotation, NonTokenAnnotation>
    onTypeBegin?: ($: {
        token: sp.OpenObjectToken<TokenAnnotation>
    }) => void
    onTypeEnd?: ($: {
        hasErrors: boolean
        annotation: TokenAnnotation
    }) => void
    onUnexpectedProperty?: ($: {
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => h.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation>
    onShorthandGroupBegin?: ($: {
        token: sp.OpenArrayToken<TokenAnnotation>
    }) => void
    onShorthandGroupEnd?: ($: {
        annotation: TokenAnnotation
    }) => void
    onInvalidType?: OnInvalidType<TokenAnnotation>
    onNull?: ($: {
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => void
}

export type ExpectNothingParameters<TokenAnnotation> = {
    onInvalidType?: OnInvalidType<TokenAnnotation>
}

export interface IExpectContext<TokenAnnotation, NonTokenAnnotation> {
    expectNothing($: ExpectNothingParameters<TokenAnnotation>): h.ValueHandler<TokenAnnotation, NonTokenAnnotation>
    expectSimpleString($: ExpectStringParameters<TokenAnnotation>): h.ValueHandler<TokenAnnotation, NonTokenAnnotation>
    expectBoolean($: ExpectBooleanParameters<TokenAnnotation>): h.ValueHandler<TokenAnnotation, NonTokenAnnotation>
    expectNull($: ExpectNullParameters<TokenAnnotation>): h.ValueHandler<TokenAnnotation, NonTokenAnnotation>
    expectNumber($: ExpectNumberParameters<TokenAnnotation>): h.ValueHandler<TokenAnnotation, NonTokenAnnotation>
    expectQuotedString($: ExpectQuotedStringParameters<TokenAnnotation>): h.ValueHandler<TokenAnnotation, NonTokenAnnotation>
    expectDictionary($: ExpectDictionaryParameters<TokenAnnotation, NonTokenAnnotation>): h.ValueHandler<TokenAnnotation, NonTokenAnnotation>
    expectVerboseGroup($: ExpectVerboseGroupParameters<TokenAnnotation, NonTokenAnnotation>): h.ValueHandler<TokenAnnotation, NonTokenAnnotation>
    expectList($: ExpectListParameters<TokenAnnotation, NonTokenAnnotation>): h.ValueHandler<TokenAnnotation, NonTokenAnnotation>
    expectShorthandGroup($: ExpectShorthandGroupParameters<TokenAnnotation, NonTokenAnnotation>): h.ValueHandler<TokenAnnotation, NonTokenAnnotation>
    expectType($: ExpectTypeParameters<TokenAnnotation, NonTokenAnnotation>): h.ValueHandler<TokenAnnotation, NonTokenAnnotation>
    expectTaggedUnion($: ExpectTaggedUnionParameters<TokenAnnotation, NonTokenAnnotation>): h.ValueHandler<TokenAnnotation, NonTokenAnnotation>
}
