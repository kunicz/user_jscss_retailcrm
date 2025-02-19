const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');

module.exports = {
	mode: 'production',
	output: {
		path: path.resolve(__dirname, '../'),
		filename: 'retailcrm.js',
		chunkLoading: false
	},
	resolve: {
		alias: {
			'@helpers': path.resolve(__dirname, '../../@helpers'),
			'@root': path.resolve(__dirname, '../..'),
		},
		extensions: ['.mjs', '.js', '.jsx', '.json'],  // Поддерживаем расширения
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [
					'style-loader',
					'css-loader',
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: {
								plugins: [
									require('postcss-discard-comments')({
										removeAll: true,
									}),
								],
							},
						},
					}
				]
			}
		]
	},
	optimization: {
		splitChunks: false,
		runtimeChunk: false,
		minimize: true,
		minimizer: [
			new TerserPlugin({
				extractComments: false, // Отключает генерацию LICENSE.txt
				terserOptions: {
					format: {
						comments: false, // Убираем комментарии лицензий
						beautify: false,
						indent_level: 0,
						ascii_only: true
					}
				}
			})
		]
	},
	experiments: {
		topLevelAwait: true // Позволяет использовать `await import()` без чанков
	},
	devtool: 'inline-source-map'
};