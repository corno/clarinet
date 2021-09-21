
import { GroupDefinition, ValueDefinition, TaggedUnionDefinition } from "../../schema/types/definitions"
import { ITypedTreeHandler, ITypedValueHandler, IGroupHandler } from "../../typed/interfaces/ITypedTreeHandler"
import { Token } from "../../parser/types/tokens"
import { createSerializedNonWrappedString, createSerializedQuotedString } from "../../serializers/functions/stringSerialization"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}
function cc<T, RT>(input: T, callback: (output: T) => RT): RT {
    return callback(input)
}

type GetCodeCompletions = () => string[]
interface IAlternativesRoot {
    root: ILine
    serialize: () => string[]
}

interface IStep {
    addOption: () => ILine
}

interface IBlock {
    addLine: () => ILine
}

interface ILine {
    snippet(str: string): void
    indent(callback: ($: IBlock) => void): void
    addTaggedUnionStep: () => IStep
}

function createCodeCompletionForValue(
    value: ValueDefinition,
    sequence: ILine,
    onTaggedUnion: (def: TaggedUnionDefinition) => void,
    onGroup: (def: GroupDefinition) => void,
): void {
    switch (value.type[0]) {
        case "dictionary": {
            sequence.snippet(` { }`)
            break
        }
        case "list": {
            sequence.snippet(` [ ]`)
            break
        }
        case "type reference": {
            const $ = value.type[1]
            createCodeCompletionForValue(
                $.type.get().value,
                sequence,
                onTaggedUnion,
                onGroup
            )
            break
        }
        case "tagged union": {
            const $ = value.type[1]
            onTaggedUnion($)
            break
        }
        case "simple string": {
            const $ = value.type[1]
            if ($.quoted) {
                sequence.snippet(` "${$["default value"]}"`)
            } else {
                sequence.snippet(` ${$["default value"]}`)
            }
            break
        }
        case "multiline string": {
            sequence.snippet(` \`\``)
            break
        }
        case "group": {
            const $ = value.type[1]
            onGroup($)
            break
        }
        default:
            assertUnreachable(value.type[0])
    }
}

function createCodeCompletionForShorthandValue(
    definition: ValueDefinition,
    sequence: ILine,
): void {
    createCodeCompletionForValue(
        definition,
        sequence,
        ($) => {
            const step = sequence.addTaggedUnionStep()
            $.options.forEach((option, optionName) => {
                const seq = step.addOption()
                seq.snippet(` '${optionName}'`)
                createCodeCompletionForShorthandValue(option.value, seq)
            })
        },
        ($) => {
            createCodeCompletionForShorthandGroup($, sequence)
        },
    )
}

function createCodeCompletionForShorthandGroup(
    group: GroupDefinition,
    sequence: ILine,
): void {
    group.properties.forEach((prop, _propKey) => {
        createCodeCompletionForShorthandValue(
            prop.value,
            sequence,
        )
    })
}

function createCodeCompletionsForTaggedUnion(
    $: TaggedUnionDefinition,
    sequence: ILine,
): void {
    sequence.snippet(` '${$["default option"].name}'`)
    createCodeCompletionsForValue(
        $["default option"].get().value,
        sequence
    )
}

function createCodeCompletionForVerboseValue(prop: ValueDefinition, sequence: ILine): void {
    createCodeCompletionForValue(
        prop,
        sequence,
        ($) => {
            sequence.snippet(` | '${$["default option"].name}'`)
            createCodeCompletionForVerboseValue($["default option"].get().value, sequence)
        },
        ($) => {
            sequence.snippet(` (`)
            createCodeCompletionForVerboseProperties($, sequence)
            sequence.snippet(`)`)
        },
    )
}

function createCodeCompletionForVerboseProperties(
    group: GroupDefinition,
    sequence: ILine,
): void {
    let dirty = false
    sequence.indent(($) => {
        group.properties.forEach((prop, propKey) => {
            dirty = true
            const line = $.addLine()
            line.snippet(`'${propKey}':`)
            createCodeCompletionForVerboseValue(prop.value, line)
        })
    })
    if (!dirty) {
        sequence.snippet(' ')
    }
}

export type OnToken<TokenAnnotation> = (
    annotation: TokenAnnotation,
    getCodeCompletionsInToken: GetCodeCompletions | null,
    getCodeCompletionsAfterToken: GetCodeCompletions | null,
) => void

