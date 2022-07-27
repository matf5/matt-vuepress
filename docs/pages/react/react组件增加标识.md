## 背景
最近在做一个react组件性能采集的需求, 需要在代码中获取组件名称, 并进行对应组件性能的上报, 获取名称的方式为获取函数名, 但是在production模式下名称会被混淆, 导致我们取到的名称无法识别出来对应哪个组件

## 方案
对于组件而言我们可以给组件加一个属性tag, 标识该组件, 但是当组件特别多的时候, 我们就无法一一标识了, 最好的办法是在编译阶段即针对每个组件插入tag, 因此我们可以写一个webpack plugin, 解析AST符合组件条件时即加入tag
## AST 
AST全称Abstract Syntax Tree, 是javascript语言的抽象语法树, 我们编写的js语句可以分解成多个AST节点, 通过遍历这颗节点树, 可以大致了解到整个逻辑

### 栗子
以一个简单的加法函数为例

```javascript
function add(a, b) {
    return a + b
}
```
这里我们对其拆解, 首先了解到他是一个FunctionDeclaration(函数定义)对象。
接着可以把这个对象分为三个部分

- id: add
- params: a, b
- body: return a + b

id就是组件的Identifier(标志)了
这里的AST节点就是
```javascript
{
    name: 'add'
    type: 'identifier'
    ...
}
```
params拆下去，其实是两个Identifier组成的数组.
```javascript
[
    {
        name: 'a'
        type: 'identifier'
        ...
    },
    {
        name: 'b'
        type: 'identifier'
        ...
    }
]
```
接下来body确实就是BlockStatement对象 用来表示 { return a + b }
里面实际上是ReturnStatement对象, 用来表示 return a+b
继续分解, 里面实际上是BinaryExpression对象 a+b
a 和b实际上也是两个identifier
所以最终整个解析结果如下
[https://astexplorer.net/#/gist/8d540d74b393cf0bf20b395ca783af10/886b00f1cd8b649c1610f287ddc97f896ef5062c](https://astexplorer.net/#/gist/8d540d74b393cf0bf20b395ca783af10/886b00f1cd8b649c1610f287ddc97f896ef5062c)

## 应用

### 总体方案
我们的业务模块基本是使用webpack打包的, 因此我们可以借助AST在实现一个plugin, 在解析出特定表达式时将tag植入

### 场景一 class组件
```javascript

class Foo extends React.Component {}

// or

import xxx from React; 

class Foo extends xxx {}
```
对于这种场景, 有两种情况
#### babel转成es5
```javascript
var Foo = /*#__PURE__*/function (_React$Component) {
  _inherits(Foo, _React$Component);

  var _super = _createSuper(Foo);

  function Foo() {
    _classCallCheck(this, Foo);

    return _super.apply(this, arguments);
  }

  return _createClass(Foo);
}(React.Component);
```
![image.png](https://cdn.nlark.com/yuque/0/2022/png/544808/1658669468057-54b4fa59-fbba-4264-b301-9f049ccc8c79.png#clientId=uce3280a2-bf05-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=645&id=u1122c8ca&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1290&originWidth=976&originalType=binary&ratio=1&rotation=0&showTitle=false&size=160044&status=done&style=none&taskId=ubc74c7de-a74a-452d-8566-fc11f4cc1ca&title=&width=488)
在这里我们可以看到已经出现了对应的情况
即

1. 其是一个function的表达式
1. 对于函数中的第一个参数可以通过正则表达式取出来, 因此我们可以断定以下条件

```javascript
// 1 是一个定义
node.id.type === 'Identifier'

// 2 其值是一个函数表达式
node.init.callee.type === 'FunctionExpression'

// 3 函数的第一个参数的定义中, 值满足一个正则表达式

node.init.callee.params.[0].type === 'Identifier' && /(_React\$Component)|(_Component)|(_React\$PureComponent)|_PureComponent/.test(node.init.callee.params.[0].name) 

```
#### 未经过babel转译
此时仍然是class的定义
![image.png](https://cdn.nlark.com/yuque/0/2022/png/544808/1658670916351-9421bae9-711b-43ed-90aa-523929d34fca.png#clientId=uce3280a2-bf05-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=699&id=ue6df682d&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1398&originWidth=1218&originalType=binary&ratio=1&rotation=0&showTitle=false&size=170875&status=done&style=none&taskId=u39520608-c1f0-4680-9dc4-5958b46cd92&title=&width=609)
这里是React.xx(Component或者PureComponent)的场景, 也有可能是直接xx的情况
因此判断条件为
```javascript
// 场景1 继承自 React.xx
node.superClass.object.name === 'React' && ['Component', 'PureComponent'].includes(node.superClass.property)

// 场景2 继承自xx
['Component', 'PureComponent'].includes(node.superClass)
```


### 场景二 function组件
对于函数组件来说, 我们在代码中通常写法是返回一个jsx, 	经过react的编译后代码会返回React.createElement. 
例如 
```javascript
function a() {
  return '<div><img src="avatar.png" className="profile" /></div>'
}

// 会变成

function a () {
  React.createElement( 
    "div", 
    null, 
    React.createElement("img", { 
      src: "avatar.png", 
      className: "profile" 
    })
  ); 
}
```
 AST解析出来是这样的
![image.png](https://cdn.nlark.com/yuque/0/2022/png/544808/1658672340509-a1084c4e-7a0c-4e76-8184-88449894f09c.png#clientId=uce3280a2-bf05-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=790&id=u902ffbf1&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1580&originWidth=1312&originalType=binary&ratio=1&rotation=0&showTitle=false&size=232433&status=done&style=none&taskId=ud7f99622-0c7b-4ccd-b79a-df5f7b17b13&title=&width=656)
对于这种情况, 进行如下步骤

1. 找到某个表达式, 其object.name 为React 且其property.name为createElement
1. 找到其倒数第二个祖先, 判断其为returnStatement 或者可能是一个箭头函数直接包裹

实现为
```javascript
if (node.callee.type === 'MemberExpression' && node.callee.object.name === 'React' && node.callee.property.name === 'createElement') {
  const parentAncestor = ancestors[ancestors.length - 2];
  if (parentAncestor && ['ReturnStatement', 'ArrowFunctionExpression'].includes(parentAncestor.type)) {
    return true;
  }
}
```

### 场景三 memo forwardRef
对于memo和forwardRef的场景实际上内部也是调用functon. 因此我们只需要判断这两个关键字
#### memo
memo实际上也是React.memo, 因此我们可以判断
```javascript

// 情况1 直接调用React.memo
if (node.callee.type === 'MemberExpression' && node.callee.object.name === 'React' && node.callee.property.name === 'memo') {
}
```
#### forwardRef
类似memo
```javascript
// 情况1 直接调用React.forwardRef
if (node.callee.object.name === 'React' && node.callee.propery.name === 'forwardRef') {
  return true;
}

```
#### 提前import的场景
对于memo或者forwardRef来说, 有可能是提前import进来, 当我们调用的时候就没有React这个关键字了. 因此我们需要在import声明的解析中缓存imported的状态
```javascript
ImportDeclaration(node, state) {
  // Matches: import { memo, forwardRef } from 'react'
  if (
    node?.source?.value === 'react'
    && node?.specifiers?.length
  ) {
    state.memoFunctionImported = state.memoFunctionImported || node.specifiers.some(s => s.type === 'ImportSpecifier' && s.imported.name === 'memo' )
    state.forwardRefFunctionImported = state.forwardRefFunctionImported || node.specifiers.some(s => s.type === 'ImportSpecifier' && s.imported.name === 'forwardRef' )
  }
}
```
当我们作判断时, 直接判断这个缓存状态且有对应关键词的使用
```javascript
// 缓存过状态且关键字为memo
// forwardRef同理
if (state.memoFunctionImported && node?.callee?.name ==='memo') {
  const parentAncestor = ancestors[ancestors.length - 2];
  if (parentAncestor && ['ReturnStatement', 'ArrowFunctionExpression'].includes(parentAncestor.type)) {
    return true;
  }
}
```

### 对节点添加tag
当我们找到对应的关键node时, 此时我们可通过父级或者同级关系找到需要更新的节点, 找到节点后, 可以直接将node.id.name赋值为属性prophetReactTag, 这样我们在实际使用中时即可获取到对应的组件名称

```javascript
const addProphetTag = (parser: any, node: any) => {
  if (updatedNodes.has(node)) {
    return; // Already added propertyName for this node
  }

  const componentName = node.id.name

  if (componentName?.[0] && componentName?.[0] === componentName?.[0].toLowerCase()) {
    return; // Assume lowercase names are helper functions and not Component classes
  }

  const dep = new ModuleAppenderDependency(`;try{${componentName}.prophetReactTag="${componentName}";}catch(e){}`, node.range);
  dep.loc = node.loc;
  parser.state.module.addDependency(dep);

  updatedNodes.add(node);
}
```
