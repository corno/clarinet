import * as p from "pareto"
import { ITokenConsumer } from "../../../apis/ITokenizer/interfaces"
import { createDummyTreeHandler } from "../../../modules/parser/functions/dummyHandlers"
import { createJSONFormatter } from "../../flattenedHandlers/functions"
import { createStructureParser, StructureErrorHandler } from "../../structureParser"
import { flatten } from "../../untypedHandlers"


export function createJSONSerializer<TokenAnnotation>(
    indentationString: string,
    newline: string,
    write: (str: string) => void,
    errorHandler: StructureErrorHandler<TokenAnnotation>,
): ITokenConsumer<TokenAnnotation> {
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