function createAlternativesRoot(): IAlternativesRoot {
    type StepType =
        | ["block", {
            block: ABlock
        }]
        | ["snippet", {
            value: string
        }]
        | ["tagged union", {
            "alts": ASequence[]
        }]
    type ASequence = StepType[]

    type ABlock = {
        lines: ASequence[]
    }

    const rootSequence: ASequence = []

    function createBlock(imp: ABlock): IBlock {
        return {
            addLine: () => {
                const seq: ASequence = []
                imp.lines.push(seq)
                return createSequence(seq)
            },
        }
    }

    function createSequence(imp: ASequence): ILine {
        return {
            indent: (callback) => {
                const block: ABlock = {
                    lines: [],
                }
                imp.push(["block", {
                    block: block,
                }])
                callback(createBlock(block))
            },
            snippet: (str: string) => {
                imp.push(["snippet", { value: str }])
            },
            addTaggedUnionStep: () => {
                function createStep(sequence: ASequence): IStep {
                    const alts: ASequence[] = []
                    sequence.push(["tagged union", { alts: alts }])
                    return {
                        addOption: () => {
                            const subSeq: ASequence = []
                            alts.push(subSeq)
                            return createSequence(subSeq)
                        },
                    }
                }
                return createStep(imp)
            },
        }
    }

    return {
        root: createSequence(rootSequence),
        serialize: () => {
            let indentationLevel = 0
            function createIndentation() {
                let str = ""
                for (let i = 0; i !== indentationLevel; i += 1) {
                    str += "    "
                }
                return str
            }
            function ser(seed: string[], s: ASequence, add: (str: string) => void): void {
                let out = seed
                for (let i = 0; i !== s.length; i += 1) {
                    const step = s[i]
                    switch (step[0]) {
                        case "block":
                            cc(step[1], (step2) => {
                                indentationLevel += 1
                                step2.block.lines.forEach((l) => {
                                    const temp: string[] = []
                                    ser(out.map((str) => `${str}\n${createIndentation()}`), l, (str) => temp.push(str))
                                    out = temp
                                })
                                indentationLevel -= 1
                                if (step2.block.lines.length !== 0) {
                                    out = out.map((str) => `${str}\n${createIndentation()}`)
                                }
                                //
                            })
                            break
                        case "snippet":
                            cc(step[1], (step2) => {
                                out = out.map((str) => {
                                    return str + step2.value
                                })
                            })
                            break
                        case "tagged union":
                            cc(step[1], (step2) => {
                                const temp: string[] = []
                                for (let j = 0; j !== step2.alts.length; j += 1) {
                                    const alt = step2.alts[j]
                                    ser(out, alt, (str) => temp.push(str))
                                }
                                out = temp
                            })
                            break
                        default:
                            assertUnreachable(step[0])
                    }
                }

                out.forEach((str) => {
                    add(str)
                })
            }
            const res: string[] = []
            ser([""], rootSequence, (str) => res.push(str))
            return res
        },
    }
}

function createCodeCompletionsForValue(
    definition: ValueDefinition,
    line: ILine,
): void {
    createCodeCompletionForValue(
        definition,
        line,
        ($) => {
            line.snippet(` |`)
            createCodeCompletionsForTaggedUnion(
                $,
                line,
            )
        },
        ($) => {
            const tus = line.addTaggedUnionStep()
            const verbose = tus.addOption()
            verbose.snippet(` (`)
            createCodeCompletionForVerboseProperties(
                $,
                verbose,
            )
            verbose.snippet(`)`)

            const shorthand = tus.addOption()
            shorthand.snippet(` <`)
            createCodeCompletionForShorthandGroup(
                $,
                shorthand,
            )
            shorthand.snippet(` >`)
        }
    )
}

