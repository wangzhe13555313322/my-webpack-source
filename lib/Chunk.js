class Chunk {
    constructor(entryModule) {
        this.entryModule = entryModule; // 此代码块的入口模块
        this.name = entryModule.name; // 代码块的名字
        this.files = []; // 这个代码块生成了那些文件
        this.modules = []; // 这个代码块包含那些模块
    }
}

module.exports = Chunk;