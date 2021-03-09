
const path = require('path');
const types = require('babel-types');
const generate = require('babel-generator').default;
const traverse = require('babel-traverse').default;

class NormalModule {
    constructor({ name, context, rawRequest, resource, parser, moduleId }) {
        this.name = name;
        this.context = context; // 根目录
        this.rawRequest = rawRequest; // 相对路径 ./src/index.js
        this.resource = resource; // 模块的绝对路径
        this.parser = parser; // ast解析器 把源代码转成AST抽象语法树
        this._source; // 此模块对应的源代码
        this._ast; // 此模块对应的AST抽象语法树
        this.dependencies = []; // 当前模块依赖的模块的相关信息
        this.moduleId = moduleId || ('./' + path.posix.relative(context, resource));
    }

    /**
     * 编译本模块
     * @param {*} compilation 
     * @param {*} callback 
     */
    build(compilation, callback) {
        this.doBuild(compilation, err => {
            // 得到语法树
            this._ast = this.parser.parse(this._source);
            // 遍历语法树，找到依赖进行收集
            traverse(this._ast, {
                // 当遍历到CallExpression节点的时候，就会进入回掉
                CallExpression: (nodePath) => {
                    let node = nodePath.node; // 获取节点
                    if (node.callee.name === 'require') { // 如果方法名是require方法的话
                        node.callee.name = '__webpack_require__'; // 对方法名称进行修改，从require改成__webpack_require__
                        console.log(node.callee.name)
                        const moduleName = node.arguments[0].value; // 模块的名称
                        const extName = moduleName.split(path.posix.sep).pop().indexOf('.') === -1 ? '.js' : ''; // 进行后缀补全，可能的扩展名
                        // 获取依赖模块的绝对路径
                        const depResource = path.posix.join(path.posix.dirname(this.resource), moduleName + extName);
                        // 获取模块的ID,
                        const depModuleId = './' + path.posix.relative(this.context, depResource);
                        node.arguments = [types.stringLiteral(depModuleId)]; // 把require模块路径从./title改成./src/title.js
                        const chunk = {
                            name: this.name,
                            context: this.context, // 根目录
                            rawRequest: moduleName, // 模块的原始路径
                            moduleId: depModuleId, // 模块id，相对于根目录的相对路径，以./开头
                            resource: depResource // 依赖模块的绝对路径
                        };
                        this.dependencies.push(chunk)
                    }
                }
            })
            let { code } = generate(this._ast);
            this.source = code;
            this._source = code;
            callback();
        });
    }

    /**
     * 1.读取文件的源代码
     * @param {*} compilation 
     * @param {*} callback 
     */
    doBuild(compilation, callback) {
        this.getSource(compilation, (err, source) => {
            // loader的逻辑应该放在这个地方
            this._source = source; // 把最原始的代码存放到当前的模块_source属性上
            callback();
        });
    }

    /**
     * 读取文件的源代码
     */
    getSource(compilation, callback) {
        compilation.inputFileSystem.readFile(this.resource, 'utf8', callback);
    }
}

module.exports = NormalModule;

/**
 * 1.从硬盘上把模块内容读取出来，读成一个文本
 * 2.可能它不是一个js模块，所以会可能要走loader转换，最终肯定要得到一个js模块代码，得不到就报错
 * 3.把这个js模块代码经过parser处理处理成抽象语法树
 * 4.分析ast语法树里面的依赖，也就是找到require和import节点，分析依赖的模块
 * 5.递归的编译依赖的模块
 * 6.不停的依次递归执行上面的5步，直到所有的模块都编译完成
 * 
 * 
 * 7.不管是相对的本地模块还是第三方模块，最后它的moduleId全部都是一个相对于项目根目录的相对路径
 * 例如：./src/title.js 就是相对于当前的目录
 */