export function createCodeCompletionsGenerator<TokenAnnotation, NonTokenAnnotation>(
    onToken: OnToken<TokenAnnotation>,
    onEnd: () => void,

): ITypedTreeHandler<TokenAnnotation, NonTokenAnnotation> {
    function createValueHandler(
    ): ITypedValueHandler<TokenAnnotation, NonTokenAnnotation> {
        function ifToken<Data>(
            token: Token<Data, TokenAnnotation> | null,
            inToken: GetCodeCompletions | null,
            afterToken: GetCodeCompletions | null,
        ) {
            if (token === null) {
                return
            }
            onToken(
                token.annotation,
                inToken,
                afterToken,
            )
        }
        function addDummyOnToken<Data>(token: Token<Data, TokenAnnotation> | null) {
            ifToken(
                token,
                null,
                null,
            )
        }

        function doGroup(
            annotation: TokenAnnotation | null,
            alternatives: string[],
        ): IGroupHandler<TokenAnnotation, NonTokenAnnotation> {
            if (annotation !== null) {
                onToken(
                    annotation,
                    null,
                    () => {
                        return alternatives
                    },
                )

            }
            return {
                onProperty: ($) => {
                    ifToken(
                        $.token,
                        null,
                        () => {
                            const propAlts = createAlternativesRoot()
                            createCodeCompletionsForValue(
                                $.definition,
                                propAlts.root,
                            )
                            return propAlts.serialize()
                        }
                    )
                    return createValueHandler()
                },
                onUnexpectedProperty: ($) => {
                    onToken(
                        $.token.annotation,
                        () => {
                            return $.expectedProperties
                        },
                        null,
                    )
                },
                onClose: ($$) => {
                    ifToken(
                        $$.token,
                        () => {
                            return alternatives
                        },
                        null,
                    )
                },
            }
        }

        return {
            onDictionary: ($) => {
                addDummyOnToken($.token)
                return {
                    onClose: ($) => {
                        addDummyOnToken($.token)
                    },
                    onEntry: ($$) => {
                        ifToken(
                            $$.token,
                            null,
                            () => {
                                const entryAlts = createAlternativesRoot()
                                createCodeCompletionsForValue(
                                    $.definition.value,
                                    entryAlts.root,
                                )
                                return entryAlts.serialize()
                            }
                        )
                        return createValueHandler()
                    },
                }
            },
            onList: ($) => {
                addDummyOnToken($.token)
                return {
                    onClose: ($) => {
                        addDummyOnToken($.token)
                    },
                    onElement: () => {
                        return createValueHandler()
                    },
                }
            },
            onTaggedUnion: ($) => {
                ifToken(
                    $.token,
                    null,
                    () => {
                        const alternatives = createAlternativesRoot()
                        createCodeCompletionsForTaggedUnion(
                            $.definition,
                            alternatives.root,
                        )
                        return alternatives.serialize()
                    }
                )
                return {
                    onUnexpectedOption: ($$) => {
                        onToken(
                            $$.token.annotation,
                            () => {
                                return $$.expectedOptions
                            },
                            null,
                        )
                        return createValueHandler()
                    },
                    onOption: ($$) => {
                        addDummyOnToken($$.token)
                        return createValueHandler()
                    },
                    onEnd: () => {

                    },
                }
            },
            onSimpleString: ($) => {
                ifToken(
                    $.token,
                    () => {

                        return [
                            $.definition.quoted
                                ? createSerializedQuotedString($.definition["default value"])
                                : createSerializedNonWrappedString($.definition["default value"]),
                        ]
                    },
                    // () => {
                    //     return $.getSuggestions().map(sugg => {
                    //         return $.definition.quoted ? `"${sugg}"` : sugg
                    //     })
                    // },
                    null,
                )
            },
            onMultilineString: ($) => {
                addDummyOnToken($.token)
            },
            onTypeReference: () => {
                return createValueHandler()
            },
            onGroup: ($) => {
                const definition = $.definition
                switch ($.type[0]) {
                    case "mixin":
                        return doGroup(
                            null,
                            [],
                        )
                    case "omitted":
                        return doGroup(
                            null,
                            [],
                        )
                    case "shorthand":
                        return cc($.type[1], ($) => {
                            const alternatives = createAlternativesRoot()
                            createCodeCompletionForShorthandGroup(
                                definition,
                                alternatives.root,
                            )
                            return doGroup(
                                $.annotation,
                                alternatives.serialize()
                            )
                        })
                    case "verbose":
                        return cc($.type[1], ($) => {
                            const alternatives = createAlternativesRoot()
                            createCodeCompletionForVerboseProperties(definition, alternatives.root)
                            return doGroup(
                                $.annotation,
                                alternatives.serialize(),
                            )
                        })
                    default:
                        return assertUnreachable($.type[0])
                }
            },
        }
    }

    return {
        root: createValueHandler(),
        onEnd: onEnd,
    }
}