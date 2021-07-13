// import * as p from "pareto"
// import * as core from "../../core"
// import { createErrorStreamHandler, createParserStack } from "../parser"

export const foo = 42

// export function createASTNTextFormatter<TokenAnnotation>(
//     formatter: core.Formatter<TokenAnnotation, null>,
//     endString: string,
//     write: (str: string) => void,
// ): p.IStreamConsumer<string, null, null> {
//     const ps = createParserStack({

//         onEmbeddedSchema: _range => {
//             write(formatter.onSchemaHeader())
//             return core.createStackedParser<TokenAnnotation>(
//                 core.createSemanticState({
//                     treeHandler: core.createDecoratedTree(
//                         formatter.schemaFormatter,
//                         core.createTreeConcatenator(write, () => p.value(null)),
//                     ),
//                     raiseError: _error => {
//                         //
//                     },
//                     createUnexpectedValueHandler: () => core.createDummyValueHandler(),
//                 }),
//                 () => {
//                     write(formatter.onAfterSchema())
//                     //onEnd
//                     //no need to return an value, we're only here for the side effects, so return 'null'
//                 },
//             )
//         },
//         onSchemaReference: schemaReference => {
//             write(createSerializedQuotedString(schemaReference.value))
//             return p.value(null)
//         },
//         onBody: () => {
//             const datasubscriber = core.createStackedParser<TokenAnnotation>(
//                 core.createSemanticState({
//                     treeHandler: core.createDecoratedTree(
//                         formatter.bodyFormatter,
//                         core.createTreeConcatenator(write, () => null),
//                     ),
//                     raiseError: error => {
//                         console.error("FOUND STACKED DATA ERROR", error)
//                     },
//                     createUnexpectedValueHandler: () => core.createDummyValueHandler(),
//                 }),() => {
//                     //onEnd
//                     //no need to return an value, we're only here for the side effects, so return 'null'
//                     return p.value(null)
//                 },
//             )
//             return datasubscriber
//         },
//         errorStreams: createErrorStreamHandler(true, str => console.error(str)),
//     })

//     return {
//         onData: $ => ps.onData($),
//         onEnd: (aborted, data) => {
//             write(endString)
//             return ps.onEnd(aborted, data)
//         },
//     }
// }