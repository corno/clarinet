import { DiagnosticSeverity } from "../../diagnosticSeverity/types/DiagnosticSeverity"
import * as def from "../../schema/types/definitions"
import { UnmarshallError } from "../types/UnmarshallError"

import * as t from "../interfaces/ITypedTreeHandler"

import { defaultInitializeValue } from "../functions/createValueUnmarshaller"


export type ValueContext<TokenAnnotation, NonTokenAnnotation> = {
    definition: def.ValueDefinition
    handler: t.ITypedValueHandler<TokenAnnotation, NonTokenAnnotation>
}

export interface IShorthandParsingState<TokenAnnotation, NonTokenAnnotation> {
    wrapup(
        annotation: TokenAnnotation,
        onError: (message: UnmarshallError, annotation: TokenAnnotation, severity: DiagnosticSeverity) => void
    ): void
    findNextValue(): ValueContext<TokenAnnotation, NonTokenAnnotation> | null
    pushGroup(
        definition: def.GroupDefinition,
         handler: t.ITypedValueHandler<TokenAnnotation, NonTokenAnnotation>
         ): void
    pushTaggedUnion(
        definition: def.OptionDefinition,
        taggedUnionHandler: t.ITypedTaggedUnionHandler<TokenAnnotation, NonTokenAnnotation>,
        optionHandler: t.ITypedValueHandler<TokenAnnotation, NonTokenAnnotation>,
    ): void
}

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

type OptionContext<TokenAnnotation, NonTokenAnnotation> = {
    definition: def.OptionDefinition
    optionHandler: t.ITypedValueHandler<TokenAnnotation, NonTokenAnnotation>
    taggedUnionHandler: t.ITypedTaggedUnionHandler<TokenAnnotation, NonTokenAnnotation>
}

type PropertyContext<TokenAnnotation, NonTokenAnnotation> = {
    name: string
    definition: def.ValueDefinition
    handler: t.IGroupHandler<TokenAnnotation, NonTokenAnnotation>
}

type ExpectedElements<TokenAnnotation, NonTokenAnnotation> = PropertyContext<TokenAnnotation, NonTokenAnnotation>[]

type GroupContext<TokenAnnotation, NonTokenAnnotation> = {
    isOuterGroup: boolean
    elements: ExpectedElements<TokenAnnotation, NonTokenAnnotation>
    handler: t.IGroupHandler<TokenAnnotation, NonTokenAnnotation>
    index: number
}

function createGroupContext<TokenAnnotation, NonTokenAnnotation>(
    definition: def.GroupDefinition,
    isOuterGroup: boolean,
    subHandler: t.IGroupHandler<TokenAnnotation, NonTokenAnnotation>,
): Context<TokenAnnotation, NonTokenAnnotation> {
    const expectedElements: ExpectedElements<TokenAnnotation, NonTokenAnnotation> = []
    definition.properties.forEach((propDefinition, propKey) => {
        expectedElements.push({
            name: propKey,
            handler: subHandler,
            definition: propDefinition.value,
        })
    })
    return ["group", {
        elements: expectedElements,
        isOuterGroup: isOuterGroup,
        handler: subHandler,
        index: 0,
    }]
}

type Context<TokenAnnotation, NonTokenAnnotation> =
    | ["group", GroupContext<TokenAnnotation, NonTokenAnnotation>]
//FIXME move option context here so tagged union onEnd can be called

type StateImp<TokenAnnotation, NonTokenAnnotation> = {
    stack: Context<TokenAnnotation, NonTokenAnnotation>[]
    currentContext: Context<TokenAnnotation, NonTokenAnnotation>
    optionContext: null | OptionContext<TokenAnnotation, NonTokenAnnotation>
}

export function createShorthandParsingState<TokenAnnotation, NonTokenAnnotation>(
    groupDefinition: def.GroupDefinition,
    groupHandler: t.IGroupHandler<TokenAnnotation, NonTokenAnnotation>,

): IShorthandParsingState<TokenAnnotation, NonTokenAnnotation> {
    const stateImp: StateImp<TokenAnnotation, NonTokenAnnotation> = {
        stack: [],
        currentContext: createGroupContext(
            groupDefinition,
            true,
            groupHandler
        ),
        optionContext: null,
    }
    return {
        pushTaggedUnion: (definition, taggedUnionHandler, optionHandler) => {
            stateImp.optionContext = {
                definition: definition,
                taggedUnionHandler: taggedUnionHandler,
                optionHandler: optionHandler,
            }
        },
        pushGroup: (definition, handler) => {
            stateImp.stack.push(stateImp.currentContext)
            stateImp.currentContext = createGroupContext(
                definition,
                false,
                handler.onGroup({
                    type: ["mixin"],
                    definition: definition,
                }),
            )
        },
        wrapup: (annotation, onError) => {
            function wrapupImp(state: StateImp<TokenAnnotation, NonTokenAnnotation>) {
                if (stateImp.optionContext !== null) {
                    defaultInitializeValue(
                        stateImp.optionContext.definition.value,
                        stateImp.optionContext.optionHandler,
                        onError,
                    )
                    stateImp.optionContext = null
                }
                switch (state.currentContext[0]) {
                    case "group":
                        const $ = state.currentContext[1]
                        const missing = $.elements.length - $.index
                        if (missing > 0) {
                            onError(
                                ["missing elements", { elements: $.elements.slice($.index).map(ee => ee.name) }],
                                annotation,
                                DiagnosticSeverity.error
                            )
                            for (let x = $.index; x !== $.elements.length; x += 1) {
                                const ee = $.elements[x]

                                defaultInitializeValue(
                                    ee.definition,
                                    ee.handler.onProperty({
                                        key: ee.name,
                                        token: null,
                                        definition: ee.definition,
                                    }),
                                    onError,
                                )
                            }
                        }
                        $.handler.onClose({
                            token: $.isOuterGroup
                                ? {
                                    data: {},
                                    annotation: annotation,
                                }
                                : null,
                        })
                        break
                    default:
                        assertUnreachable(state.currentContext[0])
                }
                const previousContext = state.stack.pop()
                if (previousContext !== undefined) {
                    state.currentContext = previousContext
                    wrapupImp(state)
                }
            }
            wrapupImp(stateImp)
        },
        findNextValue: () => {
            function findNextValueImp(): null | ValueContext<TokenAnnotation, NonTokenAnnotation> {
                if (stateImp.optionContext !== null) {
                    const tmp = stateImp.optionContext
                    stateImp.optionContext = null
                    return {
                        definition: tmp.definition.value,
                        handler: tmp.optionHandler,

                    }
                }
                switch (stateImp.currentContext[0]) {
                    case "group":
                        const $ = stateImp.currentContext[1]
                        const ee = $.elements[$.index]
                        $.index++
                        if (ee !== undefined) {
                            return {
                                definition: ee.definition,
                                handler: ee.handler.onProperty({
                                    token: null,
                                    key: ee.name,
                                    definition: ee.definition,
                                }),
                            }
                        } else {
                            //end of array of properties
                            $.handler.onClose({
                                token: null,
                            })
                            const previousContext = stateImp.stack.pop()
                            if (previousContext === undefined) {
                                return null
                            } else {
                                stateImp.currentContext = previousContext
                                return findNextValueImp()
                            }
                        }
                    default:
                        return assertUnreachable(stateImp.currentContext[0])
                }
            }
            return findNextValueImp()
        },
    }
}
