const babylon = require('babylon');

class Parser {
    parse(source) {
        return babylon.parse(source, {
            sourceType: 'module', // 源代码是一个模块
            plugins: ['dynamicImport'] // 额外支持的插件，支持动态导入 import('./title.js')
        });
    }
}

module.exports = Parser;