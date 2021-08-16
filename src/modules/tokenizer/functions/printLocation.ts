import {
    Location,
} from "../types/location"

export function printLocation(location: Location): string {
    return `${location.line}:${location.column}`
}