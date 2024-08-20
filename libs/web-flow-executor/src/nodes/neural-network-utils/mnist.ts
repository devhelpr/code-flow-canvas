export interface StructuredData {
  input: number[];
  expectedOutput: number[];
}

export class Mnist {
  private rawData: number[][];

  // First index = actual number (0-9); second Index = training item number
  structuredData: {
    result: StructuredData[][];
    shuffledData: StructuredData[];
  };

  constructor() {
    this.rawData = [];
    this.structuredData = { result: [], shuffledData: [] };
  }

  init(
    json0: any,
    json1: any,
    json2: any,
    json3: any,
    json4: any,
    json5: any,
    json6: any,
    json7: any,
    json8: any,
    json9: any
  ) {
    this.rawData.push((<any>json0).data);
    this.rawData.push((<any>json1).data);
    this.rawData.push((<any>json2).data);
    this.rawData.push((<any>json3).data);
    this.rawData.push((<any>json4).data);
    this.rawData.push((<any>json5).data);
    this.rawData.push((<any>json6).data);
    this.rawData.push((<any>json7).data);
    this.rawData.push((<any>json8).data);
    this.rawData.push((<any>json9).data);

    this.structuredData = this.structureData(this.rawData);
  }

  private shuffle = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  private structureData(rawData: number[][]): {
    result: StructuredData[][];
    shuffledData: StructuredData[];
  } {
    var result = [];
    for (let i = 0; i < 10; i++) {
      result[i] = this.convertRawData(rawData[i], i);
    }
    let allData = [];
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < result[i].length; j++) {
        allData.push(result[i][j]);
      }
    }
    allData = this.shuffle(allData);
    return { result: result, shuffledData: allData };
  }

  arraysEqual(a: number[], b: number[]) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.
    // Please note that calling sort on an array will modify that array.
    // you might want to clone your array first.

    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  private convertRawData(data: number[], num: number): StructuredData[] {
    var result = [];
    var pixels: number = 28 * 28;
    var totalNumber = data.length / pixels;
    for (let i = 0; i < totalNumber; i++) {
      var nextInput = data.slice(i * pixels, i * pixels + pixels);
      var nextOutput = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      nextOutput[num] = 1;
      result.push({ input: nextInput, expectedOutput: nextOutput });
    }
    return result;
  }
}
