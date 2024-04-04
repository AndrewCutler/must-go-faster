// webpack.config.js
const path = require('path');

module.exports = {
	entry: './index.js', // Entry point of your application
	watch: true,
	watchOptions: {
		ignored: /node_modules/,
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	output: {
		path: path.resolve(__dirname, 'build'), // Output directory
		filename: 'must-go-faster.js', // Name of the bundled file
	},
	resolve: {
		extensions: ['.ts', '.ts'],
	},
};
