/* eslint
    max-classes-per-file: "off",
*/
import * as i from "../../../interfaces/untyped"
import {
    ExpectError, ExpectErrorHandler, OnDuplicateEntry, ExpectSeverity,
} from "./functionTypes"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

type CreateDummyOnProperty<TokenAnnotation, NonTokenAnnotation> = ($: {
    key: i.SimpleStringToken<TokenAnnotation>
}) => i.ValueHandler<TokenAnnotation, NonTokenAnnotation>

interface ICreateContext<TokenAnnotation, NonTokenAnnotation> {
    createDictionaryHandler(
        onEntry: ($: {
            token: i.SimpleStringToken<TokenAnnotation>
        }) => i.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation>,
        onBegin?: ($: {
            token: i.OpenObjectToken<TokenAnnotation>
        }) => void,
        onEnd?: ($: {
            annotation: TokenAnnotation
        }) => void,
    ): i.OnObject<TokenAnnotation, NonTokenAnnotation>
    createVerboseGroupHandler(
        expectedProperties?: i.ExpectedProperties<TokenAnnotation, NonTokenAnnotation>,
        onBegin?: ($: {
            token: i.OpenObjectToken<TokenAnnotation>
        }) => void,
        onEnd?: ($: {
            hasErrors: boolean
            annotation: TokenAnnotation
        }) => void,
        onUnexpectedProperty?: ($: {
            token: i.SimpleStringToken<TokenAnnotation>
        }) => i.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation>,
    ): i.OnObject<TokenAnnotation, NonTokenAnnotation>
    createShorthandGroupHandler(
        expectedElements?: i.ExpectedElements<TokenAnnotation, NonTokenAnnotation>,
        onBegin?: ($: {
            token: i.OpenArrayToken<TokenAnnotation>
        }) => void,
        onEnd?: ($: {
            annotation: TokenAnnotation
        }) => void
    ): i.OnArray<TokenAnnotation, NonTokenAnnotation>
    createListHandler(
        onElement: () => i.ValueHandler<TokenAnnotation, NonTokenAnnotation>,
        onBegin?: ($: {
            token: i.OpenArrayToken<TokenAnnotation>
        }) => void,
        onEnd?: ($: {
            annotation: TokenAnnotation
        }) => void,
    ): i.OnArray<TokenAnnotation, NonTokenAnnotation>
    createTaggedUnionHandler(
        options?: i.Options<TokenAnnotation, NonTokenAnnotation>,
        onUnexpectedOption?: ($: {
            taggedUnionToken: i.TaggedUnionToken<TokenAnnotation>
            optionToken: i.SimpleStringToken<TokenAnnotation>
        }) => void,
        onMissingOption?: () => void,
    ): i.OnTaggedUnion<TokenAnnotation, NonTokenAnnotation>
    createUnexpectedSimpleStringHandler(
        expected: i.ExpectErrorValue,
        onInvalidType?: i.OnInvalidType<TokenAnnotation>,
        onNull?: ($: {
            token: i.SimpleStringToken<TokenAnnotation>
        }) => void,
    ): i.OnSimpleString<TokenAnnotation>
    createUnexpectedMultilineStringHandler(
        expected: i.ExpectErrorValue,
        onInvalidType?: i.OnInvalidType<TokenAnnotation>,
    ): i.OnMultilineString<TokenAnnotation>
    createNullHandler(
        expected: i.ExpectErrorValue,
        onInvalidType?: i.OnInvalidType<TokenAnnotation>,
    ): i.OnSimpleString<TokenAnnotation>
    createUnexpectedTaggedUnionHandler(
        expected: i.ExpectErrorValue,
        onInvalidType?: i.OnInvalidType<TokenAnnotation>,
    ): i.OnTaggedUnion<TokenAnnotation, NonTokenAnnotation>
    createUnexpectedObjectHandler(
        expected: i.ExpectErrorValue,
        onInvalidType?: i.OnInvalidType<TokenAnnotation>,
    ): i.OnObject<TokenAnnotation, NonTokenAnnotation>
    createUnexpectedArrayHandler(
        expected: i.ExpectErrorValue,
        onInvalidType?: i.OnInvalidType<TokenAnnotation>,
    ): i.OnArray<TokenAnnotation, NonTokenAnnotation>
}

