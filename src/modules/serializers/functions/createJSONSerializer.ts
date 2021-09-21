import * as p from "pareto"

import { IParser } from "../../parser/interfaces/IParser"
import { IStructureErrorHandler } from "../../parser/interfaces/IStructureErrorHandler"

import { flatten } from "../../flattened/functions/flatten"
import { createStructureParser } from "../../parser/functions/createStructureParser"
import { createDummyTreeHandler } from "../../parser/functions/dummyHandlers"
import { createJSONFormatter } from "./createJSONFormatter"

export function createJSONSerializer<TokenAnnotation>(
    indentationString: string,
    newline: string,
    write: (str: string) => void,
    errorHandler: IStructureErrorHandler<TokenAnnotation>,
): IParser<TokenAnnotation> {
    return createStructureParser({
        onEmbeddedSchema: (_range) => {
            return createDummyTreeHandler()
        },
        onSchemaReference: () => {
            return p.value(false)
        },
        onBody: () => flatten(createJSONFormatter(
            indentationString,
            newline,
            {
                token: (instruction) => {
                    write(instruction.stringBefore)
                    write(instruction.token)
                    write(instruction.stringAfter)

                },
                nonToken: (instruction) => {
                    write(instruction.string)
                },
            }
        )),
        errors: errorHandler,
        onEnd: () => {
            write(newline)
        },
    })
}
