import { IReadonlyLookup, IReference } from "./generics"

type Error<Annotation> = {
    message: string
    annotation: Annotation
}

type Resolve<Annotation> = () => Error<Annotation> | null

export interface IRegistrater<Annotation> {
    register(reference: Resolve<Annotation>): void
}

export interface IResolveRegistry<Annotation> {
    getRegistrater(): IRegistrater<Annotation>
    resolve(
        onError: (error: Error<Annotation>) => void,
    ): boolean
}

export function createResolveRegistry<Annotation>(): IResolveRegistry<Annotation> {
    class ResolveRegistry {
        public readonly references: Resolve<Annotation>[] = []
        public getRegistrater() {
            return {
                register: (reference: Resolve<Annotation>) => {
                    this.references.push(reference)
                },
            }
        }
        public register(reference: Resolve<Annotation>): void {
            this.references.push(reference)
        }
        public resolve(
            onError: (error: Error<Annotation>) => void,
        ): boolean {
            let foundErrors = false
            this.references.forEach(r => {
                const result = r()
                if (result !== null) {
                    onError(result)
                    foundErrors = true
                }
            })
            return !foundErrors
        }
    }
    return new ResolveRegistry()
}

export type AnnotatedString<TokenAnnotation> = {
    value: string
    annotation: TokenAnnotation
}

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