### 编译过程

- 部分编译流程图
- 1.创建一个webpack函数，接受一个webapck的配置项和回掉函数

 - 创建一个compiler对象（new compiler），compiler构造函数的参数是配置项中的根目录
    - 创建钩子函数对象（hooks对象内部进行赋值，钩子函数基于tapable）

 - 将webpack的配置参数赋给compiler对象

 - 创建NodeEnvironmentPlugin对象，将compiler对象传入
    - NodeEnvironmentPlugin对象对fs的readFile和writeFile进行了增强

    - 并将两个方法挂载到compiler对象上，分别为inputFileSystem和outputFileSystem

 - 挂载配置文件中手动配置的所有插件
    - 如果有配置插件并且是一个数组的情况下，遍历数组，并执行插件的apply方法进行挂载

    - 插件都是基于tapable的，需要进行tap或者tapAsync方式进行注册

 - 将webpack传递的配置参数与webpack的默认配置参数进行合并

 - 对webpack参数中的配置项进行解析
    - 调用WebpackOptionsApply类的process方法，传递webpack的配置项和complier实例

    - process方法中会创建一个入口选项插件（EntryOptionPlugin）的对象

    - 调用apply方法执行，传递进入一个compiler的实例
        - apply方法中会将compile的hooks对象的entryOption（SyncBailHook类型）钩子函数进行注册
        - 注册钩子函数内部会创建一个单入口插件（SingleEntryPlugin），并执行创建SingleEntryPlugin出的实例的apply方法
        - SingleEntryPlugin这个类中需要传入根目录、入口文件、打包文件名字这三个参数
        - 在SingleEntryPlugin这个类中会将根目录、入口文件信息、打包名称这三个参数保存到当前类上
        - SingleEntryPlugin会一个apply方法，会将complier的hooks对象的make（AsyncParallelHook类型）钩子函数进行注册
        - 这个make钩子函数有两个参数，分别是compilation对象和回掉函数
        - 在此过程中，会从此入口开始进行编译，编译入口文件和它的依赖文件
        - apply方法内部会调用compilation的addEntry方法进行执行，参数分别是根目录、入口文件信息、打包后的名称和回掉函数

    - apply方法执行完成后，compile对象的entryOption钩子函数执行

    - 需要传递配置文件的根目录和配置文件的入口信息

 - 对compiler对象进行返回

 - 通过调用webpack返回的compiler对象上的run方法对项目进行构建