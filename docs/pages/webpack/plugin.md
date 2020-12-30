最近突然想到一个问题，在webpack中我们添加plugin是以数组的形式添加的，那么如何保证这些插件的执行顺序呢，比如一个插件依赖需要等另一个插件改完，比如一个插件和另一个插件是可以并行的，于是从源码从去探析出了结果。

### 什么是plugins
顾名思义即为插件，在webpack官方文档中是这样描述插件的
> Plugins are the backbone of webpack. webpack itself is built on the same plugin system that you use in your webpack configuration! They also serve the purpose of doing anything else that a loader cannot do.

插件是webpack的支柱，webpack实际自身也是基于跟提供给你配置的同样的插件系统来构建的，他们可以用来做loader不可以做的事情。

比如用于文件的优化，资源管理，变量注入等等。

那么webpack是如何执行插件的呢？

这里就要引入事件机制了

### 什么是事件机制

#### 举个栗子
你知道某报亭这个月会来一批你很想看的杂志，但是你跟老板都不知道实际来的时候是哪一天，这个时候，你有两种方法可以选择：
* 每天跑过去报亭一趟看看
* 给老板留个电话，让老板到货的时候打电话通知你

第一种就是轮询机制，这种很浪费你时间

第二种就是事件机制啦

来一段代码描述一下
```js
class EventEmiter {
  constructor() {
    this.taps = []; // 到货后需要通知哪些人
  }
  tap(name, callback) {
    this.taps.push({
      name, // 订阅的名字
      callback // 那个人要做的事情
    })
  }
  call() {
    this.taps.forEach(tap => {
      console.log('通知' + tap.name);
      tap.callback && tap.callback();
    });
  }
}

const bossNotify = new EventEmiter();
bossNotify.tap('张三' , () => {
  setTimeout(() => {
    console.log('1秒后过去买'); // 实际没有那么快啦
  }, 1000);
});
bossNotify.tap('李四', () => {
  setTimeout(() => {
    console.log('2秒后过去买'); // 实际没有那么快啦
  }, 2000);
});
/*** 某天， 杂志到货了 */
bossNotify.call(); // 同志们，你们要的杂志到货啦

```
这样我们就实现了一个简单的事件机制，但是，这样好像无法满足我们的插件执行要求，在webpack的构建流程中，我们有的插件是需要同步的，有的插件是需要异步串行的，有的插件是需要异步并行的。
实际上可以从源码中看到webpack使用了tapable这个库。

### tapable
从tapable的官方文档中可以看到它主要提供了以下hook
```js
const {
	SyncHook,
	SyncBailHook,
	SyncWaterfallHook,
	SyncLoopHook,
	AsyncParallelHook,
	AsyncParallelBailHook,
	AsyncSeriesHook,
	AsyncSeriesBailHook,
	AsyncSeriesWaterfallHook
 } = require("tapable");
 ```
 这些钩子主要分为同步、异步，异步又分为串行执行和并发执行
 ![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a037df74edd342e3b7277d37b428fe90~tplv-k3u1fbpfcp-zoom-1.image)

通过一个表格来看看这些名词的意义


| 名称 | 钩入的方式 | 作用 |
| --- | --- | --- |
| Hook | `tap`， `tapAsync`，`tapPromise` | 钩子基类 |
| SyncHook | `tap` | 同步钩子 |
| SyncBailHook | `tap` | 同步钩子，只要执行的 handler 有返回值，剩余 handler 不执行 |
| SyncLoopHook | `tap` | 同步钩子，只要执行的 handler 有返回值，一直循环执行此 handler |
| SyncWaterfallHook | `tap` | 同步钩子，上一个 handler 的返回值作为下一个 handler 的输入值 |
| AsyncParallelBailHook | `tap`， `tapAsync`，`tapPromise` | 异步钩子，handler 并行触发，但是跟 handler 内部调用回调函数的逻辑有关 |
| AsyncParallelHook | `tap`， `tapAsync`，`tapPromise` | 异步钩子，handler 并行触发 |
| AsyncSeriesBailHook | `tap`， `tapAsync`，`tapPromise` | 异步钩子，handler 串行触发，但是跟 handler 内部调用回调函数的逻辑有关 |
| AsyncSeriesHook | `tap`， `tapAsync`，`tapPromise` | 异步钩子，handler 串行触发 |
| AsyncSeriesLoopHook | `tap`， `tapAsync`，`tapPromise` | 异步钩子，可以触发 handler 循环调用 |
| AsyncSeriesWaterfallHook | `tap`， `tapAsync`，`tapPromise` | 异步钩子，上一个 handler 可以根据内部的回调函数传值给下一个 handler |

