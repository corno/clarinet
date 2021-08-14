
import { TypedTreeHandler } from "../Ityped"
import { ResolvedSchema, SerializationStyle } from "../interfaces"
import { createBuilder, createSerializeInterface, Datastore } from "./simpleDataStore"
import { serialize } from "./serialize"


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