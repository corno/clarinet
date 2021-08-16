
import { ITypedTreeHandler } from "../../../modules/typed/interfaces/ITypedTreeHandler"
import { createBuilder } from "./createBuilder"
import { serialize } from "./serialize"
import { ResolvedSchema, SerializationStyle } from "../../../apis/Ideserialize"
import { Datastore } from "../types"
import { createSerializeInterface } from "./createSerializationInterface"


export function createTypedSerializer<TokenAnnotation, NonTokenAnnotation>(
    rs: ResolvedSchema<TokenAnnotation, NonTokenAnnotation>,
    style: SerializationStyle,
    write: (str: string) => void,
): ITypedTreeHandler<TokenAnnotation, NonTokenAnnotation> {
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