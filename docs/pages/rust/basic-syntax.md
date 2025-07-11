# Rust 基础语法

Rust 的基础语法包括数据类型、函数定义、控制流等核心概念。

## 📋 本章内容

- [数据类型](#数据类型)
- [函数](#函数)
- [控制流](#控制流)
- [变量与可变性](#变量与可变性)

## 数据类型

### 整数类型

![整数类型表](https://raw.githubusercontent.com/matf5/fileCache/master/20240425160121.png)

**默认类型**: Rust 默认使用 `i32` 类型

```rust
// 不同的整数类型
let x = 42;           // i32 (默认)
let y: i64 = 42;      // 显式指定类型
let z = 42u8;         // 使用后缀指定类型
```

### 浮点类型

- **单精度**: `f32`
- **双精度**: `f64` (默认)

```rust
let x = 2.0;      // f64 (默认)
let y: f32 = 3.0; // f32
```

### 布尔类型

```rust
let t = true;
let f: bool = false;
```

### 字符类型

```rust
let c = 'z';
let z: char = 'ℤ';
let heart_eyed_cat = '😻';
```

### 复合类型

#### 元组 (Tuple)
- 长度固定
- 支持解构
- 可以包含不同类型

```rust
fn main() {
    let tup = (500, 6.4, 1);

    // 解构赋值
    let (x, y, z) = tup;
    println!("The value of y is: {}", y);
    
    // 索引访问
    let x: (i32, f64, u8) = (500, 6.4, 1);
    let five_hundred = x.0;
    let six_point_four = x.1;
    let one = x.2;
}
```

**单元类型**: `()` 是一种特殊的类型，表示没有任何值。如果表达式不返回任何其他值，就隐式地返回单元值（类似 JavaScript 中的 `undefined`）。

#### 数组 (Array)
- 长度固定
- 每个元素必须是相同类型
- 如果需要可变长度，使用 `Vec<T>`

```rust
let a = [1, 2, 3, 4, 5];
let a: [i32; 5] = [1, 2, 3, 4, 5];

// 初始化相同值的数组
let a = [3; 5]; // 等价于 let a = [3, 3, 3, 3, 3];

// 访问数组元素
let first = a[0];
let second = a[1];
```

## 函数

### 函数定义

```rust
fn main() {
    println!("Hello, world!");
    
    another_function();
    function_with_parameters(5);
    let result = function_with_return_value();
}

fn another_function() {
    println!("Another function.");
}

fn function_with_parameters(x: i32) {
    println!("The value of x is: {}", x);
}

fn function_with_return_value() -> i32 {
    5 // 注意：没有分号，这是一个表达式
}
```

### 语句 vs 表达式

**语句**: 执行操作但不返回值
```rust
let y = 6; // 这是一个语句
```

**表达式**: 计算并产生一个值，表达式的结尾没有分号
```rust
fn main() {
    let y = {
        let x = 3;
        x + 1 // 这是一个表达式，没有分号
    };

    println!("The value of y is: {}", y); // 输出: 4
}
```

### 函数返回值

```rust
fn five() -> i32 {
    5 // 返回 5，这是一个表达式
}

fn plus_one(x: i32) -> i32 {
    x + 1 // 返回 x + 1，注意没有分号
}
```

## 控制流

### if 表达式

```rust
fn main() {
    let number = 6;

    if number % 4 == 0 {
        println!("number is divisible by 4");
    } else if number % 3 == 0 {
        println!("number is divisible by 3");
    } else if number % 2 == 0 {
        println!("number is divisible by 2");
    } else {
        println!("number is not divisible by 4, 3, or 2");
    }
}
```

#### 在 let 语句中使用 if

```rust
fn main() {
    let condition = true;
    let number = if condition { 5 } else { 6 };

    println!("The value of number is: {}", number);
}
```

### 循环

#### loop 循环

```rust
fn main() {
    let mut count = 0;
    'counting_up: loop {
        println!("count = {}", count);
        let mut remaining = 10;

        loop {
            println!("remaining = {}", remaining);
            if remaining == 9 {
                break;
            }
            if count == 2 {
                break 'counting_up; // 跳出外层循环
            }
            remaining -= 1;
        }

        count += 1;
    }
    println!("End count = {}", count);
}
```

#### 从循环返回值

```rust
fn main() {
    let mut counter = 0;

    let result = loop {
        counter += 1;

        if counter == 10 {
            break counter * 2; // 返回值
        }
    };

    println!("The result is {}", result);
}
```

#### while 循环

```rust
fn main() {
    let mut number = 3;

    while number != 0 {
        println!("{}!", number);
        number -= 1;
    }

    println!("LIFTOFF!!!");
}
```

#### for 循环

```rust
fn main() {
    let a = [10, 20, 30, 40, 50];

    for element in a {
        println!("the value is: {}", element);
    }
    
    // 使用范围
    for number in 1..4 {
        println!("{}!", number);
    }
    
    // 反向范围
    for number in (1..4).rev() {
        println!("{}!", number);
    }
}
```

## 变量与可变性

### 变量声明

```rust
fn main() {
    let x = 5;
    println!("The value of x is: {}", x);
    
    // x = 6; // 这会报错，因为 x 是不可变的
}
```

### 可变变量

```rust
fn main() {
    let mut x = 5;
    println!("The value of x is: {}", x);
    
    x = 6; // 这是可以的
    println!("The value of x is: {}", x);
}
```

### 变量遮蔽 (Shadowing)

```rust
fn main() {
    let x = 5;
    
    let x = x + 1; // 遮蔽前一个 x
    
    {
        let x = x * 2; // 在新的作用域中遮蔽
        println!("The value of x in the inner scope is: {}", x);
    }
    
    println!("The value of x is: {}", x);
}
```

### 常量

```rust
const THREE_HOURS_IN_SECONDS: u32 = 60 * 60 * 3;
```

## 💡 关键要点

1. **类型安全**: Rust 有静态强类型系统，可以进行类型推断
2. **默认不可变**: 变量默认不可变，需要 `mut` 关键字使其可变
3. **表达式导向**: 很多控制结构都是表达式，可以返回值
4. **遮蔽机制**: 允许重新声明同名变量，可以改变类型

## 🔗 相关链接

- **下一章**: [工具与项目管理](./tools-and-project.md)
- **相关概念**: [所有权系统](./ownership.md)

---

[返回索引](./index.md) 