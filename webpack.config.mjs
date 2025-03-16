export default async () => {
	const { default: webpackConfig } = await import('../@npm/webpack.preset.mjs');
	return webpackConfig(import.meta.url);
}; 