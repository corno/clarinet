import { Location } from "../../../modules/tokenizer/types/location";


export interface ILocationState {
    getCurrentLocation(): Location
    getNextLocation(): Location
    increase(character: number): void
}
