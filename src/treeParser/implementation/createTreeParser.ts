/* eslint
    no-underscore-dangle: "off",
    complexity: off,
*/
import * as i from "../../Iuntyped"
import { TreeParserErrorType } from "../functionTypes"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function createTreeParser<TokenAnnotation>(
    treeHandler: i.TreeHandler<TokenAnnotation, null>,
    onError: ($: {
        error: TreeParserErrorType
        annotation: TokenAnnotation
    }) => void,
    createUnexpectedValueHandler: () => i.ValueHandler<TokenAnnotation, null>,
    onEnd: (annotation: TokenAnnotation) => void,
): i.ITreeParser<TokenAnnotation> {
    function raiseError(error: TreeParserErrorType, annotation: TokenAnnotation) {
        onError({
            error: error,
            annotation: annotation,
        })
    }
    type TaggedUnionState =
        | ["expecting option", {
        }]
        | ["expecting value", i.RequiredValueHandler<TokenAnnotation, null>]

    type ObjectContext = {
        type:
        | ["dictionary"]
        | ["verbose group"]
        readonly objectHandler: i.ObjectHandler<TokenAnnotation, null>
        propertyHandler: null | i.RequiredValueHandler<TokenAnnotation, null>
    }

    type ArrayContext = {
        type:
        | ["list"]
        | ["shorthand group"]
        foundElements: boolean
        readonly arrayHandler: i.ArrayHandler<TokenAnnotation, null>
    }

    type TaggedUnionContext = {
        readonly handler: i.TaggedUnionHandler<TokenAnnotation, null>
        state: TaggedUnionState
    }

    type ContextType =
        | ["object", ObjectContext]
        | ["array", ArrayContext]
        | ["taggedunion", TaggedUnionContext]
    let currentTreeHandler: i.TreeHandler<TokenAnnotation, null> | null = treeHandler //becomes null when processed
    let currentContext: ContextType | null = null
    const stack: (ContextType)[] = []

    function closeObjectImp(
        $: ObjectContext,
        annotation: TokenAnnotation,
    ): void {
        pop(
            annotation,
        )
    }
    function closeArrayImp(
        $: ArrayContext,
        annotation: TokenAnnotation,
    ): void {
        pop(
            annotation,
        )
    }
    function forceTaggedUnionClose(
        context: TaggedUnionContext,
        annotation: TokenAnnotation,

    ) {
        if (context.state[0] === "expecting value") {
            context.state[1].missing()
            raiseError(["missing tagged union value"], annotation)
        } else {
            context.handler.missingOption()
            raiseError(["missing tagged union option and value"], annotation)
        }
        closeTaggedUnionImp(annotation)
    }
    function closeTaggedUnionImp(
        annotation: TokenAnnotation,
    ): void {
        pop(
            annotation,
        )
    }
    function pop(
        annotation: TokenAnnotation,
    ): void {
        const previousContext = stack.pop()
        if (previousContext === undefined) {
            //raiseError(["unexpected end of text", { "still in": [stillin] }], annotation)
            currentContext = null
        } else {
            if (previousContext[0] === "taggedunion") {
                const taggedUnion = previousContext[1]
                if (taggedUnion.state[0] !== "expecting value") {
                    raiseError(["missing option"], annotation)
                } else {
                    taggedUnion.handler.end({
                        annotation: null,
                    })
                }
            }
            currentContext = previousContext
        }
        wrapupValue(annotation)
    }
    function push(newContext: ContextType): void {
        if (currentContext !== null) {
            stack.push(currentContext)
        }
        currentContext = newContext
        switch (newContext[0]) {
            case "array": {
                const $ = newContext[1]
                switch ($.type[0]) {
                    case "list": {
                        break
                    }
                    case "shorthand group": {
                        break
                    }
                    default:
                        assertUnreachable($.type[0])
                }
                break
            }
            case "object": {
                const $ = newContext[1]
                switch ($.type[0]) {
                    case "dictionary": {
                        break
                    }
                    case "verbose group": {
                        break
                    }
                    default:
                        assertUnreachable($.type[0])
                }
                break
            }
            case "taggedunion": {
                break
            }
            default:
                assertUnreachable(newContext[0])
        }
    }
    function wrapupValue(
        annotation: TokenAnnotation,
    ): void {
        if (currentContext === null) {
            currentTreeHandler = null
            treeHandler.onEnd(annotation)
            onEnd(annotation)
        } else {
            switch (currentContext[0]) {
                case "array": {
                    break
                }
                case "object": {
                    currentContext[1].propertyHandler = null
                    break
                }
                case "taggedunion": {
                    if (currentContext[1].state[0] !== "expecting value") {
                        console.error("HANDLE UNEXPECTED TAGGED UNION VALUE END")
                    }
                    closeTaggedUnionImp(
                        annotation,
                    )
                    break
                }
                default:
                    return assertUnreachable(currentContext[0])
            }
        }
    }
    function getValueHandler(annotation: TokenAnnotation): i.ValueHandler<TokenAnnotation, null> {
        if (currentContext === null) {
            if (currentTreeHandler === null) {
                raiseError(["unexpected data after end"], annotation)
                return createUnexpectedValueHandler()
            }
            return currentTreeHandler.root.exists
        } else {
            switch (currentContext[0]) {
                case "array": {
                    const $ = currentContext[1]
                    $.foundElements = true
                    return currentContext[1].arrayHandler.element({
                        annotation: null,
                    })
                }
                case "object": {
                    if (currentContext[1].propertyHandler === null) {
                        raiseError(["missing key"], annotation)
                        return createUnexpectedValueHandler()
                    } else {
                        return currentContext[1].propertyHandler.exists
                    }
                }
                case "taggedunion": {
                    if (currentContext[1].state[0] !== "expecting value") {
                        raiseError(["missing option"], annotation)
                        return createUnexpectedValueHandler()
                    } else {
                        return currentContext[1].state[1].exists
                    }
                }
                default:
                    return assertUnreachable(currentContext[0])
            }
        }
    }
    return {
        forceEnd: endAnnotation => {
            unwindLoop: while (true) {
                if (currentContext === null) {

                    if (currentTreeHandler !== null) {
                        currentTreeHandler.root.missing()
                        currentTreeHandler = null
                    }
                    break unwindLoop
                }
                switch (currentContext[0]) {
                    case "array": {
                        const $ = currentContext[1]
                        raiseError(["unexpected end of text", { "still in": ["array"] }], endAnnotation)
                        closeArrayImp(
                            $,
                            endAnnotation,
                        )
                        break
                    }
                    case "object": {
                        const $ = currentContext[1]
                        if ($.propertyHandler !== null) {
                            $.propertyHandler.missing()
                            $.propertyHandler = null
                        }
                        raiseError(["unexpected end of text", { "still in": ["object"] }], endAnnotation)
                        closeObjectImp(
                            $,
                            endAnnotation,
                        )
                        break
                    }
                    case "taggedunion": {
                        const $ = currentContext[1]
                        switch ($.state[0]) {
                            case "expecting option": {
                                //const $$ = $.state[1]
                                $.handler.missingOption()
                                break
                            }
                            case "expecting value": {
                                const $$ = $.state[1]
                                //option not yet parsed
                                $$.missing()

                                break
                            }
                            default:
                                assertUnreachable($.state[0])
                        }
                        raiseError(["unexpected end of text", { "still in": ["tagged union"] }], endAnnotation)
                        closeTaggedUnionImp(
                            endAnnotation,
                        )

                        break
                    }
                    default:
                        assertUnreachable(currentContext[0])
                }
            }
        },
        taggedUnion: $ => {
            push(["taggedunion", {
                handler: getValueHandler($.annotation).taggedUnion({
                    token: $,
                }),
                state: ["expecting option", {
                }],
            }])
        },
        multilineString: $ => {
            getValueHandler($.annotation).multilineString({
                token: $,
            })
            wrapupValue(
                $.annotation,
            )
        },
        simpleString: $ => {
            function onStringValue(
            ): void {
                getValueHandler($.annotation).simpleString({
                    token: $,
                })
                wrapupValue(
                    $.annotation,
                )
            }
            if (currentContext === null) {
                onStringValue()
            } else {
                switch (currentContext[0]) {
                    case "array": {
                        onStringValue()
                        break
                    }
                    case "object": {
                        const $$ = currentContext[1]
                        if ($$.propertyHandler === null) {
                            $$.propertyHandler = $$.objectHandler.property({
                                token: $,
                            })
                            break
                        } else {
                            onStringValue()
                            break
                        }
                    }
                    case "taggedunion": {
                        const $$ = currentContext[1]
                        switch ($$.state[0]) {
                            case "expecting option": {
                                $$.state = ["expecting value", $$.handler.option({
                                    token: $,
                                })]
                                break
                            }
                            case "expecting value": {
                                onStringValue()
                                break
                            }
                            default:
                                assertUnreachable($$.state[0])
                        }
                        break
                    }
                    default:
                        assertUnreachable(currentContext[0])
                }
            }
        },
        openObject: $ => {
            push(["object", {
                type: $.data.type[0] === "verbose group" ? ["verbose group"] : ["dictionary"],
                objectHandler: getValueHandler($.annotation).object({
                    token: $,
                }),
                propertyHandler: null,
            }])
        },
        openArray: $ => {
            push(["array", {
                foundElements: false,
                type: $.data.type[0] === "shorthand group" ? ["shorthand group"] : ["list"],
                arrayHandler: getValueHandler($.annotation).array({
                    token: $,
                }),
            }])
        },
        closeObject: $$ => {
            unwindLoop: while (true) {
                if (currentContext === null) {
                    break unwindLoop
                }
                switch (currentContext[0]) {
                    case "array": {
                        const $ = currentContext[1]
                        raiseError(["missing array close"], $$.annotation)
                        closeArrayImp(
                            $,
                            $$.annotation,
                        )
                        break
                    }
                    case "object": {

                        break unwindLoop
                        break
                    }
                    case "taggedunion": {
                        const $ = currentContext[1]
                        forceTaggedUnionClose(
                            $,
                            $$.annotation,
                        )
                        break
                    }
                    default:
                        assertUnreachable(currentContext[0])
                }
            }
            if (currentContext === null || currentContext[0] !== "object") {
                raiseError(["unexpected end of object"], $$.annotation)
            } else {

                const $$$ = currentContext[1]
                if ($$$.propertyHandler !== null) {
                    //was in the middle of processing a property
                    //the key was parsed, but the data was not
                    raiseError(["missing property value"], $$.annotation)
                    $$$.propertyHandler.missing()
                    $$$.propertyHandler = null
                }
                $$$.objectHandler.objectEnd({
                    token: $$,
                })
                closeObjectImp(
                    $$$,
                    $$.annotation,
                )
            }
        },
        closeArray: $ => {
            unwindLoop: while (true) {
                if (currentContext === null) {
                    break unwindLoop
                }
                switch (currentContext[0]) {
                    case "array": {
                        break unwindLoop
                        break
                    }
                    case "object": {
                        const $$2 = currentContext[1]
                        raiseError(["missing object close"], $.annotation)
                        closeObjectImp(
                            $$2,
                            $.annotation,
                        )
                        break
                    }
                    case "taggedunion": {
                        forceTaggedUnionClose(
                            currentContext[1],
                            $.annotation,
                        )
                        break
                    }
                    default:
                        assertUnreachable(currentContext[0])
                }
            }
            if (currentContext === null || currentContext[0] !== "array") {
                raiseError(["unexpected end of array"], $.annotation)
            } else {
                const $$ = currentContext[1]
                switch ($$.type[0]) {
                    case "list": {
                        break
                    }
                    case "shorthand group": {

                        break
                    }
                    default:
                        assertUnreachable($$.type[0])
                }
                $$.arrayHandler.arrayEnd({
                    token: $,
                })
                closeArrayImp(
                    $$,
                    $.annotation,
                )
            }
        },
    }
}