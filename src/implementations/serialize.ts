// import * as p from "pareto"
// import * as p20 from "pareto-20"
// import { createASTNNormalizer } from "../core"
// import { InternalSchemaSpecification, SerializationStyle } from "../interfaces"
// import { Schema } from "../schema"
// import { SerializeOut, serializeDataset, Dataset } from "./serializeDataset"

// function assertUnreachable<RT>(_x: never): RT {
//     throw new Error("unreachable")
// }

// export function serialize(
//     dataset: Dataset,
//     schema: Schema,
//     internalSchemaSpecification: InternalSchemaSpecification,
//     style: SerializationStyle,
//     writer: (str: string) => void,
// ): p.IValue<null> {
//     // const rootComments = dataset.rootComments.getComments()
//     // const allComments = dataset.documentComments.getComments().concat(rootComments)

//     const newline = "\r\n"
//     const indentation = "    "

//     const formatter = createASTNNormalizer<null, null>(
//         indentation,
//         newline
//     )

//     return ((): p.IValue<null> => {
//         switch (internalSchemaSpecification[0]) {
//             case "embedded": {
//                 const treeBuilder = astncore.createStackedParser<null>(
//                     astncore.createSemanticState({
//                         treeHandler: astncore.createDecoratedTree(
//                             formatter.schemaFormatter,
//                             astncore.createTreeConcatenator(
//                                 writer,
//                                 () => p.value(null)
//                             ),
//                         ),
//                         raiseError: _error => {
//                             //
//                         },
//                         createReturnValue: () => {
//                             return p.value(null)
//                         },
//                         createUnexpectedValueHandler: () => astncore.createDummyValueHandler(() => p.value(null)),
//                         onEnd: () => {
//                             writer(formatter.onAfterSchema())
//                             //onEnd
//                             //no need to return an value, we're only here for the side effects, so return 'null'
//                             return p.value(null)
//                         },
//                     })
//                 )
//                 writer(`! `)
//                 const events: astncore.TreeBuilderEvent<null>[] = []
//                 astncore.serializeSchema(
//                     schema,
//                     event => {
//                         events.push(event)
//                     },
//                     null,
//                 )

//                 return p20.createArray(events).streamify().consume(null, treeBuilder)
//             }
//             case "none": {
//                 return p.value(null)
//             }
//             case "reference": {
//                 const $ = internalSchemaSpecification[1]
//                 writer(`! ${astncore.createSerializedQuotedString($.name)}${newline}`)
//                 return p.value(null)
//             }
//             default:
//                 return assertUnreachable(internalSchemaSpecification[0])
//         }

//     })().mapResult(() => {

//         const events: astncore.TreeBuilderEvent<null>[] = []

//         function createOut(): SerializeOut {
//             return {
//                 sendBlock: (eventpair, callback) => {
//                     events.push({
//                         type: eventpair.open,
//                         annotation: null,
//                     })
//                     callback(createOut())
//                     events.push({
//                         type: eventpair.close,
//                         annotation: null,
//                     })
//                 },
//                 sendEvent: event => {
//                     events.push({
//                         type: event,
//                         annotation: null,
//                     })
//                 },
//             }
//         }
//         serializeDataset(
//             dataset,
//             schema["root type"].get(),
//             createOut(),
//             style,
//         )
//         const treeBuilder = astncore.createStackedParser<null>(
//             astncore.createSemanticState({
//                 treeHandler: astncore.createDecoratedTree(
//                     formatter.schemaFormatter,
//                     astncore.createTreeConcatenator(
//                         writer,
//                         () => p.value(null)
//                     ),
//                 ),
//                 raiseError: _error => {
//                     //
//                 },
//                 createReturnValue: () => {
//                     return p.value(null)
//                 },
//                 createUnexpectedValueHandler: () => astncore.createDummyValueHandler(() => p.value(null)),
//                 onEnd: () => {
//                     writer(formatter.onAfterSchema())
//                     //onEnd
//                     //no need to return an value, we're only here for the side effects, so return 'null'
//                     return p.value(null)
//                 },
//             })
//         )
//         return p20.createArray(events).streamify().consume(null, treeBuilder)
//     })
// }
