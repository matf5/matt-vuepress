# Rust 学习之路

> 系统化学习 Rust 编程语言

## 📚 学习路径

### 🚀 入门基础

1. [**Rust 基础语法**](./basic-syntax.md) - 数据类型、函数、控制流
2. [**工具与项目管理**](./tools-and-project.md) - Cargo、项目结构、文档

### 🔑 核心概念

3. [**所有权系统**](./ownership.md) - 所有权、引用、切片
4. [**数据结构**](./data-structures.md) - Struct、Enum、模式匹配

### 📦 集合与数据处理

5. [**集合类型**](./collections.md) - Vector、字符串、HashMap
6. [**错误处理**](./error-handling.md) - Result、Option、panic!

### 🎯 高级特性

7. [**泛型与特征**](./generics-and-traits.md) - 泛型、trait、生命周期
8. [**函数式编程**](./functional-programming.md) - 闭包、迭代器、高阶函数
9. [**智能指针**](./smart-pointers.md) - Box、Rc、RefCell、循环引用

## 🎯 学习目标

- 🔍 **理解核心概念**: 掌握所有权、借用、生命周期
- 🛠️ **实践编程**: 通过项目加深理解
- 🚀 **系统编程**: 掌握底层系统开发能力
- 🌐 **实际应用**: Web开发、CLI工具、系统工具

## 📖 学习资源

### 官方资源
- [Rust 官方文档](https://doc.rust-lang.org/)
- [Rust 程序设计语言](https://kaisery.github.io/trpl-zh-cn/)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/)

### 实践项目
- [Rustlings](https://github.com/rust-lang/rustlings) - 交互式练习
- [Advent of Code](https://adventofcode.com/) - 编程挑战
- [Project Euler](https://projecteuler.net/) - 数学编程题

### 社区资源
- [Rust 中文社区](https://rust-lang-cn.org/)
- [Rust 程序员](https://rustcc.cn/)
- [Awesome Rust](https://github.com/rust-unofficial/awesome-rust)

## 🏃‍♂️ 快速开始

### 安装 Rust

```bash
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 验证安装
rustc --version
cargo --version
```

### 创建第一个项目

```bash
# 创建新项目
cargo new hello_rust
cd hello_rust

# 运行项目
cargo run
```

### Hello World

```rust
fn main() {
    println!("Hello, world!");
}
```

## 📈 学习进度

- [ ] 基础语法掌握
- [ ] 所有权系统理解
- [ ] 数据结构应用
- [ ] 集合类型使用
- [ ] 错误处理机制
- [ ] 泛型与特征
- [ ] 函数式编程
- [ ] 智能指针使用
- [ ] 工具与项目管理
- [ ] 实际项目实践

## 🎓 学习建议

1. **循序渐进**: 按照学习路径依次学习，确保基础扎实
2. **动手实践**: 每个概念都要亲自编写代码验证
3. **阅读源码**: 学习优秀开源项目的代码风格
4. **参与社区**: 积极参与 Rust 社区讨论和贡献

---

**开始学习**: [Rust 基础语法](./basic-syntax.md)

*让我们一起踏上 Rust 的学习之旅！* 