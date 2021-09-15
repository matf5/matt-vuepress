# react-native bridge原理探究

## 背景
前文
[react-native启动原理探究（Android）](https://juejin.cn/post/7007638934301704223) 提到了在rn在初始化的过程中会调用bridge初始化相关的流程，解析来我们就分析bridge是如何初始化的，以及js与native的相互调用
## bridge初始化

### 整体流程

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646488.jpg)

前面在启动流程中分析到，在java层的`CatalysInstnaceImpl`

中会调用`initializeBridge`方法以及C++层`bindBridge`

方法，接下来我们就看看这两个方法做了什么

### initializeBridge

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646489.png)

该方法实际上是调用原生c++的方法，同时这里会将原生的模块传下去以及调用js的回调传下去

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646490.png)

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646491.png)

这里主要是将几种原生模块统一用`moduleRegistry`注册，再交由instance去统一初始化，

这里的原生模块会通过`JavaModuleWrapper`去封装，后面会提到这里，先记住`mMethods`和`mDescs`

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646492.png)

继续看intializeBridge做了什么

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646493.png)

最终调用的是的jsiexcutor的方法

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646494.png)

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646495.png)

这里设置了三个变量

1.  nativeModuleProxy 记录了原生的模块
2.  nativeFlushQueueImmediate 提供js调用的方法
3.  nativeCallSyncHook 同步调用。属于jsi的方法

这些方法我们后面实际调用的时候再分析

然后继续看bindBridge做了什么

### bindBridge

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646496.png)

这里是将bachedBrdige中的几个函数方法绑定到native中，先不管这几个方法主要是干什么的

那么batchBrdige又是什么时候引入的

这时候我们从RN应用入口文件中的appRegistry找到对batchedBridge的引用

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646497.png)

同时BatchedBridge内部主要干了两件事

1.  实例化一个新的messageQueue
2.  将自身绑定到全局变量伤的\_\_fbBatchedBridge，所以bindBridge那里才可以找到

在messageQueue中我们找到了刚刚绑定的那两个函数

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646498.png)

再回顾一下流程
![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646488.jpg)
实际上主要就是这几步：
1. `CatalysInstanceImpl`注册了`NativeModuleRegistry`以及`JSmoduleResgistry`后，调用`initialBrdige`方法，将注册表穿过去

2. 然后在C++这一层的主要作用就是进行绑定，分别把Native注册的模块暴露给js，以及`messageQueue`中的方法暴露给Native

3. 前面在加载bundle的时候会引用`AppResgitry`，`AppRegistry`就把`batchBridge`初始化了


## js调用native

### 一个官方的demo

Android端设置模块，并且暴露show方法，以及常量
![](https://gitee.com/matf5/file-cache/raw/master/image/picgo/20210915142258.png)

JS端直接引用
![](https://gitee.com/matf5/file-cache/raw/master/image/picgo/20210915142509.png)
利用官方的demo我们从源码进行分析
### 整体流程

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646499.jpg)

在BatchBridge/NativeModules中看到

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646500.png)

nativeModules会被赋值成global.nativeModuleProxy

回顾一下之前初始化bridge， 就有设置这个全局变量

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646501.png)

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646502.png)

最终根据调用链路找到了`createModule`

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646503.png)

createModule这里主要做了三件事：

1.  从全局这里获取 '\_\_fbGenNativeModule'
2.  对其进行调用，入参需要从moduleRegitry中的getConfig获取
3.  获取他的module

实际上\_\_fbGenNativeModule是在nativeModule.js中放置的

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646504.png)

我们先看看从moduleRegistry中的`getConfig`获取的参数

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646505.png)

getConfig主要两步，

1.  获取JAVA暴露的常量
2.  通过getMethods去获取要暴露的方法

这里有一个调用链路 getMethods → getMethodDescriptors → findMethods

最终调用到java层`JavaModuleWrapper`的`findMethods`

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646506.png)

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646507.png)

这里主要就是获取我们通过装饰器定义好的方法，同时获取方法的名称，以及类型，并且将他存到mMethods里面

