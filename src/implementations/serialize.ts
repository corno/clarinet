//import * as p20 from "pareto-20"
import { InternalSchemaSpecification, SerializationStyle } from "../interfaces"
import { TreeParserEvent } from "../Iuntyped"
import { createTreeParser, handleEvent, printTreeParserError } from "../treeParser"
import { Schema } from "../typedHandler"
import { serializeSchema } from "../typedHandler/implementation"
import { createASTNNormalizer, createSerializedQuotedString, FormatInstructionWriter } from "../flattenedHandlers"
import { SerializableDataset, serializeDataset, SerializeOut } from "./serializeDataset"
import { createDummyValueHandler, flatten } from "../untypedHandlers"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function serialize(
    dataset: SerializableDataset,
    schema: Schema,
    internalSchemaSpecification: InternalSchemaSpecification,
    style: SerializationStyle,
    writer: (str: string) => void,
): void {
    const newline = "\r\n"
    const indentation = "    "


    const writer2: FormatInstructionWriter<null, null> = {
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
    serializeDataset(
        dataset,
        schema["root type"].get(),
        createOut(),
        style,
    )
    bodyParser.forceEnd(null)
    writer(newline)
}
