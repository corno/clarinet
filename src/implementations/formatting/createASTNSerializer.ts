import * as p from "pareto"
import * as core from "../../core"
import { TokenConsumer } from "../../interfaces"
import { createStructureParser, StructureErrorHandler } from "../structureParser"


export function createASTNSerializer<TokenAnnotation>(
    indentationString: string,
    newline: string,
    write: (str: string) => void,
    errorHandler: StructureErrorHandler<TokenAnnotation>,
): TokenConsumer<TokenAnnotation> {
    const writer: core.FormatInstructionWriter<TokenAnnotation, null> = {
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
            return core.flatten( core.createASTNNormalizer(
                indentationString,
                newline,
                writer
            ))
        },
        onSchemaReference: schemaReference => {
            foundHeader = true
            write(`! ${schemaReference.data.value}\n`)
            return p.value(false)
        },
        onBody: () => {
            if (foundHeader) {
                write(newline)
            }
            return core.flatten(core.createASTNNormalizer(
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
