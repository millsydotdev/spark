export default async (options) => {
  const canThread =
    typeof SharedArrayBuffer !== 'undefined' &&
    (typeof globalThis.crossOriginIsolated === 'undefined' || globalThis.crossOriginIsolated);

  const flavour = canThread ? await import('./spark.deluxe.mjs') : await import('./spark.mjs');
  return await flavour.default(options);
};
