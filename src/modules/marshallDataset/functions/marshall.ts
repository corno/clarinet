import { SerializationStyle } from "../types/SerializationStyle"
import { InternalSchemaSpecification } from "../types/InternalSchemaSpecification"
import { TreeParserEvent } from "../../parser/types/TreeParserEvent"
import * as def from "../../schema/types/definitions"

import { IMarshallableDataset } from "../interfaces/IMarshallableDataset"

import { createTreeParser } from "../../parser/functions/createTreeParser"
import { printTreeParserError } from "../../parser/functions/printTreeParserErrorError"
import { createDummyValueHandler } from "../../parser/functions/dummyHandlers"
import { serializeSchema } from "../../schema/functions/serializeSchema"
import { handleEvent } from "../../parser/functions/handleEvent"
import { flatten } from "../../flattened/functions/flatten"
import { marshallDataset, SerializeOut } from "./marshallDataset"
import { IFormatInstructionWriter } from "../../serializers/interfaces/IFormatInstructionWriter"
import { createASTNNormalizer } from "../../serializers/functions/createASTNNormalizer"
import { createSerializedQuotedString } from "../../serializers/functions/stringSerialization"


function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function marshall(
    dataset: IMarshallableDataset,
    schema: def.Schema,
    internalSchemaSpecification: InternalSchemaSpecification,
    style: SerializationStyle,
    writer: (str: string) => void,
): void {
    const newline = "\r\n"
    const indentation = "    "


    const writer2: IFormatInstructionWriter<null, null> = {
        token: instruction => {
            writer(instruction.stringBefore)
            writer(instruction.token)
            writer(instruction.stringAfter)

        },
        nonToken: instruction => {
            writer(instruction.string)
        },
    }
    const normalizer = createASTNNormalizer<null, null>(
        indentation,
        newline,
        writer2,
    )

    switch (internalSchemaSpecification[0]) {
        case "embedded": {
            writer(`! ! "astn/schema@0.1" `)
            const embeddedSchemaParser = createTreeParser(
                flatten(normalizer),
                $ => {
                    throw new Error(`unexpected error in schema: ${printTreeParserError($.error)}`)
                },
                () => {
                    return createDummyValueHandler()
                },
                () => {

                },
            )
            serializeSchema(
                schema,
                event => {
                    handleEvent(event, null, embeddedSchemaParser)
                },
            )
            embeddedSchemaParser.forceEnd(null)
            break
        }
        case "none": {
            break
        }
        case "reference": {
            const $ = internalSchemaSpecification[1]
            writer(`! ${createSerializedQuotedString($.name)}${newline}`)
            break
        }
        default:
            assertUnreachable(internalSchemaSpecification[0])
    }

    const bodyParser = createTreeParser(
        flatten(normalizer),
        $ => {
            throw new Error(`unexpected error in schema: ${printTreeParserError($.error)}`)
        },
        () => {
            return createDummyValueHandler()
        },
        () => {

        },
    )

    function createOut(): SerializeOut {
        function he(event: TreeParserEvent) {
            handleEvent(event, null, bodyParser)
        }
        return {
            sendBlock: (eventpair, callback) => {
                he(eventpair.open)
                callback(createOut())
                he(eventpair.close)
            },
            sendEvent: event => {
                he(event)
            },
        }
    }
    marshallDataset(
        dataset,
        schema["root type"].get(),
        createOut(),
        style,
    )
    bodyParser.forceEnd(null)
    writer(newline)
}
