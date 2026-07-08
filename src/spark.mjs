export default async function sparkLoader(options) {
  const distModule = await import('../dist/spark.mjs');
  const moduleExports = await distModule.default(options);
  return moduleExports;
}