除了这些钩子外，在源码中还可以看到有以下几个文件

| 名称 | 作用 |
| --- | --- |
| HookCodeFactory | 编译生成可执行 fn 的工厂类 |
| HookMap | Map 结构，存储多个 Hook 实例 |
| MultiHook | 组合多个 Hook 实例 |
| Tapable | 向前兼容老版本，实例必须拥有 hooks 属性 |


### hook
实际上所有的hook都是以此为基类的来继承的

先来看看它的几个重要方法

```js
	constructor(args) { // 构造函数
		if (!Array.isArray(args)) args = [];
		this._args = args;
		this.taps = [];
		this.interceptors = [];
		this.call = this._call;
		this.promise = this._promise;
		this.callAsync = this._callAsync;
		this._x = undefined;
	}
    
    tap(options, fn) {
	}
	tapAsync(options, fn) {
	}

	tapPromise(options, fn) {
	}
    
    Object.defineProperties(Hook.prototype, {
	_call: {
		value: createCompileDelegate("call", "sync"),
		configurable: true,
		writable: true
	},
	_promise: {
		value: createCompileDelegate("promise", "promise"),
		configurable: true,
		writable: true
	},
	_callAsync: {
		value: createCompileDelegate("callAsync", "async"),
		configurable: true,
		writable: true
	}
});
```
先不管具体实现，实际这几个方法就是hook的核心，通过tap注册处理器，通过call来触发事件通知处理器，下面通过分析子类来分析下具体是怎么运作的。

### SyncHook
同步钩子是最简单的钩子, 下面举个栗子
```js
const {
  SyncHook
} = require('tapable');

const hook = new SyncHook(['arg1', 'arg2', 'arg3']);

hook.tap('hook1', (arg1, arg2, arg3) => {
  console.log(arg1, arg2, arg3);
}); // 注册事件
hook.call(1,2,3); // 调用
// 123
```
很像我们一开始提到的那个报亭买杂志的栗子。

去看看源码是怎么实现的呢？

```js
// SyncHook.js

class SyncHook extends Hook {
	tapAsync() {
		throw new Error("tapAsync is not supported on a SyncHook");
	}

	tapPromise() {
		throw new Error("tapPromise is not supported on a SyncHook");
	}

	compile(options) {
		factory.setup(this, options); 
		return factory.create(options);  // 通过把参数传给工厂的实例，返回工厂创建的对象
	}
}

module.exports = SyncHook;
```

SyncHook并没有对构造函数进行重载，也没有tap方法，说明都是用的hook类中的方法，现在可以再去看看hook类了，为了便于观看，我们再构造函数中把一些暂时不会用到的相关参数去掉

```js
	constructor(args) { // 构造函数
		if (!Array.isArray(args)) args = [];  // 传入的参数
		this._args = args;
		this.taps = []; // 保存监听事件的数组
		this.call = this._call;
	}
    
	tap(options, fn) {
		if (typeof options === "string") options = { name: options };
		if (typeof options !== "object" || options === null)
			throw new Error(
				"Invalid arguments to tap(options: Object, fn: function)"
			);
		options = Object.assign({ type: "sync", fn: fn }, options); // 最后会生成一个 { name: 'xxx', fn: callback } 对象
		if (typeof options.name !== "string" || options.name === "")
			throw new Error("Missing name for tap");
		options = this._runRegisterInterceptors(options); // 这种钩子暂时不会用到
		this._insert(options); // 插入参数
	}
```
这里可以看出来tap()的第一个参数可以是一个对象或者一个字符串，如果是字符串只是代表处理器的名称，如果是对象的话, 会有下面这些属性
```js
interface Tap {
	name: string, // handler的名称
	type: string, // handler的类型
    before: string | array,  // 插入到指定的handler之前
	fn: Function, // handler执行函数
	stage: number, // handler的执行顺序
	context: boolean // 内部共享对象
}
```
这里before和stage即会影响handler的执行顺序，before代表该handler要放在指定handler之前，而stage越小则会排在越前面，这两个属性会影响tap中调用的_insert函数

