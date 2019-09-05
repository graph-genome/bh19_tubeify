declare module '*/test-data.json' {
    interface TestData {
      foo: string;
      bar: number;
    }
  
    const value: TestData;
    export = value;
  }
  