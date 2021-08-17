import * as p from "pareto"
import { flatten } from "../../../modules/flattened/functions/flatten"
import { createStructureParser } from "../../../modules/parser/functions/createStructureParser"
import { createDummyTreeHandler } from "../../../modules/parser/functions/dummyHandlers"
import { IParser } from "../../../modules/parser/interfaces/IParser"
import { StructureErrorHandler } from "../../../modules/parser/interfaces/IStructureErrorHandler"
import { createJSONFormatter } from "../../flattenedHandlers/functions/createJSONFormatter"


export function createJSONSerializer<TokenAnnotation>(
    indentationString: string,
    newline: string,
    write: (str: string) => void,
    errorHandler: StructureErrorHandler<TokenAnnotation>,
): IParser<TokenAnnotation> {
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
