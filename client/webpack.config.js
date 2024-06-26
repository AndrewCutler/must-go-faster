// webpack.config.js
const path = require('path');

module.exports = (env) => ({
	entry: './index.ts', // Entry point of your application
	watch: env.watch === 'true',
	devtool: env.watch === 'true' ? 'eval' : 'source-map',
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
