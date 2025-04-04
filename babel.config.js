module.exports = {
    presets: [
        '@babel/preset-env',
        ['@babel/preset-react', {runtime: 'automatic'}],
    ],
    "plugins": [
        ['@babel/plugin-proposal-decorators', {
            version: '2018-09',
            decoratorsBeforeExport: true
        }]
    ],
};
