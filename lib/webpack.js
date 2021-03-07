
const Complier = require('./Complier')
const NodeEnvironmentPlugin = require('./node/NodeEnvironmentPlugin');
const WebpackOptionsApply = require('./webpackOptionsApply');

const webpack = (options, callback) => {
    // 首先验证配置文件是不是合法，如果不合法就报错

    let complier = new Complier(options.context); // 创建一个complier的实例

    complier.options = options;// 给它赋值一个options的属性

    new NodeEnvironmentPlugin().apply(complier); // 让complier可以进行文件的读取和写入

    // 挂载配置文件里提供的所有plugins插件
    if (options.plugins && Array.isArray(options.plugins)) {
        for (const plugin of options.plugins ) {
            plugin.apply(complier);
        }
    }

    new WebpackOptionsApply().process(options, complier)

    return complier;

}

module.exports = webpack;