```js
    _insert(item) {
		this._resetCompilation(); // 会重新赋值call函数，防止被篡改
		let before;
		if (typeof item.before === "string") before = new Set([item.before]);
		else if (Array.isArray(item.before)) {
			before = new Set(item.before);
		}
		let stage = 0;
		if (typeof item.stage === "number") stage = item.stage;
		let i = this.taps.length;
		while (i > 0) {
			i--;
			const x = this.taps[i];
			this.taps[i + 1] = x;
			const xStage = x.stage || 0;
			if (before) {
				if (before.has(x.name)) {
					before.delete(x.name);
					continue;
				}
				if (before.size > 0) {
					continue;
				}
			}
			if (xStage > stage) {
				continue;
			}
			i++;
			break;
		}
		this.taps[i] = item;
	}
  ```
  如果有before或者xstage，在插入tap时就要进行对应的处理
  这里就成功把handler都注册到this.taps中，完成了事件监听。
  那么接下来当对应Hook执行，即调用call方法时，我们回到hook中查看，
  
  ```js
    Object.defineProperties(Hook.prototype, {
	_call: {
		value: createCompileDelegate("call", "sync"),
		configurable: true,
		writable: true
	},
	_promise: {
		value: createCompileDelegate("promise", "promise"),
		configurable: true,
		writable: true
	},
	_callAsync: {
		value: createCompileDelegate("callAsync", "async"),
		configurable: true,
		writable: true
	}
  ```
  可以看到会调用createCompileDelegate("call", "sync")返回的函数来执行

  ```js
  function createCompileDelegate(name, type) {
    return function lazyCompileHook(...args) {
        this[name] = this._createCall(type);
        return this[name](...args);
         // 实际上是等价于
        // this.call = this._creteCall(type)
        // return this.call(...args)
    };
  }
  ```
 
  ```js
  	_createCall(type) {
		return this.compile({
			taps: this.taps,
			interceptors: this.interceptors,
			args: this._args,
			type: type
		});
	}
  ```
  _createCall实际上会调用this.compile, 这里是由子类SyncHook去实现了，回到刚刚观看的SyncHook中的方法
  
  ```js
  	compile(options) {
		factory.setup(this, options); 
		return factory.create(options);  // 通过把参数传给工厂的实例，返回工厂创建的对象
	}
  ```
 这里把taps都传进来了，以及参数，类型（'sync'）都传进来了 interceptors先不管, 去看看factory里面怎么实现的
 ```js
    fn = new Function(
        this.args(),
        '"use strict";\n' +
            this.header() +
            this.content({
                onError: err => `throw ${err};\n`,
                onResult: result => `return ${result};\n`,
                resultReturns: true,
                onDone: () => "",
                rethrowIfPossible: true
            })
    );
 ```
 这里的content实际上也是放在SyncHook中的
 
 ```js
 	header() {
		let code = "";
		if (this.needContext()) {
			code += "var _context = {};\n";
		} else {
			code += "var _context;\n";
		}
		code += "var _x = this._x;\n";
		if (this.options.interceptors.length > 0) {
			code += "var _taps = this.taps;\n";
			code += "var _interceptors = this.interceptors;\n";
		}
		for (let i = 0; i < this.options.interceptors.length; i++) {
			const interceptor = this.options.interceptors[i];
			if (interceptor.call) {
				code += `${this.getInterceptor(i)}.call(${this.args({
					before: interceptor.context ? "_context" : undefined
				})});\n`;
			}
		}
		return code;
	}
 ```
 在create函数中会根据传参拼接对应的字符串生成一个新的函数，类似这样子
 
 ```js
 function anonymous(arg1, arg2, arg3
) {
"use strict";
var _context;
var _x = this._x;
var _fn0 = _x[0];
_fn0(arg1, arg2, arg3);

}

 ```
 
 ```js
  /***  对应我们一开始的
   hook.tap('hook1', (arg1, arg2, arg3) => {
    console.log(arg1, arg2, arg3);
  });
**/
 ```
 
 
```js
	setup(instance, options) {
		instance._x = options.taps.map(t => t.fn);
	}
```
 this._x 是一个数组，里面存放的就是我们注册的 taps 方法。上面代码的核心就是，遍历我们注册的 taps 方法，并去执行。

### 总结一下几个类是什么关系
![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d195a935d97b49519f5bc18ba794d011~tplv-k3u1fbpfcp-zoom-1.image)

而照葫芦画瓢，其他的hooks无非也是这样的运作模式，只不过tap可能会变成tapAsync, tapPromise
call会编程callAsync, callPromise

