import * as sp from "../../parser/types/tokens"
import * as h from "../../parser/interfaces/ITreeHandler"

export type ExpectedElement<TokenAnnotation, NonTokenAnnotation> = {
    name: string
    getHandler: () => h.IRequiredValueHandler<TokenAnnotation, NonTokenAnnotation>
}

export type ExpectedElements<TokenAnnotation, NonTokenAnnotation> = ExpectedElement<TokenAnnotation, NonTokenAnnotation>[]

export type ExpectedProperty<TokenAnnotation, NonTokenAnnotation> = {
    onExists: ($: {
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => h.IRequiredValueHandler<TokenAnnotation, NonTokenAnnotation>
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
    ) => h.IRequiredValueHandler<TokenAnnotation, NonTokenAnnotation>
}

export type OnInvalidType<TokenAnnotation> = null | (($: {
    annotation: TokenAnnotation
}) => void)

export type ExpectDictionaryParameters<TokenAnnotation, NonTokenAnnotation> = {
    onBegin?: ($: {
        token: sp.OpenObjectToken<TokenAnnotation>
    }) => void
    onProperty: ($: {
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => h.IRequiredValueHandler<TokenAnnotation, NonTokenAnnotation>
    onEnd?: ($: {
        annotation: TokenAnnotation
    }) => void
    onInvalidType?: OnInvalidType<TokenAnnotation>
    onNull?: ($: {
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => void
}

export type ExpectListParameters<TokenAnnotation, NonTokenAnnotation> = {
    onBegin?: ($: {
        token: sp.OpenArrayToken<TokenAnnotation>
    }) => void
    onElement: () => h.IValueHandler<TokenAnnotation, NonTokenAnnotation>
    onEnd?: ($: {
        annotation: TokenAnnotation
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
    }) => h.IRequiredValueHandler<TokenAnnotation, NonTokenAnnotation>
    onInvalidType?: OnInvalidType<TokenAnnotation>
    onNull?: ($: {
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => void
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

export type ExpectQuotedStringParameters<TokenAnnotation> = {
    callback: ($: {
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => void
    onInvalidType?: OnInvalidType<TokenAnnotation>
    onNull?: ($: {
        token: sp.SimpleStringToken<TokenAnnotation>
    }) => void
    warningOnly?: boolean
}

export type ExpectNonwrappedStringParameters<TokenAnnotation> = {
    callback: ($: {
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

export type ExpectGroupParameters<TokenAnnotation, NonTokenAnnotation> = {
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
    }) => h.IRequiredValueHandler<TokenAnnotation, NonTokenAnnotation>
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

export interface IExpectContext<TokenAnnotation, NonTokenAnnotation> {
    expectSimpleString($: ExpectStringParameters<TokenAnnotation>): h.IValueHandler<TokenAnnotation, NonTokenAnnotation>
    expectQuotedString($: ExpectQuotedStringParameters<TokenAnnotation>): h.IValueHandler<TokenAnnotation, NonTokenAnnotation>
    expectNonWrappedString($: ExpectNonwrappedStringParameters<TokenAnnotation>): h.IValueHandler<TokenAnnotation, NonTokenAnnotation>
    expectDictionary($: ExpectDictionaryParameters<TokenAnnotation, NonTokenAnnotation>): h.IValueHandler<TokenAnnotation, NonTokenAnnotation>
    expectVerboseGroup($: ExpectVerboseGroupParameters<TokenAnnotation, NonTokenAnnotation>): h.IValueHandler<TokenAnnotation, NonTokenAnnotation>
    expectList($: ExpectListParameters<TokenAnnotation, NonTokenAnnotation>): h.IValueHandler<TokenAnnotation, NonTokenAnnotation>
    expectShorthandGroup($: ExpectShorthandGroupParameters<TokenAnnotation, NonTokenAnnotation>): h.IValueHandler<TokenAnnotation, NonTokenAnnotation>
    expectGroup($: ExpectGroupParameters<TokenAnnotation, NonTokenAnnotation>): h.IValueHandler<TokenAnnotation, NonTokenAnnotation>
    expectTaggedUnion($: ExpectTaggedUnionParameters<TokenAnnotation, NonTokenAnnotation>): h.IValueHandler<TokenAnnotation, NonTokenAnnotation>
}
