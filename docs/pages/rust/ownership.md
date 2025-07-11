# Rust 所有权系统

所有权（Ownership）是 Rust 最独特和核心的特性，让 Rust 无需垃圾回收即可保证内存安全。

## 📋 本章内容

- [所有权规则](#所有权规则)
- [变量作用域](#变量作用域)
- [数据交互方式](#数据交互方式)
- [所有权与函数](#所有权与函数)
- [引用与借用](#引用与借用)
- [切片类型](#切片类型)

## 所有权规则

Rust 中的每一个值都有一个被称为其**所有者（owner）**的变量。

### 三条基本规则

1. **Rust 中的每一个值都有一个被称为其所有者的变量**
2. **值在任一时刻有且只有一个所有者**
3. **当所有者（变量）离开作用域，这个值将被丢弃**

## 变量作用域

```rust
{                      // s 在这里无效, 它尚未声明
    let s = "hello";   // 从此处起，s 开始有效

    // 使用 s
}                      // 此作用域已结束，s 不再有效
```

### String 类型

`String` 类型管理被分配到堆上的数据，因此能够存储在编译时未知大小的文本：

```rust
let mut s = String::from("hello");

s.push_str(", world!"); // push_str() 在字符串后追加字面值

println!("{}", s); // 将打印 `hello, world!`
```

## 数据交互方式

### 方式一：移动（Move）

对于 `String` 类型，为了支持一个可变、可增长的文本片段，需要在堆上分配一块在编译时未知大小的内存来存放内容。

```rust
let s1 = String::from("hello");
let s2 = s1;

// println!("{}", s1); // 错误！s1 已被移动
```

**内存布局图示**：

![栈和堆的内存布局](https://raw.githubusercontent.com/matf5/fileCache/master/20240425163816.png)

左侧为栈，右侧为堆

![移动后的内存状态](https://raw.githubusercontent.com/matf5/fileCache/master/20240425164109.png)

移动之后只有 `s2` 有效，`s1` 会被释放

**重要概念**：
- **长度（Length）**：`String` 的内容当前使用了多少字节的内存
- **容量（Capacity）**：`String` 从分配器总共获取了多少字节的内存

### 方式二：克隆（Clone）

如果我们**确实**需要深度复制 `String` 中堆上的数据，可以使用 `clone` 方法：

```rust
let s1 = String::from("hello");
let s2 = s1.clone();

println!("s1 = {}, s2 = {}", s1, s2); // 这样就可以正常工作了
```

### 方式三：拷贝（Copy）

栈上的数据可以快速复制，因此赋值后原变量仍然可用：

```rust
let x = 5;
let y = x;

println!("x = {}, y = {}", x, y); // 都有效
```

#### Copy trait

如果一个类型实现了 `Copy` trait，那么一个旧的变量在将其赋值给其他变量后仍然可用。

**实现了 `Copy` trait 的类型**：
- 所有整数类型，比如 `u32`
- 布尔类型，`bool`
- 所有浮点数类型，比如 `f64`
- 字符类型，`char`
- 元组，当且仅当其包含的类型也都实现 `Copy` 的时候。比如，`(i32, i32)` 实现了 `Copy`，但 `(i32, String)` 就没有

## 所有权与函数

将值传递给函数在语义上与给变量赋值相似。向函数传递值可能会移动或者复制，就像赋值语句一样。

```rust
fn main() {
    let s = String::from("hello");  // s 进入作用域

    takes_ownership(s);             // s 的值移动到函数里 ...
                                    // ... 所以到这里不再有效

    let x = 5;                      // x 进入作用域

    makes_copy(x);                  // x 应该移动函数里，
                                    // 但 i32 是 Copy 的，所以在后面可继续使用 x

} // 这里, x 先移出了作用域，然后是 s。但因为 s 的值已被移走，
  // 所以不会有特殊操作

fn takes_ownership(some_string: String) { // some_string 进入作用域
    println!("{}", some_string);
} // 这里，some_string 移出作用域并调用 `drop` 方法。占用的内存被释放

fn makes_copy(some_integer: i32) { // some_integer 进入作用域
    println!("{}", some_integer);
} // 这里，some_integer 移出作用域。不会有特殊操作
```

### 返回值与作用域

返回值也可以转移所有权：

```rust
fn main() {
    let s1 = gives_ownership();         // gives_ownership 将返回值
                                        // 移给 s1

    let s2 = String::from("hello");     // s2 进入作用域

    let s3 = takes_and_gives_back(s2);  // s2 被移动到
                                        // takes_and_gives_back 中,
                                        // 它也将返回值移给 s3
} // 这里, s3 移出作用域并被丢弃。s2 也移出作用域，但已被移走，
  // 所以什么也不会发生。s1 移出作用域并被丢弃

fn gives_ownership() -> String {           // gives_ownership 将返回值移动给
                                           // 调用它的函数

    let some_string = String::from("yours"); // some_string 进入作用域

    some_string                              // 返回 some_string 并移出给调用的函数
}

// takes_and_gives_back 将传入字符串并返回该值
fn takes_and_gives_back(a_string: String) -> String { // a_string 进入作用域

    a_string  // 返回 a_string 并移出给调用的函数
}
```

## 引用与借用

引用（reference）像一个指针，因为它是一个地址，我们可以由此访问储存于该地址的属于其他变量的数据。

```rust
fn main() {
    let s1 = String::from("hello");

    let len = calculate_length(&s1);

    println!("The length of '{}' is {}.", s1, len);
}

fn calculate_length(s: &String) -> usize {
    s.len()
}
```

![引用示意图](https://raw.githubusercontent.com/matf5/fileCache/master/20240425165744.png)

### 可变引用

正常引用是不可变的，无法通过引用修改内容。如果要可变，可以修改为 `&mut`：

```rust
fn main() {
    let mut s = String::from("hello");

    change(&mut s);
}

fn change(some_string: &mut String) {
    some_string.push_str(", world");
}
```

### 可变引用的限制

在同一时间，只能有一个对某一特定数据的可变引用。尝试创建两个可变引用的代码将会失败：

```rust
let mut s = String::from("hello");

let r1 = &mut s;
let r2 = &mut s; // 错误！

println!("{}, {}", r1, r2);
```

但以下代码没问题：

```rust
let mut s = String::from("hello");

let r1 = &s; // 没问题
let r2 = &s; // 没问题
println!("{} and {}", r1, r2);
// 此位置之后 r1 和 r2 不再使用

let r3 = &mut s; // 没问题
println!("{}", r3);
```

### 悬垂引用（Dangling References）

悬垂引用是指引用了一个已经被释放的内存地址：

```rust
fn main() {
    let reference_to_nothing = dangle();
}

fn dangle() -> &String { // 错误！
    let s = String::from("hello");

    &s // 这里s离开作用域已经被释放掉了
}
```

正确的做法是直接返回 `String`：

```rust
fn no_dangle() -> String {
    let s = String::from("hello");

    s // 所有权被移动出去，所以没有值被释放
}
```

### 引用的规则

1. **在任意给定时间，要么只能有一个可变引用，要么只能有多个不可变引用**
2. **引用必须总是有效的**

### 解引用操作符 (*)

```rust
fn main() {
    let x = 5;
    let y = &x;

    assert_eq!(5, x);
    assert_eq!(5, *y); // 解引用
}
```

## 切片类型

切片（slice）让你引用集合中一段连续的元素序列，而不用引用整个集合。

### 字符串切片

```rust
let s = String::from("hello world");

let hello = &s[0..5];
let world = &s[6..11];

// 语法糖
let hello = &s[..5];   // 从开始到索引5
let world = &s[6..];   // 从索引6到结束
let entire = &s[..];   // 整个字符串
```

### 字符串切片的实际应用

```rust
fn first_word(s: &String) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}

fn main() {
    let my_string = String::from("hello world");

    // `first_word` 接受 `String` 的切片，无论是部分还是全部
    let word = first_word(&my_string[0..6]);
    let word = first_word(&my_string[..]);
    // `first_word` 也接受 `String` 的引用，
    // 这等同于 `String` 的全部切片
    let word = first_word(&my_string);

    let my_string_literal = "hello world";

    // `first_word` 接受字符串字面量的切片，无论是部分还是全部
    let word = first_word(&my_string_literal[0..6]);
    let word = first_word(&my_string_literal[..]);
    // 字符串字面量就是切片
    let word = first_word(my_string_literal);
}
```

### 更好的 `first_word` 实现

```rust
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}
```

### 其他切片

```rust
let a = [1, 2, 3, 4, 5];

let slice = &a[1..3];

assert_eq!(slice, &[2, 3]);
```

## 💡 关键要点

1. **所有权系统确保内存安全**：在编译时防止数据竞争和内存泄漏
2. **移动语义是默认行为**：避免意外的深拷贝
3. **借用检查器**：确保引用的有效性
4. **生命周期**：确保引用不会超过其指向的值
5. **切片提供安全的局部访问**：无需拥有整个集合的所有权

## 🎯 实践建议

1. **优先使用借用而非获取所有权**
2. **明确区分可变和不可变引用**
3. **利用切片进行安全的序列操作**
4. **理解移动语义，避免在移动后使用变量**
5. **善用 `clone()` 进行必要的深拷贝**

## 🔗 相关链接

- **上一章**: [工具与项目管理](./tools-and-project.md)
- **下一章**: [数据结构](./data-structures.md)
- **相关概念**: [泛型与特征](./generics-and-traits.md)

---

[返回索引](./index.md) 