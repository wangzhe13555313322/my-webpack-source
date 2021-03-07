
/**
 * 挂载各种各样的内置插件
 */

const EntryOptionPlugin = require("./EntryOptionPlugin");

class WebpackOptionsApply {

    process(options, complier) {
        // 注册插件
        new EntryOptionPlugin().apply(complier);
        // 触发entryOption的钩子，context根目录的路径，entry入口
        complier.hooks.entryOption.call(options.context, options.entry);

    }
}

module.exports = WebpackOptionsApply;