直接来看看其他的hooks最后生成的是什么样的运行函数呢

### 其他的Hook
#### SyncBailHook
```js
function anonymous(/*``*/) {
    "use strict";
    var _context;
    var _x = this._x;
    var _fn0 = _x[0];
    var _result0 = _fn0();
    if (_result0 !== undefined) { // 如果undefined直接返回，如果不是则需要进入下一个函数
        return _result0;
    } else {
        var _fn1 = _x[1];
        var _result1 = _fn1();
        if (_result1 !== undefined) {
            return _result1;
        } else {
        }
    }
}
```

#### SyncWaterfallHook
```js
function anonymous(arg1) { 
    "use strict";
    var _context;
    var _x = this._x;
    var _fn0 = _x[0];
    var _result0 = _fn0(arg1);
    if (_result0 !== undefined) {
        arg1 = _result0; // 这里保存结果，给下一个函数使用
    }
    var _fn1 = _x[1];
    var _result1 = _fn1(arg1);
    if (_result1 !== undefined) {
        arg1 = _result1;
    }
    return arg1;
}
```
#### AsyncSeriesHook
```js
function anonymous(_callback) {
    "use strict";
    var _context;
    var _x = this._x;
    var _fn0 = _x[0];
    _fn0(_err0 => {
        if (_err0) {
            _callback(_err0);
        } else {
            var _fn1 = _x[1];
            _fn1(_err1 => {
                if (_err1) {
                    _callback(_err1);
                } else {
                    _callback(); // 串行执行，最后返回_callback
                }
            });
        }
    });
}
```

#### AsyncParallelHook

```js
function anonymous(_callback) {
    "use strict";
    var _context;
    var _x = this._x;
    do {
        var _counter = 2; // 注册事件的数量
        var _done = () => {
            _callback();
        };

        if (_counter <= 0) break;

        var _fn0 = _x[0];

        _fn0(_err0 => {
            // 这个函数是 next 函数
            // 调用这个函数的时间不能确定，有可能已经执行了接下来的几个注册函数
            if (_err0) {
                // 如果还没执行所有注册函数，终止
                if (_counter > 0) {
                    _callback(_err0);
                    _counter = 0;
                }
            } else {
                // 检查 _counter 的值，如果是 0 的话，则结束
                // 同样，由于函数实际调用时间无法确定，需要检查是否已经运行完毕，
                if (--_counter === 0) {
                    _done()
                };
            }
        });

        // 执行下一个注册回调之前，检查_counter是否被重置等，如果重置说明某些地方返回err，直接终止。
        if (_counter <= 0) break;

        var _fn1 = _x[1];

        _fn1(_err1 => {
            if (_err1) {
                if (_counter > 0) {
                    _callback(_err1);
                    _counter = 0;
                }
            } else {
                if (--_counter === 0) _done();
            }
        });

    } while (false);
}
```
这里事件是并发执行的

### webpack事件流
那么在webpack中是如何应用tapable的呢？

#### compiler
compiler对象是webpack的编译器对象，会在webpack第一次初始化的时候生成，接受了用户的自定义配置合成对应的参数，我们可以通过compiler对象拿到webpack的主环境信息

#### compilation
继承于compiler, compilation 对象代表了一次单一的版本构建和生成资源。当运行 webpack 开发环境中间件时，每当检测到一个文件变化，一次新的编译将被创建，从而生成一组新的编译资源。一个编译对象表现了当前的模块资源、编译生成资源、变化的文件、以及被跟踪依赖的状态信息。编译对象也提供了很多关键点回调供插件做自定义处理时选择使用。

