import * as p from "pareto"
import * as core from "../../core"
import {
    createStructureParser, printStructureError, StructureErrorType,
} from "../structureParser"
import {
    printRange,
    Range,
} from "../../generic/location"
import {
    createStreamPreTokenizer,
} from "../streamPretokenizer"
import {
    createTokenizer,
} from "../tokenizer"
import { TokenizerAnnotationData } from "../../interfaces"
import { TokenError, printPreTokenizerError } from "../pretokenizer"
import { TreeParserErrorType } from "../../core"
import { printTreeParserError } from "../../core/implementations/treeParser/printTreeParserErrorError"

export function createErrorStreamHandler(withRange: boolean, callback: (stringifiedError: string) => void): ErrorStreamsHandler {
    function printRange2(range: Range) {
        if (!withRange) {
            return ""
        }
        return ` @ ${printRange(range)}`
    }
    return {
        onTokenizerError: $ => {
            callback(`${printPreTokenizerError($.error)}${printRange2($.range)}`)
        },
        onStructureParserError: $ => {
            callback(`${printStructureError($.error)}${printRange2($.annotation.range)}`)
        },
        onTreeParserError: $ => {
            callback(`${printTreeParserError($.error)}${printRange2($.annotation.range)}`)
        },
    }
}

export type ErrorStreamsHandler = {
    onTokenizerError: ($: {
        error: TokenError
        range: Range
    }) => void
    onStructureParserError: ($: {
        error: StructureErrorType
        annotation: TokenizerAnnotationData
    }) => void
    onTreeParserError: ($: {
        error: TreeParserErrorType
        annotation: TokenizerAnnotationData
    }) => void
}

/**
 * the top level function for this package.
 * @param onSchemaDataStart a callback that should provide a handler for the (optional) schema part of the text
 * @param onInstanceDataStart a callback that must provide a handler for the instance data part of the text
 * @param onTokenizerError an optional callback for when a tokenizer error occurs.
 * @param onParserError an optional callback for when a parser error occurs.
 * @param onHeaderOverheadToken an optional callback for handling overhead tokens in the header (comments, whitespace, newlines).
 */
export function createParserStack($: {
    onEmbeddedSchema: (schemaSchemaName: string, firstTokenAnnotation: TokenizerAnnotationData) => core.TreeHandler<TokenizerAnnotationData, null>
    onSchemaReference: (token: core.SimpleStringToken<TokenizerAnnotationData>) => p.IValue<boolean>
    onBody: (annotation: TokenizerAnnotationData) => core.TreeHandler<TokenizerAnnotationData, null>
    onEnd: (endAnnotation: TokenizerAnnotationData) => p.IValue<null>
    errorStreams: ErrorStreamsHandler
}): p.IStreamConsumer<string, null, null> {
    return createStreamPreTokenizer(
        createTokenizer(
            createStructureParser({
                onEmbeddedSchema: $.onEmbeddedSchema,
                onSchemaReference: $.onSchemaReference,
                onBody: $.onBody,
                onTreeError: $.errorStreams.onTreeParserError,
                onStructureError: $.errorStreams.onStructureParserError,
                onEnd: $.onEnd,
            }),
        ),
        $.errorStreams.onTokenizerError,
    )
}