import { ElementNodeMap } from "../interfaces/element";

export const createElementMap = <T>() => {
	return new Map() as ElementNodeMap<T> ;
}