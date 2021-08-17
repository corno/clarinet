import { IFlattenedHandler } from "../interfaces/IFlattenedHandler"
import { StackContext } from "../types/StackContext"
import { RequiredValueHandler, TreeHandler, ValueHandler } from "../../parser/interfaces/ITreeHandler"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function flatten<InTokenAnnotation, InNonTokenAnnotation>(
    handler: IFlattenedHandler<InTokenAnnotation, InNonTokenAnnotation>,
): TreeHandler<InTokenAnnotation, InNonTokenAnnotation> {

    let dictionaryDepth = 0
    let verboseGroupDepth = 0
    let listDepth = 0
    let shorthandGroupDepth = 0
    let taggedUnionDepth = 0
    function createStackContext(): StackContext {
        return {
            dictionaryDepth: dictionaryDepth,
            verboseGroupDepth: verboseGroupDepth,
            listDepth: listDepth,
            shorthandGroupDepth: shorthandGroupDepth,
            taggedUnionDepth: taggedUnionDepth,
        }
    }

    function createDecoratedValue(
    ): ValueHandler<InTokenAnnotation, InNonTokenAnnotation> {
        return {
            object: $ => {
                switch ($.token.data.type[0]) {
                    case "dictionary": {
                        dictionaryDepth += 1
                        break
                    }
                    case "verbose group": {
                        verboseGroupDepth += 1
                        break
                    }
                    default:
                        assertUnreachable($.token.data.type[0])
                }
                handler.objectBegin({
                    token: $.token,
                    stackContext: createStackContext(),
                })
                let foundProperties = false
                return {
                    property: $$ => {
                        const wasFirst = !foundProperties
                        foundProperties = true
                        handler.property({
                            propertyToken: $$.token,
                            objectToken: $.token,
                            stackContext: createStackContext(),
                            isFirst: wasFirst,
                        })
                        return createDecoratedRequiredValue()
                    },
                    objectEnd: $$ => {
                        switch ($.token.data.type[0]) {
                            case "dictionary": {
                                dictionaryDepth -= 1
                                break
                            }
                            case "verbose group": {
                                verboseGroupDepth -= 1
                                break
                            }
                            default:
                                assertUnreachable($.token.data.type[0])
                        }
                        handler.objectEnd({
                            openToken: $.token,
                            token: $$.token,
                            isEmpty: !foundProperties,
                            stackContext: createStackContext(),
                        })
                    },
                }
            },
            array: $ => {
                switch ($.token.data.type[0]) {
                    case "list": {
                        listDepth += 1
                        break
                    }
                    case "shorthand group": {
                        shorthandGroupDepth += 1
                        break
                    }
                    default:
                        assertUnreachable($.token.data.type[0])
                }handler.arrayBegin({
                    token: $.token,
                    stackContext: createStackContext(),
                })
                let foundElements = false
                return {
                    element: $$ => {
                        const wasFirst = !foundElements
                        foundElements = true
                        handler.element({
                            arrayToken: $.token,
                            annotation: $$.annotation,
                            stackContext: createStackContext(),
                            isFirst: wasFirst,
                        })
                        return createDecoratedValue()
                    },
                    arrayEnd: $$ => {
                        switch ($.token.data.type[0]) {
                            case "list": {
                                listDepth -= 1
                                break
                            }
                            case "shorthand group": {
                                shorthandGroupDepth -= 1
                                break
                            }
                            default:
                                assertUnreachable($.token.data.type[0])
                        }
                        handler.arrayEnd({
                            openToken: $.token,
                            token: $$.token,
                            stackContext: createStackContext(),
                            isEmpty: !foundElements,
                        })
                    },
                }
            },
            simpleString: $ => {
                handler.simpleStringValue({
                token: $.token,
                stackContext: createStackContext(),
            })
            },
            multilineString: $ => {
                handler.multilineStringValue({
                    token: $.token,
                    stackContext: createStackContext(),
                })
            },
            taggedUnion: $ => {
                taggedUnionDepth += 1
                handler.taggedUnionBegin({
                    token: $.token,
                    stackContext: createStackContext(),
                })
                return {
                    option: $$ => {
                        handler.option({
                            token: $$.token,
                            stackContext: createStackContext(),
                        })
                        return createDecoratedRequiredValue()
                    },
                    missingOption: () => {
                    },
                    end: $$ => {
                        taggedUnionDepth -= 1
                        handler.taggedUnionEnd({
                            annotation: $$.annotation,
                            stackContext: createStackContext(),
                        })
                    },
                }
            },
        }
    }

    function createDecoratedRequiredValue(
    ): RequiredValueHandler<InTokenAnnotation, InNonTokenAnnotation> {
        return {
            exists: createDecoratedValue(),
            missing: () => { },
        }
    }
    return {
        root: createDecoratedRequiredValue(),
        onEnd: annotation => {
            handler.end(annotation)
        },
    }
}