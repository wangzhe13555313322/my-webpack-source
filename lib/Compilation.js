const { SyncHook } = require("tapable");
const NormalModuleFactory = require('./NormalModuleFactory');
const path = require('path');
const Parser = require('../Parser');

const parser = new Parser();

class Compilation {
    constructor(compiler) {
        this.compiler = compiler; // 编译器对象
        this.options = compiler.options; // compiler的选项
        this.context = compiler.context; // comipler的根目录
        this.inputFileSystem = compiler.inputFileSystem; // 读文件用的模块 fs.readFile
        this.outputFileSystem = compiler.outputFileSystem; // 写文件用的模块 fs.writeFile
        this.entries = []; // 入口的数组 这里放着所有的入口模块
        this.modules = []; // 模块的数组，这里放着所有的模块
        this.hooks = {
            // 当成功构建完成一个模块后就会触发这个钩子
            successModule: new SyncHook(['module'])
        }
    }

    /**
     *  开始编译一个新的入口
     * @param {*} context 根目录
     * @param {*} entry 入口的模块相对路径 ./src/index.js
     * @param {*} name 入口的名字 main
     * @param {*} callback 编译完成的回调
     */
    addEntry(context, entry, name, callback) {
        // 增加编译模块链
        this._addModuleChain(context, entry, name, (err, module) => {
            callback(err, module);
        });
    }

    // 增加编译模块链
    _addModuleChain(context, entry, name, callback) {
        // 通过模块工厂创建一个模块
        const normalModuleFactory = new NormalModuleFactory();
        const entryModule = normalModuleFactory.create({
            name,  // 入口的名字
            context,  // 根目录
            rawRequest: entry, // 入口文件 相对路径
            resource: path.posix.join(context, entry), // 入口的绝对路径
            parser
        });
        this.entries.push(entryModule); // 给入口模块数组添加一个模块
        this.modules.push(entryModule); // 给普通模块数组添加一个模块
        const afterBuild = (err, module) => {
            // 如果大于0说明有依赖
            if (module.dependencies.length > 0) {
                this.processModuleDependencies(module, err => {
                    callback(err, module);
                })
            } else {
                callback(err, module);
            }
        }
        this.buildModule(entryModule, afterBuild);
    }

    /**
     * 处理编译依赖的模块
     * @param {*} module 
     * @param {*} callback 
     */
    processModuleDependencies(module, callback) {
        // 获取当前模块的依赖模块
        const dependencies = module.dependencies;
        
    }

    /**
     * 
     * @param {*} module 要编译的模块
     * @param {*} afterModule 编译完成后的回掉函数
     */
    buildModule(module, afterModule) {
        // 模块的编译的真正的逻辑其实是再模块内部执行的
        module.build(this, err => {
            // 走到这儿就意味着一个module模块编译已经完成
            this.hooks.successModule.call(module);
            afterModule(err, module);
        })
    }
}

module.exports = Compilation;