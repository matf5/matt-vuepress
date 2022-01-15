# 图片懒记载
## 原理
监听当前元素在页面中的可见位置, 位于屏幕中时才开始加载图片

## 方案
使用[Intersection observer API](https://developer.mozilla.org/zh-CN/docs/Web/API/Intersection_Observer_API#intersection_observer_%E7%9A%84%E6%A6%82%E5%BF%B5%E5%92%8C%E7%94%A8%E6%B3%95)

## Intersection observer
Intersection Observer API 允许我们配置一个回调函数，当以下情况发生时会被调用:

- 每当目标(target)元素与设备视窗或者其他指定元素发生交集的时候执行。设备视窗或者其他元素我们称它为根元素或根(root)。
- Observer 第一次监听目标元素的时候

无论您是使用视口还是其他元素作为根，API都以相同的方式工作，只要目标元素的可见性发生变化，就会执行您提供的回调函数，以便它与所需的交叉点交叉。

目标(target)元素与根(root)元素之间的交叉度是交叉比(intersection ratio)。这是目标(target)元素相对于根(root)的交集百分比的表示，它的取值在0.0和1.0之间。

## observer封装

- 通过 new IntersectionObserver构造一个实例, 可供传入我们的监听函数
```javascript
const observer = new IntersectionObserver(intersectionChangeCallback, {
  rootMargin: `0px -1px 80px -1px`,
}); // 当距离下部有80px以内时即视为有进入的
```

- 设置一个map, 用于存储监听的回调事件, 其中健为元素, 值为回调函数
```javascript
const onIntersectCallbacks = new WeakMap();
```

- 提供observe和unobserve函数, observe用于添加新的监听元素与事件, unobserver用于解除
```javascript
export const observe = (
  element: HTMLElement,
  callback: () => void,
  isMultiple?: boolean // 提供是否需要调用多次, 正常情况下只使用一次(例如懒加载图片的情况下)
) => {
  onIntersectCallbacks.set(element, {
    isMultiple: !!isMultiple,    
    callback,
  }); // 设置好回调
  observer.observe(element);
};

export const unobserve = (element: HTMLElement) => {
  onIntersectCallbacks.delete(element);
  observer.unobserve(element);
};
```
- 实现回调函数逻辑

```javascript
const intersectionChangeCallback = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
  entries.forEach(change => {
    const target: Element = change.target;
    // due to recent specs change, newer browser will always call this callback upon observe
    // but will supply an `isIntersecting` field to decide
    // for older browsers, the callback will only be triggered when it really enters the viewport
    // but there will be not `isIntersecting` field set
    // guess this is the price to pay for using experimental technology
    const isIntersecting =
      change.isIntersecting !== undefined ? change.isIntersecting : true;
    if (onIntersectCallbacks.has(target) && isIntersecting) {
      const observeObject = onIntersectCallbacks.get(target);
      if (observeObject && typeof observeObject.callback === 'function') {
        observeObject.callback();
        // unobserve if isMultiple is not true, we only want to call callback once
        if (!observeObject.isMultiple) {
          observer.unobserve(target);
          onIntersectCallbacks.delete(target);
        }
      }
    }
    // if target missed, we fail silently
  });
};
```

## 封装lazyImage

### 方案

- 在没有加载图片时使用占位图
- 组件挂载时即添加监听事件
- 在监听到图片进入视图中, 即加载图片
- 在加载图片完成后替换占位图

### 代码
```javascript
class LazyImage extends React.Component<LazyImageProp, LazyImageState> {
  
  handleImageOnLoad() {
    // cancel timeout if handleImage is called
    clearTimeout(this._timeoutId);

    if (!this.state.imageReady) {
      this.setState({
        imageReady: true,
      });
    }
  }
  handleEnterViewport() {
    // 在回调后的下一帧即加载图片
    this.handleCallback = requestAnimationFrame(() => {
      const image = new Image();

      // https://developers.google.com/web/fundamentals/performance/lazy-loading-guidance/images-and-video/
      // Loading large images in JavaScript and dropping them into the DOM can tie up the main thread, causing the user interface to be unresponsive for a short period of time while decoding occurs
      
      // 这里使用decode缓存  
      if ('decode' in image) {
        image.src = this.props.src;

        // $FlowFixMe
        image
          .decode()
          .then(this.handleImageOnLoad)
          .catch(this.handleImageError);
      } else {

        (image as any).onload = this.handleImageOnLoad;
        (image as any).onerror = this.handleImageError;

        // trigger download in background
        (image as any).src = this.props.src;
      }
    });

    // this will guarantee that image will be eventually rendered
    this._timeoutId = setTimeout(this.handleImageOnLoad, TIMEOUT);
  }
  componentDidMount() {
    if (this._wrapper) {
      observe(this._wrapper, this.handleEnterViewport);
    } // 进入时挂载
  }
  render() {
     // 这里忽略一些取值操作, 阐述伪代码
     // 有图片则使用图片, 没有则使用placeholder
     (
      <div
        ref={this.onRef}
      >
        {image}
        {!this.state.imageReady ? (
          <Placeholder
          />
        ) : null}
      </div>
    );
  }
}
```


