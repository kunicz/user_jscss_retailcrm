const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
	mode: 'production',
	output: {
		filename: 'retailcrm.js',
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
		minimize: true,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					format: {
						beautify: false,
						indent_level: 0,
						ascii_only: true
					}
				}
			})
		]
	},
	watch: true,
	devtool: 'source-map'
};