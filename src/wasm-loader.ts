export interface SparkModule {
  World: new (config?: any) => any
  Body: new (...args: any[]) => any
  Shape: new (...args: any[]) => any
  threaded: boolean
  maxWorkers: number
}

export async function loadSparkModule(): Promise<SparkModule> {
  const m = await import('./spark.mjs') as any;
  return m.default() as Promise<SparkModule>;
}
