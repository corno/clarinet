/* eslint
*/
import * as tokens from "../../parser/types/tokens"
import * as i from "../../parser/interfaces/ITreeHandler"
import * as expect from "../interfaces/IExpectContext"
import * as ee from "../types/ExpectedValue"
import { DiagnosticSeverity } from "../../diagnosticSeverity/types/DiagnosticSeverity"
import { ExpectError } from "../types/expectedError"
import { ExpectIssueHandler } from "../interfaces/expectIssueHandler"
import { ExpectSeverity } from "../types/expectSeverity"
import { OnDuplicateEntry } from "../types/onDuplicateEntry"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

type CreateDummyOnProperty<TokenAnnotation, NonTokenAnnotation> = ($: {
    key: tokens.SimpleStringToken<TokenAnnotation>
}) => i.ValueHandler<TokenAnnotation, NonTokenAnnotation>

interface ICreateContext<TokenAnnotation, NonTokenAnnotation> {
    createDictionaryHandler(
        onEntry: ($: {
            token: tokens.SimpleStringToken<TokenAnnotation>
        }) => i.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation>,
        onBegin?: ($: {
            token: tokens.OpenObjectToken<TokenAnnotation>
        }) => void,
        onEnd?: ($: {
            annotation: TokenAnnotation
        }) => void,
    ): i.OnObject<TokenAnnotation, NonTokenAnnotation>
    createVerboseGroupHandler(
        expectedProperties?: expect.ExpectedProperties<TokenAnnotation, NonTokenAnnotation>,
        onBegin?: ($: {
            token: tokens.OpenObjectToken<TokenAnnotation>
        }) => void,
        onEnd?: ($: {
            hasErrors: boolean
            annotation: TokenAnnotation
        }) => void,
        onUnexpectedProperty?: ($: {
            token: tokens.SimpleStringToken<TokenAnnotation>
        }) => i.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation>,
    ): i.OnObject<TokenAnnotation, NonTokenAnnotation>
    createShorthandGroupHandler(
        expectedElements?: expect.ExpectedElements<TokenAnnotation, NonTokenAnnotation>,
        onBegin?: ($: {
            token: tokens.OpenArrayToken<TokenAnnotation>
        }) => void,
        onEnd?: ($: {
            annotation: TokenAnnotation
        }) => void
    ): i.OnArray<TokenAnnotation, NonTokenAnnotation>
    createListHandler(
        onElement: () => i.ValueHandler<TokenAnnotation, NonTokenAnnotation>,
        onBegin?: ($: {
            token: tokens.OpenArrayToken<TokenAnnotation>
        }) => void,
        onEnd?: ($: {
            annotation: TokenAnnotation
        }) => void,
    ): i.OnArray<TokenAnnotation, NonTokenAnnotation>
    createTaggedUnionHandler(
        options?: expect.Options<TokenAnnotation, NonTokenAnnotation>,
        onUnexpectedOption?: ($: {
            taggedUnionToken: tokens.TaggedUnionToken<TokenAnnotation>
            optionToken: tokens.SimpleStringToken<TokenAnnotation>
        }) => void,
        onMissingOption?: () => void,
    ): i.OnTaggedUnion<TokenAnnotation, NonTokenAnnotation>
    createUnexpectedSimpleStringHandler(
        expected: ee.ExpectedValue,
        onInvalidType?: expect.OnInvalidType<TokenAnnotation>,
        onNull?: ($: {
            token: tokens.SimpleStringToken<TokenAnnotation>
        }) => void,
    ): i.OnSimpleString<TokenAnnotation>
    createUnexpectedMultilineStringHandler(
        expected: ee.ExpectedValue,
        onInvalidType?: expect.OnInvalidType<TokenAnnotation>,
    ): i.OnMultilineString<TokenAnnotation>
    createNullHandler(
        expected: ee.ExpectedValue,
        onInvalidType?: expect.OnInvalidType<TokenAnnotation>,
    ): i.OnSimpleString<TokenAnnotation>
    createUnexpectedTaggedUnionHandler(
        expected: ee.ExpectedValue,
        onInvalidType?: expect.OnInvalidType<TokenAnnotation>,
    ): i.OnTaggedUnion<TokenAnnotation, NonTokenAnnotation>
    createUnexpectedObjectHandler(
        expected: ee.ExpectedValue,
        onInvalidType?: expect.OnInvalidType<TokenAnnotation>,
    ): i.OnObject<TokenAnnotation, NonTokenAnnotation>
    createUnexpectedArrayHandler(
        expected: ee.ExpectedValue,
        onInvalidType?: expect.OnInvalidType<TokenAnnotation>,
    ): i.OnArray<TokenAnnotation, NonTokenAnnotation>
}

