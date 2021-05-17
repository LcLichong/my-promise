const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const {CleanWebpackPlugin} = require('clean-webpack-plugin')

module.exports = {
    entry: {
        'static/index': './src/index.js'
    },
    mode: "development",
    output: {
        path: path.resolve(__dirname,'./dist'),
        filename: '[name].[chunkhash].js'
    },
    module: {
        rules: [{
            test: /\.js?$/,
            exclude: /(node_modules)/,
            use: {
                loader: "babel-loader",
                options: {
                    presets: [
                        ["@babel/preset-env"]
                    ],
                    plugins: [
                        "@babel/plugin-proposal-class-properties",
                    ]
                }
            },
        }]
    },
    devServer: {
        disableHostCheck: true,
        inline: true,
        port: 8181
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'index.html',
            scriptLoading: 'blocking'
        })
    ]
}
