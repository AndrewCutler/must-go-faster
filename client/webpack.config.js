// webpack.config.js
const path = require('path');
const webpack = require('webpack');

module.exports = (env) => ({
	entry: './index.ts', // Entry point of your application
	watch: env.watch === 'true',
	devtool: env.watch === 'true' ? 'eval' : 'source-map',
	watchOptions: {
		ignored: /node_modules/,
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env.API_BASE_URL': JSON.stringify(
				process.env.API_BASE_URL || 'http://10.0.0.73:8000',
			),
			'process.env.WS_BASE_URL': JSON.stringify(
				process.env.WS_BASE_URL || 'ws://10.0.0.73:8000',
			),
		}),
	],
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader'],
			},
		],
	},
	output: {
		path: path.resolve(__dirname, 'build'), // Output directory
		filename: 'must-go-faster.js', // Name of the bundled file
	},
	resolve: {
		extensions: ['.ts'],
	},
});