function createCreateContext<TokenAnnotation, NonTokenAnnotation>(
    issueHandler: ExpectIssueHandler<TokenAnnotation>,
    createDummyPropertyHandler: CreateDummyOnProperty<TokenAnnotation, NonTokenAnnotation>,
    createDummyValueHandler: () => i.ValueHandler<TokenAnnotation, NonTokenAnnotation>,
    duplicateEntrySeverity: ExpectSeverity,
    onDuplicateEntry: OnDuplicateEntry,
): ICreateContext<TokenAnnotation, NonTokenAnnotation> {

    function raiseWarning(issue: ExpectError, annotation: TokenAnnotation): void {
        issueHandler({
            issue: issue,
            severity: DiagnosticSeverity.warning,
            annotation: annotation,
        })
    }
    function raiseError(issue: ExpectError, annotation: TokenAnnotation): void {
        issueHandler({
            issue: issue,
            severity: DiagnosticSeverity.error,
            annotation: annotation,
        })
    }

    function createDummyRequiredValueHandler(): i.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation> {
        return {
            exists: createDummyValueHandler(),
            missing: () => {
                //
            },
        }
    }

    return {
        createDictionaryHandler: (onEntry, onBegin, onEnd) => {
            return data => {

                if (data.token.data.type[0] !== "dictionary") {
                    raiseWarning(["object is not a dictionary", {}], data.token.annotation)
                }
                if (onBegin) {
                    onBegin(data)
                }
                const foundEntries: string[] = []
                return {
                    property: propertyData => {
                        const process = (): i.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation> => {
                            if (foundEntries.includes(propertyData.token.data.value)) {
                                switch (duplicateEntrySeverity) {
                                    case ExpectSeverity.error:
                                        raiseError(["duplicate entry", { key: propertyData.token.data.value }], propertyData.token.annotation)
                                        break
                                    case ExpectSeverity.nothing:
                                        break
                                    case ExpectSeverity.warning:
                                        raiseWarning(["duplicate entry", { key: propertyData.token.data.value }], propertyData.token.annotation)
                                        break
                                    default:
                                        assertUnreachable(duplicateEntrySeverity)
                                }
                                switch (onDuplicateEntry) {
                                    case OnDuplicateEntry.ignore:
                                        return createDummyRequiredValueHandler()
                                    case OnDuplicateEntry.overwrite:
                                        return onEntry(propertyData)
                                    default:
                                        return assertUnreachable(onDuplicateEntry)
                                }
                            } else {
                                return onEntry(propertyData)
                            }

                        }
                        const vh = process()
                        foundEntries.push(propertyData.token.data.value)
                        return vh
                    },
                    objectEnd: endData => {
                        if (onEnd) {
                            onEnd(endData.token)
                        }
                    },
                }
            }
        },
        createVerboseGroupHandler: (expectedProperties, onBegin, onEnd, onUnexpectedProperty) => {
            const properties = expectedProperties ? expectedProperties : {}
            return data => {

                if (data.token.data.type[0] !== "verbose group") {
                    raiseWarning(["object is not a verbose group", {}], data.token.annotation)
                }
                if (onBegin) {
                    onBegin(data)
                }
                const foundProperies: string[] = []
                let hasErrors = false
                return {
                    property: $$ => {
                        const onProperty = (): i.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation> => {
                            const expected = properties[$$.token.data.value]
                            if (expected === undefined) {
                                hasErrors = true
                                raiseError(["unexpected property", {
                                    "found key": $$.token.data.value,
                                    "valid keys": Object.keys(properties).sort(),
                                }], $$.token.annotation)
                                if (onUnexpectedProperty !== undefined) {
                                    return onUnexpectedProperty($$)
                                } else {
                                    return {
                                        exists: createDummyPropertyHandler({
                                            key: $$.token,
                                        }),
                                        missing: () => {
                                            //
                                        },
                                    }
                                }
                            }
                            return expected.onExists($$)
                        }
                        const process = (): i.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation> => {
                            if (foundProperies.includes($$.token.data.value)) {
                                switch (duplicateEntrySeverity) {
                                    case ExpectSeverity.error:
                                        raiseError(["duplicate property", { name: $$.token.data.value }], $$.token.annotation)
                                        break
                                    case ExpectSeverity.nothing:
                                        break
                                    case ExpectSeverity.warning:
                                        raiseWarning(["duplicate property", { name: $$.token.data.value }], $$.token.annotation)
                                        break
                                    default:
                                        return assertUnreachable(duplicateEntrySeverity)
                                }
                                switch (onDuplicateEntry) {
                                    case OnDuplicateEntry.ignore:
                                        return createDummyRequiredValueHandler()
                                    case OnDuplicateEntry.overwrite:
                                        return onProperty()
                                    default:
                                        return assertUnreachable(onDuplicateEntry)
                                }
                            } else {
                                return onProperty()
                            }

                        }
                        const vh = process()
                        foundProperies.push($$.token.data.value)
                        return vh
                    },
                    objectEnd: endData => {
                        Object.keys(properties).forEach(epName => {
                            if (!foundProperies.includes(epName)) {
                                const ep = properties[epName]
                                if (ep.onNotExists === null) {
                                    raiseError(["missing property", { name: epName }], data.token.annotation)//FIX print location properly
                                    hasErrors = true
                                } else {
                                    ep.onNotExists({
                                        beginToken: data.token,
                                        endToken: endData.token,
                                    })
                                }
                            }
                        })
                        if (onEnd) {
                            onEnd({
                                hasErrors: hasErrors,
                                annotation: endData.token.annotation,
                            })
                        }

                    },
                }
            }
        },
        createShorthandGroupHandler: (
            expectedElements,
            onBegin,
            onEnd,
        ) => {
            const elements = expectedElements ? expectedElements : []
            return typeData => {
                if (onBegin) {
                    onBegin(typeData)
                }
                if (typeData.token.data.type[0] !== "shorthand group") {
                    raiseWarning(["array is not a shorthand group", {}], typeData.token.annotation)
                }
                let index = 0
                return {
                    element: () => {
                        const ee2 = elements[index]
                        index++
                        if (ee2 === undefined) {
                            const dvh = createDummyValueHandler()
                            return {
                                object: data => {
                                    raiseError(["superfluous element", {}], data.token.annotation)
                                    return dvh.object(data)
                                },
                                array: data => {
                                    raiseError(["superfluous element", {}], data.token.annotation)
                                    return dvh.array(data)
                                },
                                simpleString: data => {
                                    raiseError(["superfluous element", {}], data.token.annotation)
                                    return dvh.simpleString(data)
                                },
                                multilineString: data => {
                                    raiseError(["superfluous element", {}], data.token.annotation)
                                    return dvh.multilineString(data)
                                },
                                taggedUnion: data => {
                                    raiseError(["superfluous element", {}], data.token.annotation)
                                    return dvh.taggedUnion(data)
                                },
                            }
                        } else {
                            return ee2.getHandler().exists
                        }
                    },
                    arrayEnd: $$ => {
                        const missing = elements.length - index
                        if (missing > 0) {
                            raiseError(['elements missing', {
                                names: elements.map(ee2 => {
                                    return ee2.name
                                }),
                            }], $$.token.annotation)
                            for (let x = index; x !== elements.length; x += 1) {
                                const ee2 = elements[x]
                                ee2.getHandler().missing()
                            }
                        }
                        if (onEnd) {
                            onEnd($$.token)
                        }

                    },
                }
            }
        },
        createListHandler: (
            onElement,
            onBegin,
            onEnd,
        ) => {
            return data => {
                if (data.token.data.type[0] !== "list") {
                    raiseWarning(["array is not a list", {}], data.token.annotation)
                }
                if (onBegin) {
                    onBegin(data)
                }
                return {
                    element: () => onElement(),
                    arrayEnd: endData => {
                        if (onEnd) {
                            onEnd(endData.token)
                        }

                    },
                }
            }
        },
        createTaggedUnionHandler: (
            options,
            onUnexpectedOption,
            onMissingOption,
        ) => {
            return tuData => {
                return {
                    option: optionData => {

                        const optionHandler = options ? options[optionData.token.data.value] : undefined
                        if (optionHandler === undefined) {
                            raiseError(["unknown option", {
                                "found": optionData.token.data.value,
                                "valid options": options ? Object.keys(options) : [],
                            }], optionData.token.annotation)
                            if (onUnexpectedOption !== undefined) {
                                onUnexpectedOption({
                                    taggedUnionToken: tuData.token,
                                    optionToken: optionData.token,
                                })
                            }
                            return createDummyRequiredValueHandler()
                        } else {
                            return optionHandler(tuData.token, optionData.token)
                        }

                    },
                    missingOption: onMissingOption ? onMissingOption : (): void => {
                        //
                    },
                    end: () => {
                    },
                }
            }
        },
        createUnexpectedSimpleStringHandler: (
            expected,
            onInvalidType,
            onNull,
        ) => {
            return svData => {
                if (onNull !== undefined && svData.token.data.wrapping[0] === "none" && svData.token.data.value === "null") {
                    onNull(svData)
                } else {
                    if (onInvalidType !== undefined && onInvalidType !== null) {
                        onInvalidType({
                            annotation: svData.token.annotation,
                        })
                    } else {
                        raiseError(["invalid value type", {
                            found: "string",
                            expected: expected,

                        }], svData.token.annotation)
                    }
                }
            }
        },
        createUnexpectedMultilineStringHandler: (
            expected,
            onInvalidType,
        ) => {
            return svData => {
                if (onInvalidType !== undefined && onInvalidType !== null) {
                    onInvalidType({
                        annotation: svData.token.annotation,
                    })
                } else {
                    raiseError(["invalid value type", {
                        found: "string",
                        expected: expected,

                    }], svData.token.annotation)
                }
            }
        },
        createNullHandler: (
            expected,
            onInvalidType,
        ) => {
            return svData => {
                if (onInvalidType !== undefined && onInvalidType !== null) {
                    onInvalidType({
                        annotation: svData.token.annotation,
                    })
                } else {
                    raiseError(["invalid value type", { found: "string", expected: expected }], svData.token.annotation)
                }
            }
        },
        createUnexpectedTaggedUnionHandler: (
            expected,
            onInvalidType,
        ) => {
            return () => {
                return {
                    option: $ => {
                        if (onInvalidType !== undefined && onInvalidType !== null) {
                            onInvalidType({
                                annotation: $.token.annotation,
                            })
                        } else {
                            raiseError(["invalid value type", { found: "tagged union", expected: expected }], $.token.annotation)
                        }
                        return createDummyRequiredValueHandler()
                    },
                    missingOption: () => {
                        //
                    },
                    end: () => {
                    },
                }
            }
        },
        createUnexpectedObjectHandler: (
            expected,
            onInvalidType,
        ) => {
            return $ => {
                if (onInvalidType !== undefined && onInvalidType !== null) {
                    onInvalidType({
                        annotation: $.token.annotation,
                    })
                } else {
                    raiseError(
                        ["invalid value type", { found: "object", expected: expected }],
                        $.token.annotation,
                    )
                }
                return {
                    property: propertyData => {
                        return {
                            exists: createDummyPropertyHandler({
                                key: propertyData.token,
                            }),
                            missing: () => {
                                //
                            },
                        }
                    },
                    objectEnd: _endData => {
                    },
                }
            }
        },
        createUnexpectedArrayHandler: (
            expected,
            onInvalidType,
        ) => {
            return $ => {
                if (onInvalidType !== undefined && onInvalidType !== null) {
                    onInvalidType({
                        annotation: $.token.annotation,
                    })
                } else {
                    raiseError(
                        ["invalid value type", { found: "array", expected: expected }],
                        $.token.annotation
                    )
                }
                return {
                    element: () => {
                        return createDummyValueHandler()
                    },
                    arrayEnd: _endData => {

                    },
                }
            }
        },
    }
}

