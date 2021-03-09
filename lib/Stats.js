
// {
//     entris: [], // 显示所有入口
//     chunks: [], // 显示所有代码块
//     module: [], // 显示所有的模块
//     assets: [] // 显示所有打包后的资源
// }
class Stats {
    constructor(compilation) {
        this.entries = compilation.entries; // 入口
        this.modules = compilation.modules; // 模块
        this.chunks = compilation.chunks; // 代码块
        this.files = compilation.files; // 文件名数组
    }

    toJson() {
        return this
    }
}

module.exports = Stats;