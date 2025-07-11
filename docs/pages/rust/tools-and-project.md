# Rust 工具与项目管理

Rust 提供了强大的工具链来管理项目、依赖和构建过程。

## 📋 本章内容

- [Cargo 包管理器](#cargo-包管理器)
- [项目结构](#项目结构)
- [模块系统](#模块系统)
- [文档生成](#文档生成)

## Cargo 包管理器

Cargo 是 Rust 的构建工具和包管理器，负责构建、测试、管理依赖等任务。

### 基本命令

```bash
# 创建新项目
cargo new my_project
cargo new my_project --lib  # 创建库项目

# 构建项目
cargo build           # 调试构建
cargo build --release # 发布构建

# 运行项目
cargo run

# 检查代码
cargo check

# 运行测试
cargo test

# 更新依赖
cargo update

# 清理构建产物
cargo clean
```

### Cargo.toml 配置

```toml
[package]
name = "my_project"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = "1.0"
tokio = { version = "1.0", features = ["full"] }

[dev-dependencies]
proptest = "1.0"

[build-dependencies]
cc = "1.0"
```

### Cargo.lock 文件

Cargo.lock 文件用于锁定依赖版本：

1. **首次安装时**: 自动使用当前大版本的最新版本
2. **一旦 lock 存在**: 后续每次都使用 lock 中的版本
3. **需要更新**: 可以用 `cargo update` 命令

```bash
# 更新所有依赖到最新版本
cargo update

# 更新特定依赖
cargo update -p serde
```

## 项目结构

### 基本概念

- **包（Packages）**: Cargo 的一个功能，它允许你构建、测试和分享 crate
- **Crates**: 一个模块的树形结构，它形成了库或二进制项目
- **模块（Modules）**: 允许你控制作用域和路径的私有性
- **路径（Path）**: 一个命名例如结构体、函数或模块等项的方式

### 包的组织规则

- 一个包中**至多只能**包含一个库 crate
- 包中可以包含**任意多个**二进制 crate
- 包中**至少包含一个** crate，无论是库的还是二进制的

### 标准项目结构

```
my_project/
├── Cargo.toml
├── Cargo.lock
├── src/
│   ├── main.rs          # 默认二进制 crate 根
│   ├── lib.rs           # 库 crate 根
│   └── bin/
│       ├── named-executable.rs
│       └── another-executable.rs
├── tests/
│   └── integration_test.rs
├── examples/
│   └── example.rs
└── benches/
    └── benchmark.rs
```

#### 二进制项目

```rust
// src/main.rs - 单个二进制文件
fn main() {
    println!("Hello, world!");
}
```

```rust
// src/bin/my_tool.rs - 多个二进制文件
fn main() {
    println!("This is my tool!");
}
```

#### 库项目

```rust
// src/lib.rs - 库的根模块
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(add(2, 3), 5);
    }
}
```

## 模块系统

### 模块定义

```rust
// 内联模块
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
        pub fn seat_at_table() {}
    }

    mod serving {
        fn take_order() {}
        fn serve_order() {}
        fn take_payment() {}
    }
}
```

### 文件模块

```rust
// src/lib.rs
mod front_of_house;  // 引用 src/front_of_house.rs 或 src/front_of_house/mod.rs

pub use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

```rust
// src/front_of_house.rs
pub mod hosting {
    pub fn add_to_waitlist() {}
}
```

### 路径系统

#### 绝对路径

从 crate 根部开始，以 crate 名或者字面量 `crate` 开头：

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

pub fn eat_at_restaurant() {
    // 绝对路径
    crate::front_of_house::hosting::add_to_waitlist();
}
```

#### 相对路径

从当前模块开始，以 `self`、`super` 或当前模块的标识符开头：

```rust
fn serve_order() {}

mod back_of_house {
    fn fix_incorrect_order() {
        cook_order();
        super::serve_order();  // 使用 super 访问父模块
    }

    fn cook_order() {}
}
```

### use 关键字

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

#### 嵌套路径

```rust
// 原始写法
use std::cmp::Ordering;
use std::io;

// 简化写法
use std::{cmp::Ordering, io};

// 引入父模块和子模块
use std::io::{self, Write};
```

#### 重导出

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

pub use crate::front_of_house::hosting;  // 重导出

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

### 可见性规则

- 模块内的所有项默认是私有的
- 使用 `pub` 关键字使项公开
- 父模块不能访问子模块中的私有项
- 子模块可以访问祖先模块中的私有项

```rust
mod outer_mod {
    pub mod inner_mod {
        pub fn inner_function() {}
        
        fn private_function() {}
    }
    
    pub fn outer_function() {
        inner_mod::inner_function();    // ✓ 可以访问
        // inner_mod::private_function(); // ✗ 不能访问私有函数
    }
}
```

## 文档生成

### 查看文档

```bash
# 生成并打开文档
cargo doc --open

# 生成文档但不打开
cargo doc

# 包含私有项的文档
cargo doc --document-private-items
```

### 编写文档

```rust
/// 计算两个数的和
/// 
/// # Examples
/// 
/// ```
/// let result = my_crate::add(2, 3);
/// assert_eq!(result, 5);
/// ```
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

/// 这个结构体表示一个用户
/// 
/// # Fields
/// 
/// * `name` - 用户的名称
/// * `age` - 用户的年龄
pub struct User {
    /// 用户名
    pub name: String,
    /// 用户年龄
    pub age: u8,
}

impl User {
    /// 创建一个新的用户
    /// 
    /// # Arguments
    /// 
    /// * `name` - 用户名
    /// * `age` - 用户年龄
    /// 
    /// # Returns
    /// 
    /// 返回一个新的 User 实例
    pub fn new(name: String, age: u8) -> Self {
        User { name, age }
    }
}
```

### 文档测试

文档中的代码示例会被自动测试：

```rust
/// 这个函数会被文档测试验证
/// 
/// ```
/// use my_crate::multiply;
/// 
/// assert_eq!(multiply(2, 3), 6);
/// ```
pub fn multiply(a: i32, b: i32) -> i32 {
    a * b
}
```

## 工作空间

当项目变大时，可以使用工作空间来管理多个相关的包：

```toml
# Cargo.toml (工作空间根目录)
[workspace]
members = [
    "adder",
    "add-one",
]
```

```toml
# adder/Cargo.toml
[package]
name = "adder"
version = "0.1.0"
edition = "2021"

[dependencies]
add-one = { path = "../add-one" }
```

## 💡 最佳实践

1. **模块组织**: 按功能而非类型组织模块
2. **命名约定**: 使用 snake_case 命名函数和变量
3. **文档编写**: 为公共 API 编写详细文档
4. **测试**: 保持单元测试和集成测试的完整性
5. **依赖管理**: 定期更新依赖并检查安全漏洞

## 🔗 相关链接

- **上一章**: [Rust 基础语法](./basic-syntax.md)
- **下一章**: [所有权系统](./ownership.md)
- **相关概念**: [集合类型](./collections.md)

---

[返回索引](./index.md) 