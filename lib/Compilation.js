const { SyncHook } = require('tapable');
const NormalModuleFactory = require('./NormalModuleFactory');
const path = require('path');
const Parser = require('./Parser');
const async = require('neo-async');
const Chunk = require('./Chunk');
const ejs = require('ejs');
const fs = require('fs');

const mainTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'main.ejs'), 'utf8');
const mainRender = ejs.compile(mainTemplate);

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
        this._modules = {}; // key是模块id，值是模块对象
        this.chunks = []; // 这里面放所有的代码块
        this.files = []; // 这里放着本次编译所有产出的文件名称 
        this.assets = {}; // 存放着生成的资源
        this.hooks = {
            // 当成功构建完成一个模块后就会触发这个钩子
            successModule: new SyncHook(['module']),
            seal: new SyncHook(), // 封装代码块
            beforeChunks: new SyncHook(), // 生成代码块之前
            afterChunk: new SyncHook() // 生成代码块之后
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
    _addModuleChain(context, rawRequest, name, callback) {
        this.createModule({
            name,
            context, 
            rawRequest,
            resource: path.posix.join(context, rawRequest),
            parser
        }, entryModule => this.entries.push(entryModule), callback);
    }


    /**
     * 创建并编译一个模块
     * @param {*} data 要编译的模块信息
     * @param {*} addEntry 可选的增加入口的方法 如果这个模块是入口模块，如果不是就什么都不操作
     * @param {*} callback 编译完成后可以调用callback回掉
     */
    createModule(data, addEntry, callback) {
        // 通过模块工厂创建一个模块
        const normalModuleFactory = new NormalModuleFactory();
        const module = normalModuleFactory.create(data);
        module.moduleId = './' + path.posix.relative(this.context, module.resource); // ./src/index.js
        addEntry && addEntry(module); // 如果是入口添加到入口里面
        this.modules.push(module); // 给普通模块数组添加一个模块
        this._modules[ module.moduleId] = module; // 保存一下对应信息
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
        this.buildModule(module, afterBuild);
    }

    /**
     * 处理编译依赖的模块
     * @param {*} module 
     * @param {*} callback 
     */
    processModuleDependencies(module, callback) {
        // 获取当前模块的依赖模块
        const dependencies = module.dependencies;
        // 遍历依赖模块，全部开始编译，当所有模块全部编译完成后才会调用callback
        async.forEach(dependencies, (dependency, done) => {
            const { name, context, resource, moduleId } = dependency;
            this.createModule({
                name,
                context, 
                rawRequest: './' + path.posix.relative(context, resource),
                resource,
                parser,
                moduleId
            }, null, done);
        }, callback);
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

    /**
     * 把模块封装成代码块chunk
     * @param {*} callback 
     */
    seal(callback) {
        this.hooks.seal.call();
        this.hooks.beforeChunks.call(); // 开始准备生成代码块
        // 默认情况下，每个入口会生成一个代码块
        for (const entryModule of this.entries) {
            const chunk = new Chunk(entryModule); // 根据入口模块得到代码块
            this.chunks.push(chunk);
            // 对所有模块进行过滤，找出名称和这个chunk一样的模块，组成一个数组，赋给chunk的modules属性
            chunk.modules = this.modules.filter(module => module.name === chunk.name)
        }
        this.hooks.afterChunk.call(this.chunks);
        // 生成代码块之后，要生成代码块对应的资源
        this.createChunkAssets();
        callback();
    }

    createChunkAssets() {
        for (let i = 0; i < this.chunks.length; i++) {
            const chunk = this.chunks[i];
            const file = chunk.name + '.js'; // 拿到了文件名字
            chunk.files.push(file);
            const source = mainRender({
                entryModuleId: chunk.entryModule.moduleId,
                modules: chunk.modules // 代码块对应的模块数组
            });
            this.emitAssets(file, source);
        }
    }

    emitAssets(file, source) {
        this.assets[file] = source;
        this.files.push(file);
    }
}

module.exports = Compilation;