import * as p from "pareto"

import { IParser } from "../../parser/interfaces/IParser"
import { IStructureErrorHandler } from "../../parser/interfaces/IStructureErrorHandler"
import { IFormatInstructionWriter } from "../interfaces/IFormatInstructionWriter"

import { flatten } from "../../flattened/functions/flatten"
import { createStructureParser } from "../../parser/functions/createStructureParser"
import { createASTNNormalizer } from "./createASTNNormalizer"

export function createASTNSerializer<TokenAnnotation>(
    indentationString: string,
    newline: string,
    write: (str: string) => void,
    errorHandler: IStructureErrorHandler<TokenAnnotation>,
): IParser<TokenAnnotation> {
    const writer: IFormatInstructionWriter<TokenAnnotation, null> = {
        token: (instruction) => {
            write(instruction.stringBefore)
            write(instruction.token)
            write(instruction.stringAfter)

        },
        nonToken: (instruction) => {
            write(instruction.string)
        },
    }
    let foundHeader = false
    return createStructureParser({
        onEmbeddedSchema: (_range) => {
            foundHeader = true
            write(`! `)
            return flatten(createASTNNormalizer(
                indentationString,
                newline,
                writer
            ))
        },
        onSchemaReference: ($$) => {
            foundHeader = true
            write(`! ${$$.token.data.value}\n`)
            return p.value(false)
        },
        onBody: () => {
            if (foundHeader) {
                write(newline)
            }
            return flatten(createASTNNormalizer(
                indentationString,
                newline,
                writer,
            ))
        },
        errors: errorHandler,
        onEnd: () => {
            write(newline)
        },
    })
}
