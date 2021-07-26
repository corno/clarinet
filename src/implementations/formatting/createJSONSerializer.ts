import * as p from "pareto"
import * as core from "../../core"
import { TokenConsumer } from "../../interfaces"
import { createStructureParser } from "../structureParser"
import { StructureErrorHandler } from "../structureParser/createStructureParser"


export function createJSONSerializer<TokenAnnotation>(
    indentationString: string,
    newline: string,
    write: (str: string) => void,
    errorHandler: StructureErrorHandler<TokenAnnotation>,
): TokenConsumer<TokenAnnotation> {
    return createStructureParser({
        onEmbeddedSchema: _range => {
            return core.createDummyTreeHandler()
        },
        onSchemaReference: () => {
            return p.value(false)
        },
        onBody: () => core.flatten(core.createJSONFormatter(
            indentationString,
            newline,
            {
                token: instruction => {
                    write(instruction.stringBefore)
                    write(instruction.token)
                    write(instruction.stringAfter)

                },
                nonToken: instruction => {
                    write(instruction.string)
                },
            }
        )),
        errors: errorHandler,
        onEnd: () => {
            write(newline)
            return p.value(null)
        },
    })
}
