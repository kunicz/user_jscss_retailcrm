import path from 'path';
import { fileURLToPath } from 'url';
import TerserPlugin from 'terser-webpack-plugin';
import postcssDiscardComments from 'postcss-discard-comments';
import SftpClient from 'ssh2-sftp-client';
import SftpUploadPlugin from '../../ftp.mjs';
import WebpackNotifierPlugin from 'webpack-notifier';

const bundleName = 'retailcrm.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resolvedPath = path.resolve(__dirname, '../');
const sftpUploader = new SftpUploadPlugin({
	sftpClient: new SftpClient(),
	files: [{
		localFolder: resolvedPath,
		remoteFolder: 'jscss/user_jscss/',
		bundleName
	}]
});
const notifier = new WebpackNotifierPlugin({ onlyOnError: true });

export default {
	mode: 'production',
	entry: './src/index.js',
	output: {
		path: resolvedPath,
		filename: bundleName,
		chunkLoading: false
	},
	resolve: {
		alias: {
			'@helpers': path.resolve(__dirname, '../../@helpers/modules'),
			'@root': path.resolve(__dirname, '../..'),
			'@src': path.resolve(__dirname, 'src'),
			'@css': path.resolve(__dirname, 'src/css'),
			'@modules': path.resolve(__dirname, 'src/modules'),
		},
		mainFiles: ['index'],
		extensions: ['', '.mjs', '.js', '.jsx', '.json'],  // Поддерживаем расширения
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				type: 'javascript/auto',
				resolve: {
					fullySpecified: false
				},
				parser: {
					dynamicImports: true,
					importMeta: true // Включаем поддержку import.meta
				}
			},
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
									postcssDiscardComments({
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
	devtool: 'inline-source-map',
	plugins: [sftpUploader, notifier],
	experiments: {
		topLevelAwait: true
	}
};