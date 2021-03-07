
// {
//     entris: [], // 显示所有入口
//     chunks: [], // 显示所有代码块
//     module: [], // 显示所有的模块
//     assets: [] // 显示所有打包后的资源
// }
class Stats {
    constructor(compilation) {
        this.entries = compilation.entries;
        this.modules = compilation.modules;
    }

    toJson() {
        return this
    }
}

module.exports = Stats;