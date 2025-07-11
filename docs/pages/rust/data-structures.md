# Rust 数据结构

Rust 提供了多种数据结构来组织和管理数据，主要包括结构体（struct）和枚举（enum）。

## 📋 本章内容

- [结构体（Struct）](#结构体struct)
- [方法语法](#方法语法)
- [枚举（Enum）](#枚举enum)
- [模式匹配](#模式匹配)
- [控制流与模式](#控制流与模式)

## 结构体（Struct）

结构体（structure）是一个自定义数据类型，允许你命名和包装多个相关的值，从而形成一个有意义的组合。

### 定义结构体

```rust
struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}
```

### 创建结构体实例

```rust
fn main() {
    let user1 = User {
        email: String::from("someone@example.com"),
        username: String::from("someusername123"),
        active: true,
        sign_in_count: 1,
    };
}
```

### 使用结构体

```rust
fn main() {
    let mut user1 = User {
        email: String::from("someone@example.com"),
        username: String::from("someusername123"),
        active: true,
        sign_in_count: 1,
    };

    user1.email = String::from("anotheremail@example.com");
}
```

### 字段简写语法

类似 JavaScript 的简写语法：

```rust
fn build_user(email: String, username: String) -> User {
    User {
        email,
        username,
        active: true,
        sign_in_count: 1,
    }
}
```

### 结构体更新语法

```rust
fn main() {
    let user1 = User {
        email: String::from("someone@example.com"),
        username: String::from("someusername123"),
        active: true,
        sign_in_count: 1,
    };

    let user2 = User {
        email: String::from("another@example.com"),
        ..user1  // 使用 user1 的其他字段
    };
    // 注意：发生了 Move，user1 不能再使用了
}
```

### 元组结构体

没有字段名的结构体：

```rust
struct Color(i32, i32, i32);
struct Point(i32, i32, i32);

fn main() {
    let black = Color(0, 0, 0);
    let origin = Point(0, 0, 0);
}
```

### 单元结构体

没有任何字段的结构体：

```rust
struct AlwaysEqual;

fn main() {
    let subject = AlwaysEqual;
}
```

## 调试输出

### Debug trait

在 `{}` 中加入 `:?` 指示符告诉 `println!` 我们想要使用叫做 `Debug` 的输出格式：

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!("rect1 is {:?}", rect1);
    println!("rect1 is {:#?}", rect1);  // 更清晰的格式
}
```

### dbg! 宏

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let scale = 2;
    let rect1 = Rectangle {
        width: dbg!(30 * scale),
        height: 50,
    };

    dbg!(&rect1);
}
```

## 方法语法

### 定义方法

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    // &self 实际上是 self: &Self 的缩写
    fn area(&self) -> u32 {
        self.width * self.height
    }
    
    fn width(&self) -> bool {
        self.width > 0
    }
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!(
        "The area of the rectangle is {} square pixels.",
        rect1.area()
    );
}
```

### 带有更多参数的方法

```rust
impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };
    let rect2 = Rectangle {
        width: 10,
        height: 40,
    };
    let rect3 = Rectangle {
        width: 60,
        height: 45,
    };

    println!("Can rect1 hold rect2? {}", rect1.can_hold(&rect2));
    println!("Can rect1 hold rect3? {}", rect1.can_hold(&rect3));
}
```

### 关联函数

```rust
impl Rectangle {
    fn square(size: u32) -> Rectangle {
        Rectangle {
            width: size,
            height: size,
        }
    }
}

fn main() {
    let sq = Rectangle::square(3);
}
```

### 多个 impl 块

```rust
impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}
```

## 枚举（Enum）

枚举允许你通过列举可能的 **成员**（variants）来定义一个类型。

### 定义枚举

```rust
enum IpAddrKind {
    V4,
    V6,
}

let four = IpAddrKind::V4;
let six = IpAddrKind::V6;
```

### 枚举值

```rust
enum IpAddr {
    V4(u8, u8, u8, u8),
    V6(String),
}

let home = IpAddr::V4(127, 0, 0, 1);
let loopback = IpAddr::V6(String::from("::1"));
```

### 复杂枚举

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}
```

