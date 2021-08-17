import * as p from "pareto"
import { flatten } from "../../../modules/flattened/functions/flatten"
import { createStructureParser } from "../../../modules/parser/functions/createStructureParser"
import { IParser } from "../../../modules/parser/interfaces/IParser"
import { StructureErrorHandler } from "../../../modules/parser/interfaces/IStructureErrorHandler"
import { IFormatInstructionWriter } from "../../../modules/marshallDataset/interfaces/IFormatInstructionWriter"
import { createASTNNormalizer } from "../../flattenedHandlers/functions/createASTNNormalizer"


export function createASTNSerializer<TokenAnnotation>(
    indentationString: string,
    newline: string,
    write: (str: string) => void,
    errorHandler: StructureErrorHandler<TokenAnnotation>,
): IParser<TokenAnnotation> {
    const writer: IFormatInstructionWriter<TokenAnnotation, null> = {
        token: instruction => {
            write(instruction.stringBefore)
            write(instruction.token)
            write(instruction.stringAfter)

        },
        nonToken: instruction => {
            write(instruction.string)
        },
    }
    let foundHeader = false
    return createStructureParser({
        onEmbeddedSchema: _range => {
            foundHeader = true
            write(`! `)
            return flatten(createASTNNormalizer(
                indentationString,
                newline,
                writer
            ))
        },
        onSchemaReference: $$ => {
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
            return p.value(null)
        },
    })
}