export function createExpectContext<TokenAnnotation, NonTokenAnnotation>(
    issueHandler: ExpectIssueHandler<TokenAnnotation>,
    createDummyPropertyHandler: CreateDummyOnProperty<TokenAnnotation, NonTokenAnnotation>,
    createDummyValueHandler: () => i.ValueHandler<TokenAnnotation, NonTokenAnnotation>,
    duplicateEntrySeverity: ExpectSeverity,
    onDuplicateEntry: OnDuplicateEntry,
): expect.IExpectContext<TokenAnnotation, NonTokenAnnotation> {

    function raiseError(issue: ExpectError, annotation: TokenAnnotation): void {
        issueHandler({
            issue: issue,
            severity: DiagnosticSeverity.error,
            annotation: annotation,
        })
    }
    function raiseWarning(issue: ExpectError, annotation: TokenAnnotation): void {
        issueHandler({
            issue: issue,
            severity: DiagnosticSeverity.warning,
            annotation: annotation,
        })
    }

    const createContext = createCreateContext(
        issueHandler,
        createDummyPropertyHandler,
        createDummyValueHandler,
        duplicateEntrySeverity,
        onDuplicateEntry,
    )

    function expectSimpleStringImp(
        expected: ee.ExpectedValue,
        callback: ($: {
            token: tokens.SimpleStringToken<TokenAnnotation>
        }) => void,
        onInvalidType?: expect.OnInvalidType<TokenAnnotation>,
    ): i.ValueHandler<TokenAnnotation, NonTokenAnnotation> {
        return {
            array: createContext.createUnexpectedArrayHandler(expected, onInvalidType),
            object: createContext.createUnexpectedObjectHandler(expected, onInvalidType),
            simpleString: callback,
            multilineString: createContext.createUnexpectedMultilineStringHandler(expected, onInvalidType),
            taggedUnion: createContext.createUnexpectedTaggedUnionHandler(expected, onInvalidType),
        }
    }

    return {
        expectSimpleString: $ => {

            const expectValue: ee.ExpectedValue = {
                "type": "string",
                "null allowed": $.onNull !== undefined,
            }
            return expectSimpleStringImp(expectValue, $.callback, $.onInvalidType)
        },
        expectQuotedString: $ => {
            const expectValue: ee.ExpectedValue = {
                "type": "quoted string",
                "null allowed": $.onNull !== undefined,
            }
            return expectSimpleStringImp(
                expectValue,
                $$ => {
                    if ($$.token.data.wrapping[0] !== "quote") {
                        if ($.warningOnly) {
                            raiseWarning(["string is not quoted", {}], $$.token.annotation)
                            return $.callback({
                                token: $$.token,
                            })
                        } else {
                            if ($.onInvalidType) {
                                $.onInvalidType({
                                    annotation: $$.token.annotation,
                                })
                            } else {
                                raiseError(["string is not quoted", {}], $$.token.annotation)
                            }
                        }
                    } else {
                        return $.callback({
                            token: $$.token,
                        })
                    }
                },
                $.onInvalidType
            )
        },
        expectNonWrappedString: $ => {
            const expectValue: ee.ExpectedValue = {
                "type": "nonwrapped string",
                "null allowed": $.onNull !== undefined,
            }
            return expectSimpleStringImp(
                expectValue,
                $$ => {
                    if ($$.token.data.wrapping[0] !== "none") {
                        if ($.warningOnly) {
                            raiseWarning(["string should not have quotes or apostrophes", {}], $$.token.annotation)
                            return $.callback({
                                token: $$.token,
                            })
                        } else {
                            if ($.onInvalidType) {
                                $.onInvalidType({
                                    annotation: $$.token.annotation,
                                })
                            } else {
                                raiseError(["string should not have quotes or apostrophes", {}], $$.token.annotation)
                            }
                        }
                    } else {
                        return $.callback({
                            token: $$.token,
                        })
                    }
                },
                $.onInvalidType
            )
        },
        expectDictionary: $ => {

            const expectValue: ee.ExpectedValue = {
                "type": "dictionary",
                "null allowed": false,
            }
            return {
                array: createContext.createUnexpectedArrayHandler(expectValue, $.onInvalidType),
                object: createContext.createDictionaryHandler($.onProperty, $.onBegin, $.onEnd),
                simpleString: createContext.createUnexpectedSimpleStringHandler(expectValue, $.onInvalidType, $.onNull),
                multilineString: createContext.createUnexpectedMultilineStringHandler(expectValue, $.onInvalidType),
                taggedUnion: createContext.createUnexpectedTaggedUnionHandler(expectValue, $.onInvalidType),
            }
        },
        expectVerboseGroup: $ => {

            const expectValue: ee.ExpectedValue = {
                "type": "verbose group",
                "null allowed": $.onNull !== undefined,
            }
            return {
                array: createContext.createUnexpectedArrayHandler(expectValue, $.onInvalidType),
                object: createContext.createVerboseGroupHandler(
                    $.properties,
                    $.onBegin,
                    $.onEnd,
                    $.onUnexpectedProperty
                ),
                simpleString: createContext.createUnexpectedSimpleStringHandler(expectValue, $.onInvalidType, $.onNull),
                multilineString: createContext.createUnexpectedMultilineStringHandler(expectValue, $.onInvalidType),
                taggedUnion: createContext.createUnexpectedTaggedUnionHandler(expectValue, $.onInvalidType),
            }
        },
        expectList: $ => {

            const expectValue: ee.ExpectedValue = {
                "type": "list",
                "null allowed": false,
            }
            return {
                array: createContext.createListHandler($.onElement, $.onBegin, $.onEnd),
                object: createContext.createUnexpectedObjectHandler(expectValue, $.onInvalidType),
                simpleString: createContext.createUnexpectedSimpleStringHandler(expectValue, $.onInvalidType, $.onNull),
                multilineString: createContext.createUnexpectedMultilineStringHandler(expectValue, $.onInvalidType),
                taggedUnion: createContext.createUnexpectedTaggedUnionHandler(expectValue, $.onInvalidType),
            }
        },
        expectShorthandGroup: $ => {

            const expectValue: ee.ExpectedValue = {
                "type": "shorthand group",
                "null allowed": $.onNull !== undefined,
            }
            return {
                array: createContext.createShorthandGroupHandler($.elements, $.onBegin, $.onEnd),
                object: createContext.createUnexpectedObjectHandler(expectValue, $.onInvalidType),
                simpleString: createContext.createUnexpectedSimpleStringHandler(expectValue, $.onInvalidType, $.onNull),
                multilineString: createContext.createUnexpectedMultilineStringHandler(expectValue, $.onInvalidType),
                taggedUnion: createContext.createUnexpectedTaggedUnionHandler(expectValue, $.onInvalidType),
            }
        },

        expectGroup: $ => {

            const expectValue: ee.ExpectedValue = {
                "type": "type or shorthand group",
                "null allowed": $.onNull !== undefined,
            }
            return {
                array: createContext.createShorthandGroupHandler($.elements, $.onShorthandGroupBegin, $.onShorthandGroupEnd),
                object: createContext.createVerboseGroupHandler(
                    $.properties,
                    $.onTypeBegin,
                    $.onTypeEnd,
                    $.onUnexpectedProperty
                ),
                simpleString: createContext.createUnexpectedSimpleStringHandler(expectValue, $.onInvalidType, $.onNull),
                multilineString: createContext.createUnexpectedMultilineStringHandler(expectValue, $.onInvalidType),
                taggedUnion: createContext.createUnexpectedTaggedUnionHandler(expectValue, $.onInvalidType),
            }
        },
        expectTaggedUnion: $ => {

            const expectValue: ee.ExpectedValue = {
                "type": "tagged union",
                "null allowed": $.onNull !== undefined,
            }
            return {
                array: createContext.createUnexpectedArrayHandler(expectValue, $.onInvalidType),
                object: createContext.createUnexpectedObjectHandler(expectValue, $.onInvalidType),
                simpleString: createContext.createUnexpectedSimpleStringHandler(expectValue, $.onInvalidType, $.onNull),
                multilineString: createContext.createUnexpectedMultilineStringHandler(expectValue, $.onInvalidType),
                taggedUnion: createContext.createTaggedUnionHandler(
                    $.options,
                    $.onUnexpectedOption,
                    $.onMissingOption,
                ),
            }
        },
    }
}