import { SimpleString } from "../../parser/types/tokens"
import { StackContext } from "../../flattened/types/StackContext"

import { IFlattenedHandler } from "../../flattened/interfaces/IFlattenedHandler"
import { IFormatInstructionWriter } from "../interfaces/IFormatInstructionWriter"

import * as stringSerialization from "./stringSerialization"


function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function createASTNNormalizer<TokenAnnotation, NonTokenAnnotation>(
    indentationString: string,
    newline: string,
    writer: IFormatInstructionWriter<TokenAnnotation, NonTokenAnnotation>,
): IFlattenedHandler<TokenAnnotation, NonTokenAnnotation> {

    function createIndentation(context: StackContext) {
        const depth = context.dictionaryDepth + context.verboseGroupDepth + context.listDepth
        let indentation = newline
        for (let x = 0; x !== depth; x += 1) {
            indentation += indentationString
        }
        return indentation
    }
    return {
        objectBegin: $ => {
            writer.token(
                {
                    stringBefore: ``,
                    token: `${$.token.data.type[0] === "verbose group" ? "(" : "{"}`,
                    stringAfter: ``,
                },
                $.token.annotation,
            )
        },
        property: $ => {
            writer.token(
                {
                    stringBefore: `${createIndentation($.stackContext)}`,
                    token: ((): string => {
                        switch ($.objectToken.data.type[0]) {
                            case "verbose group": {
                                return stringSerialization.createSerializedApostrophedString($.propertyToken.data.value)
                            }
                            case "dictionary": {
                                return stringSerialization.createSerializedQuotedString($.propertyToken.data.value)
                            }
                            default:
                                return assertUnreachable($.objectToken.data.type[0])
                        }
                    })(),
                    stringAfter: `: `,
                },
                $.propertyToken.annotation,
            )
        },
        objectEnd: $ => {
            writer.token(
                {
                    stringBefore: $.isEmpty ? ` ` : `${createIndentation($.stackContext)}`,
                    token: `${$.openToken.data.type[0] === "verbose group" ? ")" : "}"}`,
                    stringAfter: ``,
                },
                $.token.annotation,
            )
        },

        arrayBegin: $ => {
            writer.token(
                {
                    stringBefore: ``,
                    token: `${$.token.data.type[0] === "shorthand group" ? "<" : "["}`,
                    stringAfter: ``,
                },
                $.token.annotation,
            )
        },
        element: $ => {
            writer.nonToken(
                {
                    string: $.arrayToken.data.type[0] === "shorthand group"
                        ? ` `
                        : `${createIndentation($.stackContext)}`,
                },
                $.annotation,
            )
        },
        arrayEnd: $ => {
            writer.token(
                {
                    stringBefore: $.openToken.data.type[0] === "shorthand group"
                        ? ` `
                        : $.isEmpty ? ` ` : `${createIndentation($.stackContext)}`,
                    token: $.openToken.data.type[0] === "shorthand group"
                        ? `>`
                        : `]`,
                    stringAfter: ``,
                },
                $.token.annotation,
            )
        },

        simpleStringValue: $ => {
            function serializeSimpleString(
                $: SimpleString,
            ): string {
                switch ($.wrapping[0]) {
                    case "none": {
                        return stringSerialization.createSerializedNonWrappedString($.value)
                    }
                    case "quote": {
                        return stringSerialization.createSerializedQuotedString($.value)
                    }
                    case "apostrophe": {
                        return stringSerialization.createSerializedApostrophedString($.value)
                    }
                    default:
                        return assertUnreachable($.wrapping[0])
                }
            }
            writer.token(
                {
                    stringBefore: ``,
                    token: serializeSimpleString(
                        $.token.data,
                    ),
                    stringAfter: ``,
                },
                $.token.annotation,
            )
        },
        multilineStringValue: $ => {
            writer.token(
                {
                    stringBefore: ``,
                    token: stringSerialization.createSerializedMultilineString(
                        $.token.data.lines,
                        createIndentation($.stackContext),
                    ),
                    stringAfter: ``,
                },
                $.token.annotation,
            )
        },

        taggedUnionBegin: $ => {
            writer.token(
                {
                    stringBefore: ``,
                    token: `|`,
                    stringAfter: ` `,
                },
                $.token.annotation,
            )
        },
        option: $ => {
            writer.token(
                {
                    stringBefore: ``,
                    token: stringSerialization.createSerializedApostrophedString($.token.data.value),
                    stringAfter: ` `,
                },
                $.token.annotation,
            )
        },
        taggedUnionEnd: $ => {
            writer.nonToken(
                {
                    string: ``,
                },
                $.annotation,
            )
        },
        end: () => {

        },
    }
}
