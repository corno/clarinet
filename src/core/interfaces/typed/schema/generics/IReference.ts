export interface IReference<T> {
    get(): T
    readonly name: string
}