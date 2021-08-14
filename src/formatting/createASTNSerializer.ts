import * as p from "pareto"
import { TokenConsumer } from "../interfaces"
import { createASTNNormalizer, FormatInstructionWriter } from "../flattenedHandlers/formatting"
import { createStructureParser, StructureErrorHandler } from "../structureParser"
import { flatten } from "../untypedHandlers"


export function createASTNSerializer<TokenAnnotation>(
    indentationString: string,
    newline: string,
    write: (str: string) => void,
    errorHandler: StructureErrorHandler<TokenAnnotation>,
): TokenConsumer<TokenAnnotation> {
    const writer: FormatInstructionWriter<TokenAnnotation, null> = {
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
