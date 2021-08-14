export type ResolveError<Annotation> = {
    message: string
    annotation: Annotation
}

export type Resolve<Annotation> = () => ResolveError<Annotation> | null

export interface IRegistrater<Annotation> {
    register(reference: Resolve<Annotation>): void
}

export interface IResolveRegistry<Annotation> {
    getRegistrater(): IRegistrater<Annotation>
    resolve(
        onError: (error: ResolveError<Annotation>) => void,
    ): boolean
}

export type AnnotatedString<TokenAnnotation> = {
    value: string
    annotation: TokenAnnotation
}