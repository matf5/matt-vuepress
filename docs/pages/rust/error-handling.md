# Rust 错误处理

Rust 将错误组合成两个主要类别：**可恢复的**（recoverable）和**不可恢复的**（unrecoverable）错误。

## 📋 本章内容

- [不可恢复的错误与 panic!](#不可恢复的错误与-panic)
- [可恢复的错误与 Result](#可恢复的错误与-result)
- [传播错误](#传播错误)
- [何时使用 panic!](#何时使用-panic)

## 不可恢复的错误与 panic!

有些时候代码出问题了，而你对此束手无策。对于这种情况，Rust 有 `panic!` 宏。当执行这个宏时，程序会打印出一个错误信息，展开并清理栈数据，然后接着退出。

### 使用 panic!

```rust
fn main() {
    panic!("crash and burn");
}
```

### 数组越界引起的 panic!

```rust
fn main() {
    let v = vec![1, 2, 3];

    v[99]; // 这会导致 panic!
}
```

### 设置 panic! 的行为

在 `Cargo.toml` 中设置：

```toml
[profile.release]
panic = 'abort'
```

## 可恢复的错误与 Result

大部分错误并没有严重到需要程序完全停止执行。有些时候，一个函数失败时，我们可以很容易地解释和响应这个错误。

### Result 枚举

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

### 处理 Result

```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt");

    let f = match f {
        Ok(file) => file,
        Err(error) => {
            panic!("Problem opening the file: {:?}", error)
        },
    };
}
```

### 匹配不同的错误

```rust
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let f = File::open("hello.txt");

    let f = match f {
        Ok(file) => file,
        Err(error) => match error.kind() {
            ErrorKind::NotFound => match File::create("hello.txt") {
                Ok(fc) => fc,
                Err(e) => panic!("Problem creating the file: {:?}", e),
            },
            other_error => panic!("Problem opening the file: {:?}", other_error),
        },
    };
}
```

### 使用闭包简化错误处理

```rust
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let f = File::open("hello.txt").unwrap_or_else(|error| {
        if error.kind() == ErrorKind::NotFound {
            File::create("hello.txt").unwrap_or_else(|error| {
                panic!("Problem creating the file: {:?}", error);
            })
        } else {
            panic!("Problem opening the file: {:?}", error);
        }
    });
}
```

## 失败时 panic 的简写：unwrap 和 expect

### unwrap

`unwrap` 是 `match` 语句的一个快捷方法：

```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt").unwrap();
}
```

### expect

`expect` 与 `unwrap` 类似，但允许我们选择 `panic!` 的错误信息：

```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt").expect("Failed to open hello.txt");
}
```

## 传播错误

当编写一个其实现会调用一些可能会失败的操作的函数时，除了在这个函数中处理错误外，还可以选择让调用者知道这个错误并决定如何处理。

### 传播错误的完整写法

```rust
use std::io;
use std::io::Read;
use std::fs::File;

fn read_username_from_file() -> Result<String, io::Error> {
    let f = File::open("hello.txt");

    let mut f = match f {
        Ok(file) => file,
        Err(e) => return Err(e),
    };

    let mut s = String::new();

    match f.read_to_string(&mut s) {
        Ok(_) => Ok(s),
        Err(e) => Err(e),
    }
}
```

### 传播错误的简写：? 运算符

```rust
use std::io;
use std::io::Read;
use std::fs::File;

fn read_username_from_file() -> Result<String, io::Error> {
    let mut f = File::open("hello.txt")?;
    let mut s = String::new();
    f.read_to_string(&mut s)?;
    Ok(s)
}
```

### 链式调用

```rust
use std::io;
use std::io::Read;
use std::fs::File;

fn read_username_from_file() -> Result<String, io::Error> {
    let mut s = String::new();
    
    File::open("hello.txt")?.read_to_string(&mut s)?;
    
    Ok(s)
}
```

### 更简洁的写法

```rust
use std::io;
use std::fs;

fn read_username_from_file() -> Result<String, io::Error> {
    fs::read_to_string("hello.txt")
}
```

### ? 运算符的工作原理

`?` 运算符进行了与 `match` 表达式相同的工作：
- 如果 `Result` 的值是 `Ok`，这个表达式将会返回 `Ok` 中的值
- 如果值是 `Err`，`Err` 将作为整个函数的返回值

### ? 运算符与 from 函数

`?` 运算符会自动调用 `from` 函数来转换错误类型：

```rust
use std::io;
use std::num::ParseIntError;

fn read_and_parse() -> Result<i32, ParseIntError> {
    let s = std::fs::read_to_string("number.txt")?; // io::Error 转换为 ParseIntError
    let n: i32 = s.trim().parse()?;
    Ok(n)
}
```

### ? 运算符与 Option

`?` 运算符也可以用于 `Option` 类型：

```rust
fn last_char_of_first_line(text: &str) -> Option<char> {
    text.lines().next()?.chars().last()
}
```

## 何时使用 panic!

### 示例、代码原型和测试

在示例中，`unwrap` 和 `expect` 方法非常有用，它们在原型设计时非常明确：

```rust
use std::net::IpAddr;

let home: IpAddr = "127.0.0.1".parse().unwrap();
```

### 当你比编译器知道更多的情况

```rust
use std::net::IpAddr;

let home: IpAddr = "127.0.0.1"
    .parse()
    .expect("Hardcoded IP address should be valid");
```

### 指导性错误处理

```rust
pub struct Guess {
    value: i32,
}

impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 || value > 100 {
            panic!("Guess value must be between 1 and 100, got {}.", value);
        }

        Guess {
            value
        }
    }

    pub fn value(&self) -> i32 {
        self.value
    }
}
```

## 创建自定义错误类型

```rust
#[derive(Debug)]
pub struct MyError {
    pub message: String,
}

impl std::fmt::Display for MyError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "MyError: {}", self.message)
    }
}

impl std::error::Error for MyError {}

fn might_fail() -> Result<String, MyError> {
    Err(MyError {
        message: "Something went wrong".to_string(),
    })
}
```

## 使用 anyhow 和 thiserror

### anyhow 用于应用程序

```rust
use anyhow::Result;

fn read_and_parse() -> Result<i32> {
    let s = std::fs::read_to_string("number.txt")?;
    let n: i32 = s.trim().parse()?;
    Ok(n)
}
```

### thiserror 用于库

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum MyError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("Parse error: {0}")]
    Parse(#[from] std::num::ParseIntError),
    
    #[error("Custom error: {message}")]
    Custom { message: String },
}
```

## 💡 关键要点

1. **两种错误类型**：可恢复的错误用 `Result`，不可恢复的错误用 `panic!`
2. **? 运算符很强大**：简化错误传播，自动进行类型转换
3. **选择合适的错误处理方式**：根据情况选择 `unwrap`、`expect` 或完整的错误处理
4. **自定义错误类型**：为库代码创建有意义的错误类型
5. **错误传播是常见模式**：让调用者决定如何处理错误

## 🎯 实践建议

1. **库代码返回 Result**：让调用者决定如何处理错误
2. **应用程序代码可以 panic**：在确定的错误情况下使用 `panic!`
3. **使用 expect 而不是 unwrap**：提供有意义的错误信息
4. **考虑使用 anyhow 或 thiserror**：简化错误处理代码
5. **创建有意义的错误类型**：帮助调用者理解和处理错误

## 🔗 相关链接

- **上一章**: [集合类型](./collections.md)
- **下一章**: [泛型与特征](./generics-and-traits.md)
- **相关概念**: [数据结构](./data-structures.md)

---

[返回索引](./index.md) 