### 枚举的方法

```rust
impl Message {
    fn call(&self) {
        // 方法体在这里定义
    }
}

let m = Message::Write(String::from("hello"));
m.call();
```

## Option 枚举

Option 是标准库中定义的枚举，用于表示可能的空值：

```rust
enum Option<T> {
    Some(T),
    None,
}
```

### 使用 Option

```rust
let some_number = Some(5);
let some_string = Some("a string");

let absent_number: Option<i32> = None;
```

### Option 的安全性

```rust
let x: i8 = 5;
let y: Option<i8> = Some(5);

// let sum = x + y; // 错误！不能直接相加
```

## 模式匹配

### match 表达式

```rust
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}
```

### 绑定值的模式

```rust
#[derive(Debug)]
enum UsState {
    Alabama,
    Alaska,
    // --snip--
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter(state) => {
            println!("State quarter from {:?}!", state);
            25
        }
    }
}
```

### 匹配 Option<T>

```rust
fn plus_one(x: Option<i32>) -> Option<i32> {
    match x {
        None => None,
        Some(i) => Some(i + 1),
    }
}

let five = Some(5);
let six = plus_one(five);
let none = plus_one(None);
```

### 通配模式

```rust
let dice_roll = 9;
match dice_roll {
    3 => add_fancy_hat(),
    7 => remove_fancy_hat(),
    other => move_player(other),  // 捕获所有其他值
}

fn add_fancy_hat() {}
fn remove_fancy_hat() {}
fn move_player(num_spaces: u8) {}
```

### 使用 `_` 占位符

```rust
let dice_roll = 9;
match dice_roll {
    3 => add_fancy_hat(),
    7 => remove_fancy_hat(),
    _ => reroll(),  // 忽略其他值
}

fn add_fancy_hat() {}
fn remove_fancy_hat() {}
fn reroll() {}
```

## 控制流与模式

### if let 语法

`if let` 语法让你以一种不那么冗长的方式结合 `if` 和 `let`：

```rust
let config_max = Some(3u8);
match config_max {
    Some(max) => println!("The maximum is configured to be {}", max),
    _ => (),
}

// 等价于
if let Some(max) = config_max {
    println!("The maximum is configured to be {}", max);
}
```

### if let 与 else

```rust
let mut count = 0;
if let Coin::Quarter(state) = coin {
    println!("State quarter from {:?}!", state);
} else {
    count += 1;
}
```

### while let 循环

```rust
let mut stack = Vec::new();

stack.push(1);
stack.push(2);
stack.push(3);

while let Some(top) = stack.pop() {
    println!("{}", top);
}
```

### for 循环中的模式

```rust
let v = vec!['a', 'b', 'c'];

for (index, value) in v.iter().enumerate() {
    println!("{} is at index {}", value, index);
}
```

### let 语句中的模式

```rust
let (x, y, z) = (1, 2, 3);
```

### 函数参数中的模式

```rust
fn print_coordinates(&(x, y): &(i32, i32)) {
    println!("Current location: ({}, {})", x, y);
}

fn main() {
    let point = (3, 5);
    print_coordinates(&point);
}
```

## 💡 关键要点

1. **结构体适合组织相关数据**：将相关的数据组织在一起
2. **方法定义行为**：通过 `impl` 块为结构体添加方法
3. **枚举表示选择**：用于表示一个值可能是几种可能之一
4. **Option 处理空值**：Rust 的空值安全机制
5. **模式匹配是强大的**：match 表达式提供了强大的控制流
6. **编译时检查**：Rust 确保所有可能的情况都被处理

## 🎯 实践建议

1. **使用结构体组织相关数据**
2. **为结构体实现有意义的方法**
3. **利用枚举表示状态或选择**
4. **用 Option 替代空值**
5. **使用模式匹配处理不同情况**
6. **利用 `if let` 简化单一匹配**

## 🔗 相关链接

- **上一章**: [所有权系统](./ownership.md)
- **下一章**: [集合类型](./collections.md)
- **相关概念**: [泛型与特征](./generics-and-traits.md)

---

[返回索引](./index.md) 