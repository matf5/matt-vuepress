# react-native启动原理探究(Android）

## 背景
公司有一部分业务是使用react-native的开发，了解源码中的启动流程有助于我们更好得进行开发
本文以`react-native@0.65.1`的Android版本进行研究

## 项目入口

通过`rn-cli`新建一个项目，我们可以查看到主要有两个文件：`MainActivity`， `MainApplication`

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646557.png)

#### MainApplication

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646558.png)

对于MainApplication来说。主要有两点需要关注

1.  onCreate的时候初始化了关于c++层加载解析的库`SoLoader`
2.  持有ReactNativeHost，查看reactNativeHost如下

主要作用是保存当前的app的应用实例，并且从这其中能够新建一个`reactInstanceManager`，将一些初始化的参数传进去，可以理解为一个中转站

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646559.png)

这里在去到builder文件里查看

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646560.png)

赋值了默认的js excutor以及jsbundleLoader默认使用createAssetLoader，这里是个小伏笔，后面会用到

这里暂不先去看`ReactInstanceManage`里面做了什么。因为这里还没有方法的调用

到这里`MainApplication`就初始化完成了

接下来就去看`MainActivity`

#### MainActivity

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646561.png)

`MainActivity`继承自我们的关键成员之一`ReactActivity`

## java层关键代码

#### ReactActivity

`ReactActivity`实际上只是个挂名activity，其间关于rn应用的操作都通过调用`ReactActivityDelegate`进行。

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646562.png)

接下来看看ReactActivityDelegate的create做了什么

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646563.png)

这里主要初始化了reactDelegate的实例，并且将当前的activity以及一些初始化参数传了进去，然后调用了`reactDelegate`的`loadApp`方法

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646564.png)

可以看到`loadApp`方法主要就是调用了刚刚提到的另一个关键成员`ReactRootView`

的`startApplication`的方法，这里应该就是关键的启动流程了

总结一下Delegate这块的调用，主要就是三步

1.  创建reactRootView作为承载rn应用的view
2.  调用ReactRootView的startRactApplication去执行rn应用的启动流程
3.  将创建的reactRootView设置到activity中

接下来看看`ReactRootView`

#### ReactRootVIew

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646565.png)

ReactRootView这里有一个注释总结了ReactRootView的作用

主要就是作为rn应用的根试图为元素作布局，同时监听一些原生事件给到js那边去处理

关注一下他的startApplication方法

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646566.png)

这里在确保当前运行在ui线程后，调用了`reactInstanceManager`

的`createReactContextInBackground`方法

#### ReactContext

最终实际上是调用到了`recreateReactContextInBackground`

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646567.png)

runCreateReactContextOnNewThread的主要逻辑如下

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646568.png)

主要任务就是初始化rn上下文，并将他设置好。

先查看其第一步，`createReactContext`

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646569.png)

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646570.png)

这里出现了刚刚的另一个核心成员通信桥梁 `catalysInstanceImpl`

这里主要做了几件事情

1.  创建JavaModule注册表
2.  创建好`catalysInstanceImpl`实例
3.  如果存在jsiModule，也一起注册了
4.  开始加载js bundle

先来查看一下CatalysInstanceImpl的构造方法

#### CatalysInstanceImpl

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646571.png)

查看`CatalysInstanceImpl`的构造函数，这里主要有两个关键点

1.  初始化c++的方法
2.  初始化桥，实际上是调用的native的方法（这里在后面通信部分详细解读）

我们先继续看启动流程，查看`runJSBundle`

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646572.png)

得知实际上也是调用了`jsbundleLoader`的loadScript方法

进入`jsbundleLoader`

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646573.png)

看到有好几种loader，想起了前面埋下的那个伏笔，这里应该是用的`createAssetLoader,` 其间的`loadScript`

实际上是调用了`CatalysInstanceImpl`的`loadScriptFromAssets`方法

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646574.png)

这里实际上也是调用了原生c++方法，

综上，在这里实际上catalysInstanceImpl初始化后就调用了loadjs的方法

先画一个当前的流程图

## java层总结

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646575.jpg)

## c++层初始化

进入`CatalysInstaneImpl.cpp`

看到这里注册了一系列方法，里面有刚刚Java层调用的`initializeBridge和jniLoadScriptFromAssets`

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646576.png)

我们还是先看loadScript的处理

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646577.png)

继续,最终通过调用链路instance::loadScriptFromString → loadBundle → nativeToJsBridge → JSIExcutor 

调用到loadbundle

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646578.png)

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646579.png)

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646580.png)

会有两步执行，第一步就是通过jscore直接执行javascript的脚本，也即我们打包出来的bundle入口文件

第二步是执行bindBrdige,这一步我们也先忽略，后面通信部分会讲，先记住这个方法名 bindBridge

第一步是执行bundle入口文件

回到我们熟悉的js代码，入口文件

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646581.png)

实际上调用了appRegistry.registerComponent

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646582.png)

registerComponent实际上只是把应用的rederApplication方法的调用以appKey为索引存储在了runnables中, 看起来还是需要有一个地方去调用renderApplication

我们继续看java层的流程，前面提到在创建完RN上下文后会进行setup，接下来看看setup主要做了什么

## 执行render

js执行完毕后，回到java层的ReactInstanceManager接下来执行了什么

在`setupReactContext`中会调用`attachRootViewToInstance`

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646583.png)

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646584.png)

这里继续查看

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646585.png)

可喜的发现，在这里会找到appRegistry并调用其的runApplication方法

先忽略getJSModuel这个方法，这里实际上也是bridge的调用（后面讲bridge native调用js会提到)

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646586.png)

到了rn这里就是通过在runnable中找到对应的comp去执行renderApplication了

到这里整个启动流程就结束了

接下来就是js端的执行，计算虚拟dom。最终再通过bridge交由原生模块渲染

## 总结

总体的流程图应该是这样的

![](https://matf5.github.io/matt-blog/image/rn%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B/708646587.jpg)

总结下总体的流程

1.  ReactActivity持有ReactInstanceManager，并且设置了ReactRootView
2.  然后通过ReactRootView去调用Manager创建Rn的上下文
3.  在这里会实例化CatalysInstanceImpl，CatalysInstanceImpl会注册需要暴露的原生模块以及要调用的js模块
4.  然后就会调用loadJs方法以及initialBridge，初始化桥在原生部分的代码
5.  然后这里就进入了C++层
6.  在C++层加载bundle并通过js引擎去执行bundle
7.  加载进来的bundle就是我们打包的入口文件
8.  在bundle这一层就是利用appRegistry去注册我们的component以及render的方法
9.  然后在load完js后java层会调用renderApplication，找到runnable中的函数并执行，最终渲染。这里会涉及到一点桥的通信，后面会提到。(敬请期待下一篇)

参考文档：

[ReactNative源码篇：启动流程](https://github.com/sucese/react-native/blob/master/doc/ReactNative%E6%BA%90%E7%A0%81%E7%AF%87/3ReactNative%E6%BA%90%E7%A0%81%E7%AF%87%EF%BC%9A%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B.md)