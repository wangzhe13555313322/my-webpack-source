const { AsyncSeriesHook, SyncBailHook, AsyncParallelHook, SyncHook } = require('tapable');
const NormalModuleFactory = require('./NormalModuleFactory');
const Compilation = require('./Compilation');
const Stats = require('./Stats');
const path = require('path');
const mkdirp = require('mkdirp'); // 递归的创建新的文件夹

// 编译器对象
class Complier {

    constructor(context) {
        this.context = context;
        this.hooks = {
            // 当编译完成之后会触发之后会触发这个钩子执行
            done: new AsyncSeriesHook(["stats"]), 
            // context 是项目录的绝对路径 entry 是入口文件的路径
            entryOption: new SyncBailHook(['context', 'entry']),
            beforeRun: new AsyncSeriesHook(['compiler']), // 运行前
            run: new AsyncSeriesHook(['compiler']), // 运行
            beforeCompile: new AsyncSeriesHook(['params']),// 编译前
            compile: new SyncHook(['params']), // 编译
            make: new AsyncParallelHook(['compilation']), // make构建 会进行创建compilation和thisCompilation
            thisCompilation: new SyncHook(['compilation', 'params']), // 开始创建一次新的编译
            compilation: new SyncHook(['compilation', 'params']), // 创建完成一个新的compilation
            afterCompile: new AsyncSeriesHook(['compilation']), // 编译后
            emit: new AsyncSeriesHook(['compliation']), // 发射或者写入文件
            done: new AsyncSeriesHook(['stats']) // 所有的编译全部完成
        }
    }

    emitAssets(compliation, callback) {
         // finalCallback(err, new Stats(compilation));
        // 把chunk变成文件写入硬盘
        const emitFiles = (err) => {
            const assets = compliation.assets;
            console.log(assets)
            let outputPath = this.options.output.path;
            for (let file in assets) {
                const source = assets[file];
                // 输出文件的绝对路径
                const targetPath = path.posix.join(outputPath, file);
                this.outputFileSystem.writeFileSync(targetPath, source, 'utf8');
            }
            callback();
        }
        // 先触发emit回掉，在写插件的时候emit用的最多，因为它是输出前修改内容的最后机会
        this.hooks.emit.callAsync(compliation, err => {
            // 先创建输入目录dist，再写入文件
            mkdirp(this.options.output.path, emitFiles);
        })
    }

    // run 方法是开始编译的入口
    run(callback) {

        const onCompiled = (err, compilation) => {
            this.emitAssets(compilation, err => {
                // 收集编译信息 chunks entries modules files
                let stats = new Stats(compilation);
                // 触发done钩子执行
                this.hooks.done.callAsync(stats, err => {
                    callback(err, stats);
                });
            })
        }

        // compiler运行之前
        this.hooks.beforeRun.callAsync(this, err => {
             // compiler运行时
            this.hooks.run.callAsync(this, err => {
                this.compiler(onCompiled); // 执行编译
            })
        })
    }

    compiler(onCompiled) {
        const params = this.newCompilationParams()
        // 编译前
        this.hooks.beforeCompile.callAsync(params, err => {
            // 开始执行编译
            this.hooks.compile.call(params)
            const compilation = this.newCompilation(params)
            this.hooks.make.callAsync(compilation, err => {
                console.log('make完成');
                // 封装代码块之后编译就完成了
                compilation.seal(err => {
                    this.hooks.afterCompile.callAsync(compilation, err => {
                        onCompiled(err, compilation);
                    })
                })
            })
        })
    }

    createCompilation() {
        return new Compilation(this);
    }

    // 创建一给新的compilation
    newCompilation(params) {
        const compilation = this.createCompilation();
        this.hooks.thisCompilation.call(compilation, params);
        this.hooks.compilation.call(compilation, params);
        return compilation;
    }

    // 构建compilation参数
    newCompilationParams() {
        const params = {
            // 再创建compilation之前已经创建了一个普通模块工厂
            normalModuleFactory: new NormalModuleFactory()
        }
        return params
    }

}

module.exports = Complier;