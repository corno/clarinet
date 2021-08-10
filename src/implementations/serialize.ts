import * as p from "pareto"
//import * as p20 from "pareto-20"
//import { createASTNNormalizer, serializeSchema } from "../core"
import { InternalSchemaSpecification, SerializationStyle } from "../interfaces"
import { Schema } from "../schema"
//import { SerializeOut, serializeDataset, SerializableDataset } from "./serializeDataset"
import { SerializableDataset } from "./serializeDataset"

// function assertUnreachable<RT>(_x: never): RT {
//     throw new Error("unreachable")
// }

export function serialize(
    _dataset: SerializableDataset,
    _schema: Schema,
    _internalSchemaSpecification: InternalSchemaSpecification,
    _style: SerializationStyle,
    _writer: (str: string) => void,
): p.IValue<null> {
    return p.value(null)
    // const newline = "\r\n"
    // const indentation = "    "

    // const normalizer = createASTNNormalizer<null, null>(
    //     indentation,
    //     newline,
    //     writer,
    // )

    // return ((): p.IValue<null> => {
    //     switch (internalSchemaSpecification[0]) {
    //         case "embedded": {
    //             serializeSchema(
    //                 schema,
    //                 event => {
    //                     normalizer.
    //                 }
    //             )
    //             const treeBuilder = astncore.createStackedParser<null>(
    //                 astncore.createSemanticState({
    //                     treeHandler: astncore.createDecoratedTree(
    //                         normalizer.schemaFormatter,
    //                         astncore.createTreeConcatenator(
    //                             writer,
    //                             () => p.value(null)
    //                         ),
    //                     ),
    //                     raiseError: _error => {
    //                         //
    //                     },
    //                     createReturnValue: () => {
    //                         return p.value(null)
    //                     },
    //                     createUnexpectedValueHandler: () => astncore.createDummyValueHandler(() => p.value(null)),
    //                     onEnd: () => {
    //                         writer(normalizer.onAfterSchema())
    //                         //onEnd
    //                         //no need to return an value, we're only here for the side effects, so return 'null'
    //                         return p.value(null)
    //                     },
    //                 })
    //             )
    //             writer(`! `)
    //             const events: astncore.TreeBuilderEvent<null>[] = []
    //             astncore.serializeSchema(
    //                 schema,
    //                 event => {
    //                     events.push(event)
    //                 },
    //                 null,
    //             )

    //             return p20.createArray(events).streamify().consume(null, treeBuilder)
    //         }
    //         case "none": {
    //             return p.value(null)
    //         }
    //         case "reference": {
    //             const $ = internalSchemaSpecification[1]
    //             writer(`! ${astncore.createSerializedQuotedString($.name)}${newline}`)
    //             return p.value(null)
    //         }
    //         default:
    //             return assertUnreachable(internalSchemaSpecification[0])
    //     }

    // })().mapResult(() => {

    //     const events: astncore.TreeBuilderEvent<null>[] = []

    //     function createOut(): SerializeOut {
    //         return {
    //             sendBlock: (eventpair, callback) => {
    //                 events.push({
    //                     type: eventpair.open,
    //                     annotation: null,
    //                 })
    //                 callback(createOut())
    //                 events.push({
    //                     type: eventpair.close,
    //                     annotation: null,
    //                 })
    //             },
    //             sendEvent: event => {
    //                 events.push({
    //                     type: event,
    //                     annotation: null,
    //                 })
    //             },
    //         }
    //     }
    //     serializeDataset(
    //         dataset,
    //         schema["root type"].get(),
    //         createOut(),
    //         style,
    //     )
    //     const treeBuilder = astncore.createStackedParser<null>(
    //         astncore.createSemanticState({
    //             treeHandler: astncore.createDecoratedTree(
    //                 normalizer.schemaFormatter,
    //                 astncore.createTreeConcatenator(
    //                     writer,
    //                     () => p.value(null)
    //                 ),
    //             ),
    //             raiseError: _error => {
    //                 //
    //             },
    //             createReturnValue: () => {
    //                 return p.value(null)
    //             },
    //             createUnexpectedValueHandler: () => astncore.createDummyValueHandler(() => p.value(null)),
    //             onEnd: () => {
    //                 writer(normalizer.onAfterSchema())
    //                 //onEnd
    //                 //no need to return an value, we're only here for the side effects, so return 'null'
    //                 return p.value(null)
    //             },
    //         })
    //     )
    //     return p20.createArray(events).streamify().consume(null, treeBuilder)
    // })
}
