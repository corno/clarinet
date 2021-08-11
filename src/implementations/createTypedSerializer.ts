/* eslint
    no-console: "off",
*/

import {
    createBuilder,
    createSerializeInterface,
    Datastore,
    SerializationStyle,
    serialize,
} from ".."
import { TypedTreeHandler } from "../core"
import { ResolvedSchema } from "../interfaces"


export function createTypedSerializer<TokenAnnotation, NonTokenAnnotation>(
    rs: ResolvedSchema<TokenAnnotation, NonTokenAnnotation>,
    style: SerializationStyle,
    write: (str: string) => void,
): TypedTreeHandler<TokenAnnotation, NonTokenAnnotation> {
    const simpleDS: Datastore = {
        root: { type: null },
    }
    return createBuilder(
        simpleDS,
        () => {
            serialize(
                createSerializeInterface(simpleDS),
                rs.schemaAndSideEffects.schema,
                rs.specification,
                style,
                write,
            )

        }
    )
}