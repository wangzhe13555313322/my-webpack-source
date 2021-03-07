const { AsyncSeriesHook, SyncBailHook, AsyncParallelHook, SyncHook } = require('tapable');
const NormalModuleFactory = require('./NormalModuleFactory');
const Compilation = require('./Compilation');
const Stats = require('./Stats');

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
            beforeCompiler: new AsyncSeriesHook(['params']),// 编译前
            compiler: new SyncHook(['params']), // 编译
            make: new AsyncParallelHook(['compilation']), // make构建 会进行创建compilation和thisCompilation
            thisCompilation: new SyncHook(['compilation', 'params']), // 开始创建一次新的编译
            compilation: new SyncHook(['compilation', 'params']), // 创建完成一个新的compilation
            afterCompiler: new AsyncSeriesHook(['compilation']) // 编译后
        }
    }

    // run 方法是开始编译的入口
    run(callback) {
        console.log('Complier run');

        // 这是编译完成后最终的回掉
        const finalCallback = (err, stats) => {
            callback(err, stats);
        }

        const onCompiled = (err, compilation) => {
            console.log('onCompiled 完成');
            finalCallback(err, new Stats(compilation));
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
        this.hooks.beforeCompiler.callAsync(params, err => {
            // 开始执行编译
            this.hooks.compiler.call(params)
            const compilation = this.newCompilation(params)
            this.hooks.make.callAsync(compilation, err => {
                console.log('make完成');
                onCompiled(null, compilation);
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