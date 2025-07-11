# Rust 泛型、特征与生命周期

泛型、特征（trait）和生命周期是 Rust 中三个重要的概念，它们让我们编写更加灵活和安全的代码。

## 📋 本章内容

- [泛型](#泛型)
- [特征（Trait）](#特征trait)
- [生命周期](#生命周期)
- [高级特征](#高级特征)

## 泛型

泛型允许我们编写可以适用于多种类型的代码，而无需为每个类型都写一份代码。

### 函数中的泛型

```rust
fn largest<T>(list: &[T]) -> T {
    let mut largest = list[0];

    for &item in list.iter() {
        if item > largest {
            largest = item;
        }
    }

    largest
}

fn main() {
    let number_list = vec![34, 50, 25, 100, 65];
    let result = largest(&number_list);
    println!("The largest number is {}", result);

    let char_list = vec!['y', 'm', 'a', 'q'];
    let result = largest(&char_list);
    println!("The largest char is {}", result);
}
```

### 结构体中的泛型

```rust
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn new(x: T, y: T) -> Self {
        Point { x, y }
    }
}

fn main() {
    let integer = Point::new(5, 10);
    let float = Point::new(1.0, 4.0);
}
```

### 多个泛型参数

```rust
struct Point<T, U> {
    x: T,
    y: U,
}

fn main() {
    let both_integer = Point { x: 5, y: 10 };
    let both_float = Point { x: 1.0, y: 4.0 };
    let integer_and_float = Point { x: 5, y: 4.0 };
}
```

### 枚举中的泛型

```rust
enum Option<T> {
    Some(T),
    None,
}

enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

### 方法中的泛型

```rust
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

impl Point<f32> {
    fn distance_from_origin(&self) -> f32 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}
```

### 泛型方法

```rust
struct Point<T, U> {
    x: T,
    y: U,
}

impl<T, U> Point<T, U> {
    fn mixup<V, W>(self, other: Point<V, W>) -> Point<T, W> {
        Point {
            x: self.x,
            y: other.y,
        }
    }
}

fn main() {
    let p1 = Point { x: 5, y: 10.4 };
    let p2 = Point { x: "Hello", y: 'c' };

    let p3 = p1.mixup(p2);

    println!("p3.x = {}, p3.y = {}", p3.x, p3.y);
}
```

### 泛型的性能

Rust 通过**单态化**（monomorphization）来实现泛型的零成本抽象。编译器会为每个具体类型生成专门的代码。

## 特征（Trait）

特征告诉 Rust 编译器某个特定类型拥有可能与其他类型共享的功能。特征类似于其他语言中的接口概念。

### 定义特征

```rust
pub trait Summary {
    fn summarize(&self) -> String;
}
```

### 为类型实现特征

```rust
pub struct NewsArticle {
    pub headline: String,
    pub location: String,
    pub author: String,
    pub content: String,
}

impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("{}, by {} ({})", self.headline, self.author, self.location)
    }
}

pub struct Tweet {
    pub username: String,
    pub content: String,
    pub reply: bool,
    pub retweet: bool,
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("{}: {}", self.username, self.content)
    }
}
```

### 默认实现

```rust
pub trait Summary {
    fn summarize(&self) -> String {
        String::from("(Read more...)")
    }
}

impl Summary for NewsArticle {} // 使用默认实现
```

### 默认实现调用其他方法

```rust
pub trait Summary {
    fn summarize_author(&self) -> String;

    fn summarize(&self) -> String {
        format!("(Read more from {}...)", self.summarize_author())
    }
}

impl Summary for Tweet {
    fn summarize_author(&self) -> String {
        format!("@{}", self.username)
    }
}
```

## 特征作为参数

### impl Trait 语法

```rust
pub fn notify(item: impl Summary) {
    println!("Breaking news! {}", item.summarize());
}
```

### 特征约束语法

```rust
pub fn notify<T: Summary>(item: T) {
    println!("Breaking news! {}", item.summarize());
}
```

### 多个特征约束

```rust
pub fn notify(item: impl Summary + Display) {
    println!("Breaking news! {}", item.summarize());
}

// 或者
pub fn notify<T: Summary + Display>(item: T) {
    println!("Breaking news! {}", item.summarize());
}
```

### where 子句

```rust
fn some_function<T, U>(t: T, u: U) -> i32
where
    T: Display + Clone,
    U: Clone + Debug,
{
    // 函数体
}
```

### 返回实现了特征的类型

```rust
fn returns_summarizable() -> impl Summary {
    Tweet {
        username: String::from("horse_ebooks"),
        content: String::from("of course, as you probably already know, people"),
        reply: false,
        retweet: false,
    }
}
```

### 使用特征约束有条件地实现方法

```rust
use std::fmt::Display;

struct Pair<T> {
    x: T,
    y: T,
}

impl<T> Pair<T> {
    fn new(x: T, y: T) -> Self {
        Self { x, y }
    }
}

impl<T: Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.x >= self.y {
            println!("The largest member is x = {}", self.x);
        } else {
            println!("The largest member is y = {}", self.y);
        }
    }
}
```

### 为满足特征约束的所有类型实现特征

```rust
impl<T: Display> ToString for T {
    // --snip--
}
```

## 生命周期

生命周期是 Rust 中另一个与众不同的特性，它确保引用在需要时始终有效。

### 生命周期避免了悬垂引用

```rust
{
    let r;                // ---------+-- 'a
                          //          |
    {                     //          |
        let x = 5;        // -+-- 'b  |
        r = &x;           //  |       |
    }                     // -+       |
                          //          |
    println!("r: {}", r); //          |
}                         // ---------+
```

上面的代码会编译失败，因为 `x` 的生命周期 `'b` 比 `r` 的生命周期 `'a` 短。

### 函数中的生命周期

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

### 生命周期注解语法

```rust
&i32        // 引用
&'a i32     // 带有显式生命周期的引用
&'a mut i32 // 带有显式生命周期的可变引用
```

### 结构体中的生命周期注解

```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().expect("Could not find a '.'");
    let i = ImportantExcerpt {
        part: first_sentence,
    };
}
```

### 生命周期省略规则

编译器使用三条规则来推断生命周期：

1. **第一条规则**：每一个引用的参数都有它自己的生命周期参数
2. **第二条规则**：如果只有一个输入生命周期参数，那么它被赋予所有输出生命周期参数
3. **第三条规则**：如果方法有多个输入生命周期参数并且其中一个参数是 `&self` 或 `&mut self`，那么所有输出生命周期参数被赋予 `self` 的生命周期

### 方法中的生命周期注解

```rust
impl<'a> ImportantExcerpt<'a> {
    fn level(&self) -> i32 {
        3
    }
    
