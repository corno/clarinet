import * as p from "pareto"
import { TokenConsumer } from "../interfaces"
import { createJSONFormatter } from "../flattenedHandlers/formatting"
import { createStructureParser, StructureErrorHandler } from "../structureParser"
import { createDummyTreeHandler, flatten } from "../untypedHandlers"


export function createJSONSerializer<TokenAnnotation>(
    indentationString: string,
    newline: string,
    write: (str: string) => void,
    errorHandler: StructureErrorHandler<TokenAnnotation>,
): TokenConsumer<TokenAnnotation> {
    return createStructureParser({
        onEmbeddedSchema: _range => {
            return createDummyTreeHandler()
        },
        onSchemaReference: () => {
            return p.value(false)
        },
        onBody: () => flatten(createJSONFormatter(
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
