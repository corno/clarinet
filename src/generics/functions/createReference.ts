import { IReadonlyLookup, IReference, IRegistrater } from "../interfaces"
import { AnnotatedString } from "../interfaces"

export function createReference<T, Annotation>(
    propertyName: string,
    annotatedName: AnnotatedString<Annotation> | null,
    defaultName: string,
    contextAnnotation: Annotation,
    lookup: IReadonlyLookup<T>,
    registrater: IRegistrater<Annotation>,
): IReference<T> {
    let t: T | null = null
    const name = annotatedName !== null
        ? annotatedName.value
        : defaultName

    registrater.register(() => {
        return lookup.with(
            name,
            entry => {
                t = entry
                return null
            },
            keys => {
                return {
                    message: `${propertyName} '${name}' not found, choose from ${keys.map(x => `'${x}'`).join(", ")}`,
                    annotation: annotatedName !== null
                        ? annotatedName.annotation
                        : contextAnnotation,
                }
            }
        )
    })
    return {
        get: (): T => {
            if (t === null) {
                throw new Error("UNEXPECTED: not resolved")
            }
            return t
        },
        name: name,
    }
}