function createCreateContext<TokenAnnotation, NonTokenAnnotation>(
    errorHandler: ExpectErrorHandler<TokenAnnotation>,
    warningHandler: ExpectErrorHandler<TokenAnnotation>,
    //createDummyArrayHandler: (range: bc.Range, data: bc.ArrayOpenData, contextData: bc.ContextData) => bc.ArrayHandler,
    //createDummyObjectHandler: (range: bc.Range, data: bc.ArrayOpenData, contextData: bc.ContextData) => bc.ObjectHandler,
    createDummyPropertyHandler: CreateDummyOnProperty<TokenAnnotation, NonTokenAnnotation>,
    createDummyValueHandler: () => i.ValueHandler<TokenAnnotation, NonTokenAnnotation>,
    duplicateEntrySeverity: ExpectSeverity,
    onDuplicateEntry: OnDuplicateEntry,
): ICreateContext<TokenAnnotation, NonTokenAnnotation> {

    function raiseWarning(issue: ExpectError, annotation: TokenAnnotation): void {
        warningHandler({
            issue: issue,
            annotation: annotation,
        })
    }
    function raiseError(issue: ExpectError, annotation: TokenAnnotation): void {
        errorHandler({
            issue: issue,
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
                        const ee = elements[index]
                        index++
                        if (ee === undefined) {
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
                            return ee.getHandler().exists
                        }
                    },
                    arrayEnd: $$ => {
                        const missing = elements.length - index
                        if (missing > 0) {
                            raiseError(['elements missing', {
                                names: elements.map(ee => {
                                    return ee.name
                                }),
                            }], $$.token.annotation)
                            for (let x = index; x !== elements.length; x += 1) {
                                const ee = elements[x]
                                ee.getHandler().missing()
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
    errorHandler: ExpectErrorHandler<TokenAnnotation>,
    warningHandler: ExpectErrorHandler<TokenAnnotation>,
    createDummyPropertyHandler: CreateDummyOnProperty<TokenAnnotation, NonTokenAnnotation>,
    createDummyValueHandler: () => i.ValueHandler<TokenAnnotation, NonTokenAnnotation>,
    duplicateEntrySeverity: ExpectSeverity,
    onDuplicateEntry: OnDuplicateEntry,
    serializeStringToken: (token: i.SimpleStringToken<TokenAnnotation>) => string,
): i.IExpectContext<TokenAnnotation, NonTokenAnnotation> {

    function raiseError(issue: ExpectError, annotation: TokenAnnotation): void {
        errorHandler({
            issue: issue,
            annotation: annotation,
        })
    }
    function raiseWarning(issue: ExpectError, annotation: TokenAnnotation): void {
        warningHandler({
            issue: issue,
            annotation: annotation,
        })
    }

    const createContext = createCreateContext(
        errorHandler,
        warningHandler,
        createDummyPropertyHandler,
        createDummyValueHandler,
        duplicateEntrySeverity,
        onDuplicateEntry,
    )

    function expectSimpleStringImp(
        expected: i.ExpectErrorValue,
        callback: ($: {
            token: i.SimpleStringToken<TokenAnnotation>
        }) => void,
        onInvalidType?: i.OnInvalidType<TokenAnnotation>,
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

        expectNothing: $ => {
            const expectValue: i.ExpectErrorValue = {
                "type": "nothing",
                "null allowed": false,
            }
            return {
                array: createContext.createUnexpectedArrayHandler(expectValue, $.onInvalidType),
                object: createContext.createUnexpectedObjectHandler(expectValue, $.onInvalidType),
                simpleString: createContext.createUnexpectedSimpleStringHandler(expectValue, $.onInvalidType),
                multilineString: createContext.createUnexpectedMultilineStringHandler(expectValue, $.onInvalidType),
                taggedUnion: createContext.createUnexpectedTaggedUnionHandler(expectValue, $.onInvalidType),
            }
        },
        expectSimpleString: $ => {

            const expectValue: i.ExpectErrorValue = {
                "type": "string",
                "null allowed": $.onNull !== undefined,
            }
            return expectSimpleStringImp(expectValue, $.callback, $.onInvalidType)
        },
        expectBoolean: $ => {
            const expectValue: i.ExpectErrorValue = {
                "type": "boolean",
                "null allowed": false,
            }
            return expectSimpleStringImp(
                expectValue,
                $$ => {
                    const onError = () => {
                        if ($.onInvalidType) {
                            $.onInvalidType({
                                annotation: $$.token.annotation,
                            })
                        } else {
                            raiseError(["invalid string", { expected: expectValue, found: serializeStringToken($$.token) }], $$.token.annotation)
                        }
                    }
                    if ($$.token.data.wrapping[0] !== "none") {
                        return onError()
                    }
                    if ($$.token.data.value === "true") {
                        return $.callback({
                            value: true,
                            token: $$.token,
                        })
                    }
                    if ($$.token.data.value === "false") {
                        return $.callback({
                            value: false,
                            token: $$.token,
                        })
                    }
                    return onError()
                },
                $.onInvalidType,
            )
        },
        expectNull: $ => {

            const expectValue: i.ExpectErrorValue = {
                "type": "null",
                "null allowed": false,
            }
            return expectSimpleStringImp(
                expectValue,
                $$ => {
                    const isNull = $$.token.data.wrapping[0] === "none"
                        && $$.token.data.value === "null"
                    if (!isNull) {
                        if ($.onInvalidType) {
                            $.onInvalidType({
                                annotation: $$.token.annotation,
                            })
                        } else {
                            raiseError(["invalid string", { expected: expectValue, found: serializeStringToken($$.token) }], $$.token.annotation)
                        }
                    }
                    return $.callback($$)
                },
                $.onInvalidType,
            )
        },
        expectNumber: $ => {

            const expectValue: i.ExpectErrorValue = {
                "type": "number",
                "null allowed": $.onNull !== undefined,
            }
            return expectSimpleStringImp(
                expectValue,
                $$ => {
                    const onError = () => {
                        if ($.onInvalidType) {
                            $.onInvalidType({
                                annotation: $$.token.annotation,
                            })
                        } else {
                            raiseError(["not a valid number", { value: serializeStringToken($$.token) }], $$.token.annotation)
                        }
                    }
                    if ($$.token.data.wrapping[0] !== "none") {
                        return onError()
                    }
                    //eslint-disable-next-line
                    const nr = new Number($$.token.data.value).valueOf()
                    if (isNaN(nr)) {
                        return onError()
                    }
                    return $.callback({
                        value: nr,
                        token: $$.token,
                    })
                },
                $.onInvalidType
            )
        },
        expectQuotedString: $ => {
            const expectValue: i.ExpectErrorValue = {
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
                                value: $$.token.data.value,
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
                            value: $$.token.data.value,
                            token: $$.token,
                        })
                    }
                },
                $.onInvalidType
            )
        },
        expectDictionary: $ => {

            const expectValue: i.ExpectErrorValue = {
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

            const expectValue: i.ExpectErrorValue = {
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

            const expectValue: i.ExpectErrorValue = {
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

            const expectValue: i.ExpectErrorValue = {
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

        expectType: $ => {

            const expectValue: i.ExpectErrorValue = {
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

            const expectValue: i.ExpectErrorValue = {
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