#### hooks
实际上以上两者都继承自tapable
```js
// compiler的hooks
this.hooks = {
			/** @type {SyncBailHook<Compilation>} */
			shouldEmit: new SyncBailHook(["compilation"]),
			/** @type {AsyncSeriesHook<Stats>} */
			done: new AsyncSeriesHook(["stats"]),
			/** @type {AsyncSeriesHook<>} */
			additionalPass: new AsyncSeriesHook([]),
			/** @type {AsyncSeriesHook<Compiler>} */
			beforeRun: new AsyncSeriesHook(["compiler"]),
			/** @type {AsyncSeriesHook<Compiler>} */
			run: new AsyncSeriesHook(["compiler"]),
			/** @type {AsyncSeriesHook<Compilation>} */
			emit: new AsyncSeriesHook(["compilation"]),
			/** @type {AsyncSeriesHook<string, Buffer>} */
			assetEmitted: new AsyncSeriesHook(["file", "content"]),
			/** @type {AsyncSeriesHook<Compilation>} */
			afterEmit: new AsyncSeriesHook(["compilation"]),

			/** @type {SyncHook<Compilation, CompilationParams>} */
			thisCompilation: new SyncHook(["compilation", "params"]),
			/** @type {SyncHook<Compilation, CompilationParams>} */
			compilation: new SyncHook(["compilation", "params"]),
			/** @type {SyncHook<NormalModuleFactory>} */
			normalModuleFactory: new SyncHook(["normalModuleFactory"]),
			/** @type {SyncHook<ContextModuleFactory>}  */
			contextModuleFactory: new SyncHook(["contextModulefactory"]),

			/** @type {AsyncSeriesHook<CompilationParams>} */
			beforeCompile: new AsyncSeriesHook(["params"]),
			/** @type {SyncHook<CompilationParams>} */
			compile: new SyncHook(["params"]),
			/** @type {AsyncParallelHook<Compilation>} */
			make: new AsyncParallelHook(["compilation"]),
			/** @type {AsyncSeriesHook<Compilation>} */
			afterCompile: new AsyncSeriesHook(["compilation"]),

			/** @type {AsyncSeriesHook<Compiler>} */
			watchRun: new AsyncSeriesHook(["compiler"]),
			/** @type {SyncHook<Error>} */
			failed: new SyncHook(["error"]),
			/** @type {SyncHook<string, string>} */
			invalid: new SyncHook(["filename", "changeTime"]),
			/** @type {SyncHook} */
			watchClose: new SyncHook([]),

			/** @type {SyncBailHook<string, string, any[]>} */
			infrastructureLog: new SyncBailHook(["origin", "type", "args"]),

			// TODO the following hooks are weirdly located here
			// TODO move them for webpack 5
			/** @type {SyncHook} */
			environment: new SyncHook([]),
			/** @type {SyncHook} */
			afterEnvironment: new SyncHook([]),
			/** @type {SyncHook<Compiler>} */
			afterPlugins: new SyncHook(["compiler"]),
			/** @type {SyncHook<Compiler>} */
			afterResolvers: new SyncHook(["compiler"]),
			/** @type {SyncBailHook<string, Entry>} */
			entryOption: new SyncBailHook(["context", "entry"])
		};
```