另一方面是把函数的描述信息存到`mDescs`里面，这个会返回给C++, 因为就是刚刚那个`getConfig`调用的（往上拖半页）

综上 `getConfig`可以获取到我们定义好的模块的函数信息，以及常量信息。

然后会将获取到的信息传入到js的genModule中

继续看genModule

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646508.png)

这里是比较熟悉的js代码了

主要作用就是从刚刚获取到的配置来调用genMethod去生成调用的方法，并把方法存储起来，使得在js调用的时候，能够通过模块名索引找到

然后当我们真正的调用ToastModule.show时，就会触发到这里的流程了，会通过Toastmodule, show 这两个索引获取到对应的moduleId, methodId, 去调用genMethod生成的函数

继续看genMethod做了什么

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646509.png)

这里主要作用就是根据函数的不同类型去生成不同的方法

最终都是会调用

`enqueueNativeCall`

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646510.png)

这里主要有几件事：

1.  存储回调
2.  将要调用的模块、方法与参数信息放进队列里
3.  调用了之前initBridge设置的全局变量nativeFlushQueueImmediate，然后5秒钟以内不会进行重复发送

回过头继续看刚刚这里设置的全局变量做了什么

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646511.png)

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646512.png)

这里就用到了`ModuleRegistry`中的`callNativeMethod`

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646513.png)

最终这里实际上是根据`moduleId`找到`JavaModuleWrapper`的`invoke`方法

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646514.png)

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646515.png)

这里由于之前已经把所有暴露的方法存到`mMethods`里面了，所以这里能够通过`methodId`找到方法，利用invoke调用，并把参数传进去

再回顾一下流程

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646499.jpg)

总结为：
1. js代码调用nativeModule.js
2. 实际上被代理到了global.nativeModuleProxy
3. 而这里调用了getModule去获取模块信息, 最终获取到模块的信息，有模块名，模块id，常量，方法名
4. 实际上模块信息是从存储注册的信息中取到的
5. 这时候交给messageQueue去生成调用的方法
6. 生成调用的方法主要是通过队列存储的形式每隔5秒利用nativeFlushImmediate去调用c++层
7. 接着会调用callNativeModule
从注册的模块信息中找到对应的invoke方法进行调用


## Native调用js

### 整体流程

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646516.png)

接下来分析native调用js

前面在启动流程的有提到最终是这样子调用去运行js函数的

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646517.png)

这里AppRegistry是在android端写的一个类

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646518.png)

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646519.png)

getJSModule实际上是调用的JSModuleRegistry的getJavaScriptModule函数

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646520.png)

这里利用JAVA proxy构造了一个新的对象

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646521.png)

调用了CatalystInstance的callFunction方法

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646522.png)

最终通过 CatalystInstanceImpl::jniCallJSFunction  -> Instance::callJSFunction → nativeToJSbridge → excutor::callFunction

一系列调用链路异步调用了excutor的callFunction方法

最终是调用的executor

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646523.png)

在这里又碰到一个熟悉的变量了。之前在bindBridge就提到过。这个函数实际上存的messageQueue中的函数

这里主要有两步：

1.  调用函数
2.  结果回调native模块

去messageQueue里查看

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646524.png)

主要有两步：

1.  根据注册的模块和函数调用函数
2.  刷新队列，并将队列返回

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646525.png)

这里就是调用apply方法简单粗暴

因此总结如下：

![](http://matf5.gitee.io/matt-blog/image/rn_brdige/710646526.jpg)
1. 在reactContext中调用getJSMdule方法，传入编写好的类（要对应js模块的方法）
2. 利用proxy invoke出一个函数调用
3. 调用callFunction传参
4. 在c++层利用预先设置好的callFunctionReturnFlushedQueue去调用messgeQueue中的方法
5. 根据模块和函数id找到具体的函数并执行

参考资料：

[ReactNative源码篇：通信机制](https://github.com/sucese/react-native/blob/master/doc/ReactNative%E6%BA%90%E7%A0%81%E7%AF%87/6ReactNative%E6%BA%90%E7%A0%81%E7%AF%87%EF%BC%9A%E9%80%9A%E4%BF%A1%E6%9C%BA%E5%88%B6.md)