// webpack.config.js
const path = require('path');
const webpack = require('webpack');

module.exports = (env) => {
	const isDevelopment = env.watch === 'true';

	return {
		entry: './index.ts', // Entry point of your application
		mode: isDevelopment ? 'development' : 'production',
		devtool: isDevelopment ? 'eval-source-map' : 'source-map',
		watchOptions: {
			ignored: /node_modules/,
			aggregateTimeout: 300,
			poll: 1000,
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
					test: /\.ts$/,
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
			publicPath: '/build/',
			clean: true,
		},
		resolve: {
			extensions: ['.ts'],
		},
		stats: {
			colors: true,
			modules: false,
			children: false,
		},
	};
};
