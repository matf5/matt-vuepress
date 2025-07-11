# Rust 智能指针

指针是一个包含内存地址的变量的通用概念。智能指针是一类数据结构，它们不仅像指针一样，还拥有额外的元数据和功能。

## 📋 本章内容

- [Box<T>](#boxt)
- [Rc<T>](#rct)
- [RefCell<T>](#refcellt)
- [循环引用](#循环引用)
- [其他智能指针](#其他智能指针)

## Box<T>

`Box<T>` 允许你将一个值放在堆上而不是栈上，留在栈上的则是指向堆数据的指针。

### 使用 Box<T> 在堆上储存数据

```rust
fn main() {
    let b = Box::new(5);
    println!("b = {}", b);
}
```

### 使用 Box<T> 启用递归类型

```rust
enum List {
    Cons(i32, Box<List>),
    Nil,
}

use List::{Cons, Nil};

fn main() {
    let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil))))));
}
```

### Box<T> 的解引用

```rust
fn main() {
    let x = 5;
    let y = Box::new(x);

    assert_eq!(5, x);
    assert_eq!(5, *y);
}
```

### 实现 Deref trait

```rust
use std::ops::Deref;

struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

fn main() {
    let x = 5;
    let y = MyBox::new(x);

    assert_eq!(5, x);
    assert_eq!(5, *y);
}
```

### 解引用强制转换

```rust
fn hello(name: &str) {
    println!("Hello, {}!", name);
}

fn main() {
    let m = MyBox::new(String::from("Rust"));
    hello(&m); // 解引用强制转换：&MyBox<String> -> &String -> &str
}
```

### 解引用强制转换的三种情况

1. 当 `T: Deref<Target=U>` 时从 `&T` 到 `&U`
2. 当 `T: DerefMut<Target=U>` 时从 `&mut T` 到 `&mut U`
3. 当 `T: Deref<Target=U>` 时从 `&mut T` 到 `&U`

## 使用 Drop trait 运行清理代码

```rust
struct CustomSmartPointer {
    data: String,
}

impl Drop for CustomSmartPointer {
    fn drop(&mut self) {
        println!("Dropping CustomSmartPointer with data `{}`!", self.data);
    }
}

fn main() {
    let c = CustomSmartPointer {
        data: String::from("my stuff"),
    };
    let d = CustomSmartPointer {
        data: String::from("other stuff"),
    };
    println!("CustomSmartPointers created.");
}
```

### 提前丢弃值

```rust
fn main() {
    let c = CustomSmartPointer {
        data: String::from("some data"),
    };
    println!("CustomSmartPointer created.");
    drop(c); // 手动调用 drop
    println!("CustomSmartPointer dropped before the end of main.");
}
```

## Rc<T>

`Rc<T>` 是引用计数智能指针，用于当单个值可能有多个所有者时。

### 使用 Rc<T> 共享数据

```rust
use std::rc::Rc;

enum List {
    Cons(i32, Rc<List>),
    Nil,
}

use List::{Cons, Nil};

fn main() {
    let a = Rc::new(Cons(5, Rc::new(Cons(10, Rc::new(Nil)))));
    let b = Cons(3, Rc::clone(&a));
    let c = Cons(4, Rc::clone(&a));
}
```

### 观察引用计数

```rust
use std::rc::Rc;

fn main() {
    let a = Rc::new(Cons(5, Rc::new(Cons(10, Rc::new(Nil)))));
    println!("count after creating a = {}", Rc::strong_count(&a));
    
    let b = Cons(3, Rc::clone(&a));
    println!("count after creating b = {}", Rc::strong_count(&a));
    
    {
        let c = Cons(4, Rc::clone(&a));
        println!("count after creating c = {}", Rc::strong_count(&a));
    }
    
    println!("count after c goes out of scope = {}", Rc::strong_count(&a));
}
```

### Rc<T> 的限制

- `Rc<T>` 只能用于单线程场景
- `Rc<T>` 只允许不可变引用

## RefCell<T>

`RefCell<T>` 代表其数据的唯一所有权，与 `Box<T>` 不同，借用规则的不可变性作用于 `RefCell<T>` 的运行时而不是编译时。

### 内部可变性

```rust
pub trait Messenger {
    fn send(&self, msg: &str);
}

pub struct LimitTracker<'a, T: Messenger> {
    messenger: &'a T,
    value: usize,
    max: usize,
}

impl<'a, T> LimitTracker<'a, T>
where
    T: Messenger,
{
    pub fn new(messenger: &T, max: usize) -> LimitTracker<T> {
        LimitTracker {
            messenger,
            value: 0,
            max,
        }
    }

    pub fn set_value(&mut self, value: usize) {
        self.value = value;

        let percentage_of_max = self.value as f64 / self.max as f64;

        if percentage_of_max >= 1.0 {
            self.messenger.send("Error: You are over your quota!");
        } else if percentage_of_max >= 0.9 {
            self.messenger
                .send("Urgent warning: You've used up over 90% of your quota!");
        } else if percentage_of_max >= 0.75 {
            self.messenger
                .send("Warning: You've used up over 75% of your quota!");
        }
    }
}
```

### 使用 RefCell<T> 在运行时检查借用规则

```rust
use std::cell::RefCell;

struct MockMessenger {
    sent_messages: RefCell<Vec<String>>,
}

impl MockMessenger {
    fn new() -> MockMessenger {
        MockMessenger {
            sent_messages: RefCell::new(vec![]),
        }
    }
}

impl Messenger for MockMessenger {
    fn send(&self, message: &str) {
        self.sent_messages.borrow_mut().push(String::from(message));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_sends_an_over_75_percent_warning_message() {
        let mock_messenger = MockMessenger::new();
        let mut limit_tracker = LimitTracker::new(&mock_messenger, 100);

        limit_tracker.set_value(80);

        assert_eq!(mock_messenger.sent_messages.borrow().len(), 1);
    }
}
```

### RefCell<T> 的运行时借用检查

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(5);

    let a = data.borrow(); // 不可变借用
    let b = data.borrow(); // 可以有多个不可变借用
    
    // let c = data.borrow_mut(); // 这会 panic！
}
```

## 结合 Rc<T> 和 RefCell<T>

```rust
use std::cell::RefCell;
use std::rc::Rc;

#[derive(Debug)]
enum List {
    Cons(Rc<RefCell<i32>>, Rc<List>),
    Nil,
}

use List::{Cons, Nil};

fn main() {
    let value = Rc::new(RefCell::new(5));

    let a = Rc::new(Cons(Rc::clone(&value), Rc::new(Nil)));

    let b = Cons(Rc::new(RefCell::new(3)), Rc::clone(&a));
    let c = Cons(Rc::new(RefCell::new(4)), Rc::clone(&a));

    *value.borrow_mut() += 10;

    println!("a after = {:?}", a);
    println!("b after = {:?}", b);
    println!("c after = {:?}", c);
}
```

## 循环引用

### 创建循环引用

```rust
use std::cell::RefCell;
use std::rc::Rc;

#[derive(Debug)]
enum List {
    Cons(i32, RefCell<Rc<List>>),
    Nil,
}

impl List {
    fn tail(&self) -> Option<&RefCell<Rc<List>>> {
        match self {
            Cons(_, item) => Some(item),
            Nil => None,
        }
    }
}

use List::{Cons, Nil};

fn main() {
    let a = Rc::new(Cons(5, RefCell::new(Rc::new(Nil))));

    println!("a initial rc count = {}", Rc::strong_count(&a));
    println!("a next item = {:?}", a.tail());

    let b = Rc::new(Cons(10, RefCell::new(Rc::clone(&a))));

    println!("a rc count after b creation = {}", Rc::strong_count(&a));
    println!("b initial rc count = {}", Rc::strong_count(&b));
    println!("b next item = {:?}", b.tail());

    if let Some(link) = a.tail() {
        *link.borrow_mut() = Rc::clone(&b);
    }

    println!("b rc count after changing a = {}", Rc::strong_count(&b));
    println!("a rc count after changing a = {}", Rc::strong_count(&a));

    // 取消下面的注释来观察循环引用
    // println!("a next item = {:?}", a.tail());
}
```

### 使用 Weak<T> 避免循环引用

```rust
use std::cell::RefCell;
use std::rc::{Rc, Weak};

#[derive(Debug)]
struct Node {
    value: i32,
    parent: RefCell<Weak<Node>>,
    children: RefCell<Vec<Rc<Node>>>,
}

fn main() {
    let leaf = Rc::new(Node {
        value: 3,
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(vec![]),
    });

    println!("leaf parent = {:?}", leaf.parent.borrow().upgrade());

    let branch = Rc::new(Node {
        value: 5,
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(vec![Rc::clone(&leaf)]),
    });

    *leaf.parent.borrow_mut() = Rc::downgrade(&branch);

    println!("leaf parent = {:?}", leaf.parent.borrow().upgrade());
}
```

### 观察强引用和弱引用计数

```rust
fn main() {
    let leaf = Rc::new(Node {
        value: 3,
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(vec![]),
    });

    println!(
        "leaf strong = {}, weak = {}",
        Rc::strong_count(&leaf),
        Rc::weak_count(&leaf),
    );

    {
        let branch = Rc::new(Node {
            value: 5,
            parent: RefCell::new(Weak::new()),
            children: RefCell::new(vec![Rc::clone(&leaf)]),
        });

        *leaf.parent.borrow_mut() = Rc::downgrade(&branch);

        println!(
            "branch strong = {}, weak = {}",
            Rc::strong_count(&branch),
            Rc::weak_count(&branch),
        );

        println!(
            "leaf strong = {}, weak = {}",
            Rc::strong_count(&leaf),
            Rc::weak_count(&leaf),
        );
    }

    println!("leaf parent = {:?}", leaf.parent.borrow().upgrade());
    println!(
        "leaf strong = {}, weak = {}",
        Rc::strong_count(&leaf),
        Rc::weak_count(&leaf),
    );
}
```

## 其他智能指针

### Arc<T> - 原子引用计数

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(vec![1, 2, 3, 4, 5]);

    let handles: Vec<_> = (0..5).map(|i| {
        let data = Arc::clone(&data);
        thread::spawn(move || {
            println!("Thread {}: {:?}", i, data);
        })
    }).collect();

    for handle in handles {
        handle.join().unwrap();
    }
}
```

### Mutex<T> - 互斥锁

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Result: {}", *counter.lock().unwrap());
}
```

### Cell<T> - 内部可变性

```rust
use std::cell::Cell;

fn main() {
    let data = Cell::new(5);
    
    let old_value = data.replace(10);
    println!("Old value: {}", old_value);
    println!("New value: {}", data.get());
}
```

## 智能指针的选择指南

### 单线程场景

| 需求 | 推荐使用 |
|------|----------|
| 堆分配 | `Box<T>` |
| 多所有者 | `Rc<T>` |
| 内部可变性 | `RefCell<T>` |
| 多所有者 + 内部可变性 | `Rc<RefCell<T>>` |

### 多线程场景

| 需求 | 推荐使用 |
|------|----------|
| 多所有者 | `Arc<T>` |
| 内部可变性 | `Mutex<T>` |
| 多所有者 + 内部可变性 | `Arc<Mutex<T>>` |

## 💡 关键要点

1. **Box<T>** 用于在堆上分配内存
2. **Rc<T>** 允许多个所有者
3. **RefCell<T>** 在运行时检查借用规则
4. **循环引用会导致内存泄漏**
5. **使用 Weak<T> 打破循环引用**
6. **智能指针实现了 Deref 和 Drop**

## 🎯 实践建议

1. **默认使用 Box<T>**：当需要在堆上分配时
2. **谨慎使用 Rc<T>**：只在确实需要多个所有者时
3. **理解运行时成本**：RefCell<T> 有运行时开销
4. **避免循环引用**：使用 Weak<T> 或重新设计数据结构
5. **多线程使用 Arc<T>**：替代 Rc<T>

## 🔗 相关链接

- **上一章**: [函数式编程](./functional-programming.md)
- **下一章**: [并发编程](./concurrency.md)
- **相关概念**: [所有权系统](./ownership.md)

---

[返回索引](./index.md) 