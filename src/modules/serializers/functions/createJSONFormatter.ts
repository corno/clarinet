import { StackContext } from "../../flattened/types/StackContext"

import { IFlattenedHandler } from "../../flattened/interfaces/IFlattenedHandler"
import { IFormatInstructionWriter } from "../interfaces/IFormatInstructionWriter"

import { createSerializedNonWrappedString, createSerializedQuotedString } from "./stringSerialization"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function createJSONFormatter<TokenAnnotation, NonTokenAnnotation>(
    indentationString: string,
    newline: string,
    writer: IFormatInstructionWriter<TokenAnnotation, NonTokenAnnotation>,
): IFlattenedHandler<TokenAnnotation, NonTokenAnnotation> {

    function createIndentation(context: StackContext) {
        let indentation = ``
        for (let x = 0; x !== context.dictionaryDepth + context.verboseGroupDepth; x += 1) {
            indentation += indentationString
        }
        return indentation
    }
    return {
        objectBegin: $ => {
            writer.token(
                {
                    stringBefore: ``,
                    token: `{`,
                    stringAfter: ``,
                },
                $.token.annotation,
            )
        },
        property: $ => {
            writer.token(
                {
                    stringBefore: `${$.isFirst ? "" : ","}${newline}${createIndentation($.stackContext)}`,
                    token: createSerializedQuotedString($.propertyToken.data.value),
                    stringAfter: `: `,
                },
                $.propertyToken.annotation
            )
        },
        objectEnd: $ => {
            writer.token(
                {
                    stringBefore: $.isEmpty ? ` ` : `${newline}${createIndentation($.stackContext)}`,
                    token: `}`,
                    stringAfter: ``,
                },
                $.token.annotation,
            )
        },

        arrayBegin: $ => {
            writer.token({
                stringBefore: ``,
                token: `[`,
                stringAfter: ``,
            },
                $.token.annotation,
            )
        },
        element: $ => {
            writer.nonToken(
                {
                    string: `${$.isFirst ? "" : ","} `,
                },
                $.annotation
            )
        },
        arrayEnd: $ => {
            writer.token(
                {
                    stringBefore: ` `,
                    token: `]`,
                    stringAfter: ``,
                },
                $.token.annotation,
            )
        },
        simpleStringValue: $ => {
            writer.token(
                {
                    stringBefore: ``,
                    token: ((): string => {

                        switch ($.token.data.wrapping[0]) {
                            case "none": {
                                if ($.token.data.value === "true" || $.token.data.value === "false" || $.token.data.value === "null") {
                                    return $.token.data.value
                                }
                                //eslint-disable-next-line
                                const nr = new Number($.token.data.value).valueOf()
                                if (isNaN(nr)) {
                                    return createSerializedQuotedString($.token.data.value)
                                }
                                return createSerializedNonWrappedString($.token.data.value)
                            }
                            case "quote": {
                                return createSerializedQuotedString($.token.data.value)
                            }
                            case "apostrophe": {
                                return createSerializedQuotedString($.token.data.value)
                            }
                            default:
                                return assertUnreachable($.token.data.wrapping[0])
                        }
                    })(),
                    stringAfter: ``,
                },
                $.token.annotation,
            )
        },
        multilineStringValue: $ => {
            writer.token(
                {
                    stringBefore: ``,
                    token: createSerializedQuotedString(
                        $.token.data.lines.join(newline),
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
                    token: `[`,
                    stringAfter: ``,
                },
                $.token.annotation,
            )
        },
        option: $ => {
            writer.token(
                {
                    stringBefore: ` `,
                    token: createSerializedQuotedString($.token.data.value),
                    stringAfter: `, `,
                },
                $.token.annotation,
            )
        },
        taggedUnionEnd: $ => {
            writer.nonToken(
                {
                    string: ` ]`,
                },
                $.annotation,
            )
        },
        end: () => {

        },
    }
}