```js
// compilation的hooks
this.hooks = {
			/** @type {SyncHook<Module>} */
			buildModule: new SyncHook(["module"]),
			/** @type {SyncHook<Module>} */
			rebuildModule: new SyncHook(["module"]),
			/** @type {SyncHook<Module, Error>} */
			failedModule: new SyncHook(["module", "error"]),
			/** @type {SyncHook<Module>} */
			succeedModule: new SyncHook(["module"]),

			/** @type {SyncHook<Dependency, string>} */
			addEntry: new SyncHook(["entry", "name"]),
			/** @type {SyncHook<Dependency, string, Error>} */
			failedEntry: new SyncHook(["entry", "name", "error"]),
			/** @type {SyncHook<Dependency, string, Module>} */
			succeedEntry: new SyncHook(["entry", "name", "module"]),

			/** @type {SyncWaterfallHook<DependencyReference, Dependency, Module>} */
			dependencyReference: new SyncWaterfallHook([
				"dependencyReference",
				"dependency",
				"module"
			]),

			/** @type {AsyncSeriesHook<Module[]>} */
			finishModules: new AsyncSeriesHook(["modules"]),
			/** @type {SyncHook<Module>} */
			finishRebuildingModule: new SyncHook(["module"]),
			/** @type {SyncHook} */
			unseal: new SyncHook([]),
			/** @type {SyncHook} */
			seal: new SyncHook([]),

			/** @type {SyncHook} */
			beforeChunks: new SyncHook([]),
			/** @type {SyncHook<Chunk[]>} */
			afterChunks: new SyncHook(["chunks"]),

			/** @type {SyncBailHook<Module[]>} */
			optimizeDependenciesBasic: new SyncBailHook(["modules"]),
			/** @type {SyncBailHook<Module[]>} */
			optimizeDependencies: new SyncBailHook(["modules"]),
			/** @type {SyncBailHook<Module[]>} */
			optimizeDependenciesAdvanced: new SyncBailHook(["modules"]),
			/** @type {SyncBailHook<Module[]>} */
			afterOptimizeDependencies: new SyncHook(["modules"]),

			/** @type {SyncHook} */
			optimize: new SyncHook([]),
			/** @type {SyncBailHook<Module[]>} */
			optimizeModulesBasic: new SyncBailHook(["modules"]),
			/** @type {SyncBailHook<Module[]>} */
			optimizeModules: new SyncBailHook(["modules"]),
			/** @type {SyncBailHook<Module[]>} */
			optimizeModulesAdvanced: new SyncBailHook(["modules"]),
			/** @type {SyncHook<Module[]>} */
			afterOptimizeModules: new SyncHook(["modules"]),

			/** @type {SyncBailHook<Chunk[], ChunkGroup[]>} */
			optimizeChunksBasic: new SyncBailHook(["chunks", "chunkGroups"]),
			/** @type {SyncBailHook<Chunk[], ChunkGroup[]>} */
			optimizeChunks: new SyncBailHook(["chunks", "chunkGroups"]),
			/** @type {SyncBailHook<Chunk[], ChunkGroup[]>} */
			optimizeChunksAdvanced: new SyncBailHook(["chunks", "chunkGroups"]),
			/** @type {SyncHook<Chunk[], ChunkGroup[]>} */
			afterOptimizeChunks: new SyncHook(["chunks", "chunkGroups"]),

			/** @type {AsyncSeriesHook<Chunk[], Module[]>} */
			optimizeTree: new AsyncSeriesHook(["chunks", "modules"]),
			/** @type {SyncHook<Chunk[], Module[]>} */
			afterOptimizeTree: new SyncHook(["chunks", "modules"]),

			/** @type {SyncBailHook<Chunk[], Module[]>} */
			optimizeChunkModulesBasic: new SyncBailHook(["chunks", "modules"]),
			/** @type {SyncBailHook<Chunk[], Module[]>} */
			optimizeChunkModules: new SyncBailHook(["chunks", "modules"]),
			/** @type {SyncBailHook<Chunk[], Module[]>} */
			optimizeChunkModulesAdvanced: new SyncBailHook(["chunks", "modules"]),
			/** @type {SyncHook<Chunk[], Module[]>} */
			afterOptimizeChunkModules: new SyncHook(["chunks", "modules"]),
			/** @type {SyncBailHook} */
			shouldRecord: new SyncBailHook([]),

			/** @type {SyncHook<Module[], any>} */
			reviveModules: new SyncHook(["modules", "records"]),
			/** @type {SyncHook<Module[]>} */
			optimizeModuleOrder: new SyncHook(["modules"]),
			/** @type {SyncHook<Module[]>} */
			advancedOptimizeModuleOrder: new SyncHook(["modules"]),
			/** @type {SyncHook<Module[]>} */
			beforeModuleIds: new SyncHook(["modules"]),
			/** @type {SyncHook<Module[]>} */
			moduleIds: new SyncHook(["modules"]),
			/** @type {SyncHook<Module[]>} */
			optimizeModuleIds: new SyncHook(["modules"]),
			/** @type {SyncHook<Module[]>} */
			afterOptimizeModuleIds: new SyncHook(["modules"]),

			/** @type {SyncHook<Chunk[], any>} */
			reviveChunks: new SyncHook(["chunks", "records"]),
			/** @type {SyncHook<Chunk[]>} */
			optimizeChunkOrder: new SyncHook(["chunks"]),
			/** @type {SyncHook<Chunk[]>} */
			beforeChunkIds: new SyncHook(["chunks"]),
			/** @type {SyncHook<Chunk[]>} */
			optimizeChunkIds: new SyncHook(["chunks"]),
			/** @type {SyncHook<Chunk[]>} */
			afterOptimizeChunkIds: new SyncHook(["chunks"]),

			/** @type {SyncHook<Module[], any>} */
			recordModules: new SyncHook(["modules", "records"]),
			/** @type {SyncHook<Chunk[], any>} */
			recordChunks: new SyncHook(["chunks", "records"]),

			/** @type {SyncHook} */
			beforeHash: new SyncHook([]),
			/** @type {SyncHook<Chunk>} */
			contentHash: new SyncHook(["chunk"]),
			/** @type {SyncHook} */
			afterHash: new SyncHook([]),
			/** @type {SyncHook<any>} */
			recordHash: new SyncHook(["records"]),
			/** @type {SyncHook<Compilation, any>} */
			record: new SyncHook(["compilation", "records"]),

			/** @type {SyncHook} */
			beforeModuleAssets: new SyncHook([]),
			/** @type {SyncBailHook} */
			shouldGenerateChunkAssets: new SyncBailHook([]),
			/** @type {SyncHook} */
			beforeChunkAssets: new SyncHook([]),
			/** @type {SyncHook<Chunk[]>} */
			additionalChunkAssets: new SyncHook(["chunks"]),

			/** @type {AsyncSeriesHook} */
			additionalAssets: new AsyncSeriesHook([]),
			/** @type {AsyncSeriesHook<Chunk[]>} */
			optimizeChunkAssets: new AsyncSeriesHook(["chunks"]),
			/** @type {SyncHook<Chunk[]>} */
			afterOptimizeChunkAssets: new SyncHook(["chunks"]),
			/** @type {AsyncSeriesHook<CompilationAssets>} */
			optimizeAssets: new AsyncSeriesHook(["assets"]),
			/** @type {SyncHook<CompilationAssets>} */
			afterOptimizeAssets: new SyncHook(["assets"]),

			/** @type {SyncBailHook} */
			needAdditionalSeal: new SyncBailHook([]),
			/** @type {AsyncSeriesHook} */
			afterSeal: new AsyncSeriesHook([]),

			/** @type {SyncHook<Chunk, Hash>} */
			chunkHash: new SyncHook(["chunk", "chunkHash"]),
			/** @type {SyncHook<Module, string>} */
			moduleAsset: new SyncHook(["module", "filename"]),
			/** @type {SyncHook<Chunk, string>} */
			chunkAsset: new SyncHook(["chunk", "filename"]),

			/** @type {SyncWaterfallHook<string, TODO>} */
			assetPath: new SyncWaterfallHook(["filename", "data"]), // TODO MainTemplate

			/** @type {SyncBailHook} */
			needAdditionalPass: new SyncBailHook([]),

			/** @type {SyncHook<Compiler, string, number>} */
			childCompiler: new SyncHook([
				"childCompiler",
				"compilerName",
				"compilerIndex"
			]),

			/** @type {SyncBailHook<string, LogEntry>} */
			log: new SyncBailHook(["origin", "logEntry"]),

			// TODO the following hooks are weirdly located here
			// TODO move them for webpack 5
			/** @type {SyncHook<object, Module>} */
			normalModuleLoader: new SyncHook(["loaderContext", "module"]),

			/** @type {SyncBailHook<Chunk[]>} */
			optimizeExtractedChunksBasic: new SyncBailHook(["chunks"]),
			/** @type {SyncBailHook<Chunk[]>} */
			optimizeExtractedChunks: new SyncBailHook(["chunks"]),
			/** @type {SyncBailHook<Chunk[]>} */
			optimizeExtractedChunksAdvanced: new SyncBailHook(["chunks"]),
			/** @type {SyncHook<Chunk[]>} */
			afterOptimizeExtractedChunks: new SyncHook(["chunks"])
		};
```

