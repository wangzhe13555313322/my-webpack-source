const fs = require('fs');


class NodeEnvironmentPlugin {
    constructor(options) {
        this.options = options || {};
    }
    apply(complier) {
        complier.inputFileSystem = fs; // 读文件用的模块 fs.readFile
        complier.outputFileSystem = fs; // 写文件用的模块 fs.writeFile
    }
}

module.exports = NodeEnvironmentPlugin;