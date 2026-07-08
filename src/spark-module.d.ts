declare module './spark.mjs' {
  export default function SparkPhysics(options?: any): Promise<{
    World: new (config?: any) => any
    Body: new (...args: any[]) => any
    Shape: new (...args: any[]) => any
    threaded: boolean
    maxWorkers: number
  }>
}
