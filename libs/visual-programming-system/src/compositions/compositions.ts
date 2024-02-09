import { Composition } from '../interfaces/composition';

export class Compositions<T> {
  compositions: { [id: string]: Composition<T> } = {};
  public addComposition(composition: Composition<T>) {
    this.compositions[composition.id] = composition;
  }

  public getComposition(id: string) {
    return this.compositions[id];
  }

  public getAllCompositions() {
    return this.compositions;
  }
  public removeComposition(id: string) {
    delete this.compositions[id];
  }
  public clearCompositions() {
    this.compositions = {};
  }

  public setComposition(composition: Composition<T>) {
    this.addComposition(composition);
  }
}
