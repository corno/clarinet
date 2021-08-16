import { Location } from "../../../generic";


export interface ILocationState {
    getCurrentLocation(): Location
    getNextLocation(): Location
    increase(character: number): void
}
