
/**
 * 注册单入口插件
 */
class SingleEntryPlugin {
    constructor(context, entry, name) {
        this.context = context; // 上下文绝对路径
        this.entry = entry; // 入口模块的路径
        this.name = name; // 入口的名字
    }

    apply(complier) {
        // 注册make钩子
        complier.hooks.make.tapAsync('SingleEntryPlugin', (compilation, callback) => {
            const { context, entry, name } = this;
            // 从此入口开始编译，编译入口文件和它的依赖
            console.log('SingleEntryPlugin make');
            compilation.addEntry(context, entry, name, callback);
        })
    }
}

module.exports = SingleEntryPlugin;