同时两者在构造函数中会初始化很多不同类型的hooks
在初始化构建参数的过程中，会遍历plugins执行plugin里面的apply的方法。
而在apply方法中一般都会进行监听，比如
```js
apply(compiler) {
		compiler.hooks.compilation.tap(
			"DllEntryPlugin",
			(compilation, { normalModuleFactory }) => {
				const dllModuleFactory = new DllModuleFactory();
				compilation.dependencyFactories.set(
					DllEntryDependency,
					dllModuleFactory
				);
				compilation.dependencyFactories.set(
					SingleEntryDependency,
					normalModuleFactory
				);
			}
		);
		compiler.hooks.make.tapAsync("DllEntryPlugin", (compilation, callback) => {
			compilation.addEntry(
				this.context,
				new DllEntryDependency(
					this.entries.map((e, idx) => {
						const dep = new SingleEntryDependency(e);
						dep.loc = {
							name: this.name,
							index: idx
						};
						return dep;
					}),
					this.name
				),
				this.name,
				callback
			);
		});
```
而初始化的hooks会在构建流程的不同阶段调用，因而可以根据不同的hooks触发不同的回调机制。
从而保证plugins的执行顺序

### 附 webpack构建流程
![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fdb630ab98e047a29748c8e7a59f3bf6~tplv-k3u1fbpfcp-zoom-1.image)