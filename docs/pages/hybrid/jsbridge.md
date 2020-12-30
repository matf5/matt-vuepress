# jsbridge

## 实现原理
![image.png](https://cdn.nlark.com/yuque/0/2020/png/544808/1599738161713-b869832a-ba79-4853-9408-6ec9cd584efc.png#align=left&display=inline&height=542&margin=%5Bobject%20Object%5D&name=image.png&originHeight=542&originWidth=1268&size=186557&status=done&style=none&width=1268)


JavaScript 是运行在一个单独的 JS Context 中（例如，WebView 的 Webkit 引擎、JSCore）。由于这些 Context 与原生运行环境的天然隔离，我们可以将这种情况与 RPC（Remote Procedure Call，远程过程调用）通信进行类比，将 Native 与 JavaScript 的每次互相调用看做一次 RPC 调用。

## 通信原理
### 注入api
通过 WebView 提供的接口，向 JavaScript 的 Context（window）中注入对象或者方法，让 JavaScript 调用时，直接执行相应的 Native 代码逻辑，达到 JavaScript 调用 Native 的目的。

### 拦截URL SCHEME
URL SCHEME 是一种类似于url的链接，是为了方便app直接互相调用设计的，形式和普通的 url 近似，主要区别是 protocol 和 host 一般是自定义的。
拦截 URL SCHEME 的主要流程是：Web 端通过某种方式（例如 iframe.src）发送 URL Scheme 请求，之后 Native 拦截到请求并根据 URL SCHEME（包括所带的参数）进行相关操作。
在时间过程中，这种方式有一定的缺陷：

- 使用 iframe.src 发送 URL SCHEME 会有 url 长度的隐患。



因为如果通过 location.href 连续调用 Native，很容易丢失一些调用。

## 整体流程
在 Native 端配合实现 JSBridge 的 JavaScript 调用 Native 逻辑也很简单，主要的代码逻辑是：接收到 JavaScript 消息 => 解析参数，拿到 bridgeName、data 和 callbackId => 根据 bridgeName 找到功能方法，以 data 为参数执行 => 执行返回值和 callbackId 一起回传前端。
****Native调用 JavaScript**** 也同样简单，直接自动生成一个唯一的 ResponseId，并存储句柄，然后和 data 一起发送给前端即可。


## JSBridge 的引用
### 由native端进行注入
注入方式和 Native 调用 JavaScript 类似，直接执行桥的全部代码。
#### 优点
桥的版本很容易与 Native 保持一致，Native 端不用对不同版本的 JSBridge 进行兼容。
#### 缺点
注入时机不确定，需要实现注入失败后重试的机制，保证注入的成功率，同时 JavaScript 端在调用接口时，需要优先判断 JSBridge 是否已经注入成功。

#### jsbridge接口实现


```javascript
window.JSBridge = {
    // 调用 Native
    invoke: function(msg) {
        // 判断环境，获取不同的 nativeBridge
        nativeBridge.postMessage(msg);
    },
    receiveMessage: function(msg) {
        // 处理 msg
    }
};
```


```javascript
window.JSBridge = {
    // 调用 Native
    invoke: function(bridgeName, data) {
        // 判断环境，获取不同的 nativeBridge
        nativeBridge.postMessage({
            bridgeName: bridgeName,
            data: data || {}
        });
    },
    receiveMessage: function(msg) {
        var bridgeName = msg.bridgeName,
            data = msg.data || {};
        // 具体逻辑
    }
};
```
### 由javascript端引用
直接与 JavaScript 一起执行。
#### 优点
JavaScript 端可以确定 JSBridge 的存在，直接调用即可。

#### 缺点
如果桥的实现方式有更改，JSBridge 需要兼容多版本的 Native Bridge 或者 Native Bridge 兼容多版本的 JSBridge。

![image.png](https://cdn.nlark.com/yuque/0/2020/png/544808/1599740910037-a9951751-9b23-4ad4-80bd-d7b41780d185.png#align=left&display=inline&height=574&margin=%5Bobject%20Object%5D&name=image.png&originHeight=574&originWidth=1422&size=89582&status=done&style=none&width=1422)
#### 