    fn announce_and_return_part(&self, announcement: &str) -> &str {
        println!("Attention please: {}", announcement);
        self.part
    }
}
```

### 静态生命周期

```rust
let s: &'static str = "I have a static lifetime.";
```

### 结合泛型类型参数、特征约束和生命周期

```rust
use std::fmt::Display;

fn longest_with_an_announcement<'a, T>(
    x: &'a str,
    y: &'a str,
    ann: T,
) -> &'a str
where
    T: Display,
{
    println!("Announcement! {}", ann);
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

## 高级特征

### 关联类型

```rust
pub trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;
}
```

### 默认泛型类型参数和运算符重载

```rust
use std::ops::Add;

#[derive(Debug, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

impl Add for Point {
    type Output = Point;

    fn add(self, other: Point) -> Point {
        Point {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

fn main() {
    assert_eq!(Point { x: 1, y: 0 } + Point { x: 2, y: 3 },
               Point { x: 3, y: 3 });
}
```

### 完全限定语法

```rust
trait Pilot {
    fn fly(&self);
}

trait Wizard {
    fn fly(&self);
}

struct Human;

impl Pilot for Human {
    fn fly(&self) {
        println!("This is your captain speaking.");
    }
}

impl Wizard for Human {
    fn fly(&self) {
        println!("Up!");
    }
}

impl Human {
    fn fly(&self) {
        println!("*waving arms furiously*");
    }
}

fn main() {
    let person = Human;
    Pilot::fly(&person);
    Wizard::fly(&person);
    person.fly();
}
```

### 父 trait

```rust
use std::fmt;

trait OutlinePrint: fmt::Display {
    fn outline_print(&self) {
        let output = self.to_string();
        let len = output.len();
        println!("{}", "*".repeat(len + 4));
        println!("*{}*", " ".repeat(len + 2));
        println!("* {} *", output);
        println!("*{}*", " ".repeat(len + 2));
        println!("{}", "*".repeat(len + 4));
    }
}
```

### newtype 模式

```rust
use std::fmt;

struct Wrapper(Vec<String>);

impl fmt::Display for Wrapper {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "[{}]", self.0.join(", "))
    }
}

fn main() {
    let w = Wrapper(vec![String::from("hello"), String::from("world")]);
    println!("w = {}", w);
}
```

## 💡 关键要点

1. **泛型提供代码复用**：一份代码适用于多种类型
2. **特征定义共享行为**：类似于接口但更强大
3. **生命周期确保内存安全**：防止悬垂引用
4. **编译时零成本抽象**：泛型和特征不会影响运行时性能
5. **特征约束增加灵活性**：限制泛型类型必须实现特定行为

## 🎯 实践建议

1. **合理使用泛型**：避免过度泛化，保持代码可读性
2. **设计好的特征**：特征应该具有清晰的语义
3. **理解生命周期**：不要过度使用显式生命周期注解
4. **利用特征约束**：确保泛型类型具有所需的行为
5. **学习标准库特征**：如 `Clone`、`Debug`、`Display` 等

## 🔗 相关链接

- **上一章**: [错误处理](./error-handling.md)
- **下一章**: [函数式编程](./functional-programming.md)
- **相关概念**: [数据结构](./data-structures.md)

---

[返回索引](./index.md) 