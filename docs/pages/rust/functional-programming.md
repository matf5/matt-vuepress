# Rust 函数式编程

Rust 的设计受到了许多现有语言和技术的启发，其中一个显著的影响就是函数式编程。

## 📋 本章内容

- [闭包](#闭包)
- [迭代器](#迭代器)
- [函数式编程模式](#函数式编程模式)
- [性能比较](#性能比较)

## 闭包

闭包（closures）是可以保存进变量或作为参数传递给其他函数的匿名函数。可以在一个地方创建闭包，然后在不同的上下文中执行闭包运算。

### 创建闭包

```rust
use std::thread;
use std::time::Duration;

fn generate_workout(intensity: u32, random_number: u32) {
    let expensive_closure = |num| {
        println!("calculating slowly...");
        thread::sleep(Duration::from_secs(2));
        num
    };

    if intensity < 25 {
        println!(
            "Today, do {} pushups!",
            expensive_closure(intensity)
        );
        println!(
            "Next, do {} situps!",
            expensive_closure(intensity)
        );
    } else {
        if random_number == 3 {
            println!("Take a break today! Remember to stay hydrated!");
        } else {
            println!(
                "Today, run for {} minutes!",
                expensive_closure(intensity)
            );
        }
    }
}
```

### 闭包语法

```rust
fn  add_one_v1   (x: u32) -> u32 { x + 1 }
let add_one_v2 = |x: u32| -> u32 { x + 1 };
let add_one_v3 = |x|             { x + 1 };
let add_one_v4 = |x|               x + 1  ;
```

### 闭包的类型推断

```rust
let example_closure = |x| x;

let s = example_closure(String::from("hello"));
// let n = example_closure(5); // 错误！类型已经推断为 String
```

### 使用泛型参数和 Fn trait 存储闭包

```rust
struct Cacher<T>
where
    T: Fn(u32) -> u32,
{
    calculation: T,
    value: Option<u32>,
}

impl<T> Cacher<T>
where
    T: Fn(u32) -> u32,
{
    fn new(calculation: T) -> Cacher<T> {
        Cacher {
            calculation,
            value: None,
        }
    }

    fn value(&mut self, arg: u32) -> u32 {
        match self.value {
            Some(v) => v,
            None => {
                let v = (self.calculation)(arg);
                self.value = Some(v);
                v
            }
        }
    }
}
```

### 闭包捕获环境

```rust
fn main() {
    let x = 4;

    let equal_to_x = |z| z == x;

    let y = 4;

    assert!(equal_to_x(y));
}
```

### 闭包的三种 Fn trait

1. **FnOnce** - 消费从周围作用域捕获的变量
2. **FnMut** - 获取可变的借用值，可以改变其环境
3. **Fn** - 从其环境获取不可变的借用值

```rust
fn main() {
    let x = vec![1, 2, 3];

    let equal_to_x = move |z| z == x;

    // println!("can't use x here: {:?}", x); // 错误！x 已被移动

    let y = vec![1, 2, 3];

    assert!(equal_to_x(y));
}
```

### 使用 move 关键字

```rust
use std::thread;

fn main() {
    let v = vec![1, 2, 3];

    let handle = thread::spawn(move || {
        println!("Here's a vector: {:?}", v);
    });

    handle.join().unwrap();
}
```

## 迭代器

迭代器是一种函数式编程的概念，它允许你对一系列项进行处理。

### 创建迭代器

```rust
let v1 = vec![1, 2, 3];

let v1_iter = v1.iter();

for val in v1_iter {
    println!("Got: {}", val);
}
```

### Iterator trait 和 next 方法

```rust
pub trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;

    // 此处省略了方法的默认实现
}
```

### 使用 next 方法

```rust
#[test]
fn iterator_demonstration() {
    let v1 = vec![1, 2, 3];

    let mut v1_iter = v1.iter();

    assert_eq!(v1_iter.next(), Some(&1));
    assert_eq!(v1_iter.next(), Some(&2));
    assert_eq!(v1_iter.next(), Some(&3));
    assert_eq!(v1_iter.next(), None);
}
```

### 消费迭代器的方法

```rust
#[test]
fn iterator_sum() {
    let v1 = vec![1, 2, 3];

    let v1_iter = v1.iter();

    let total: i32 = v1_iter.sum();

    assert_eq!(total, 6);
}
```

### 产生其他迭代器的方法

```rust
let v1: Vec<i32> = vec![1, 2, 3];

let v2: Vec<_> = v1.iter().map(|x| x + 1).collect();

assert_eq!(v2, vec![2, 3, 4]);
```

### 使用闭包获取环境

```rust
#[derive(PartialEq, Debug)]
struct Shoe {
    size: u32,
    style: String,
}

fn shoes_in_my_size(shoes: Vec<Shoe>, shoe_size: u32) -> Vec<Shoe> {
    shoes.into_iter().filter(|s| s.size == shoe_size).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn filters_by_size() {
        let shoes = vec![
            Shoe {
                size: 10,
                style: String::from("sneaker"),
            },
            Shoe {
                size: 13,
                style: String::from("sandal"),
            },
            Shoe {
                size: 10,
                style: String::from("boot"),
            },
        ];

        let in_my_size = shoes_in_my_size(shoes, 10);

        assert_eq!(
            in_my_size,
            vec![
                Shoe {
                    size: 10,
                    style: String::from("sneaker")
                },
                Shoe {
                    size: 10,
                    style: String::from("boot")
                },
            ]
        );
    }
}
```

### 实现 Iterator trait

```rust
struct Counter {
    current: usize,
    max: usize,
}

impl Counter {
    fn new(max: usize) -> Counter {
        Counter { current: 0, max }
    }
}

impl Iterator for Counter {
    type Item = usize;

    fn next(&mut self) -> Option<Self::Item> {
        if self.current < self.max {
            let current = self.current;
            self.current += 1;
            Some(current)
        } else {
            None
        }
    }
}

#[test]
fn using_other_iterator_trait_methods() {
    let sum: usize = Counter::new(5)
        .zip(Counter::new(5).skip(1))
        .map(|(a, b)| a * b)
        .filter(|x| x % 3 == 0)
        .sum();
    
    assert_eq!(18, sum);
}
```

## 函数式编程模式

### 链式调用

```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5];
    
    let result: Vec<i32> = v
        .iter()
        .filter(|&&x| x > 2)
        .map(|&x| x * 2)
        .collect();
    
    println!("{:?}", result); // [6, 8, 10]
}
```

### 使用 fold 和 reduce

```rust
let v = vec![1, 2, 3, 4, 5];

// fold 提供初始值
let sum = v.iter().fold(0, |acc, &x| acc + x);
println!("Sum: {}", sum); // 15

// reduce 使用序列的第一个元素作为初始值
let sum = v.iter().reduce(|acc, &x| acc + x);
println!("Sum: {:?}", sum); // Some(15)
```

### 使用 for_each

```rust
let v = vec![1, 2, 3, 4, 5];

v.iter().for_each(|x| println!("{}", x));
```

### 使用 partition

```rust
let v = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

let (even, odd): (Vec<_>, Vec<_>) = v.into_iter().partition(|&x| x % 2 == 0);

println!("Even: {:?}", even); // [2, 4, 6, 8, 10]
println!("Odd: {:?}", odd);   // [1, 3, 5, 7, 9]
```

### 使用 find 和 position

```rust
let v = vec![1, 2, 3, 4, 5];

// find 返回第一个匹配的元素
let found = v.iter().find(|&&x| x > 3);
println!("{:?}", found); // Some(4)

// position 返回第一个匹配元素的索引
let pos = v.iter().position(|&x| x > 3);
println!("{:?}", pos); // Some(3)
```

### 使用 any 和 all

```rust
let v = vec![1, 2, 3, 4, 5];

// any 检查是否有任何元素满足条件
let has_even = v.iter().any(|&x| x % 2 == 0);
println!("Has even: {}", has_even); // true

// all 检查是否所有元素都满足条件
let all_positive = v.iter().all(|&x| x > 0);
println!("All positive: {}", all_positive); // true
```

### 使用 enumerate

```rust
let v = vec!["a", "b", "c"];

for (i, value) in v.iter().enumerate() {
    println!("{}: {}", i, value);
}
```

### 使用 zip

```rust
let names = vec!["Alice", "Bob", "Charlie"];
let ages = vec![30, 25, 35];

let people: Vec<_> = names.iter().zip(ages.iter()).collect();
println!("{:?}", people); // [("Alice", 30), ("Bob", 25), ("Charlie", 35)]
```

### 使用 take 和 skip

```rust
let v = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

let first_three: Vec<_> = v.iter().take(3).collect();
println!("{:?}", first_three); // [1, 2, 3]

let skip_first_three: Vec<_> = v.iter().skip(3).collect();
println!("{:?}", skip_first_three); // [4, 5, 6, 7, 8, 9, 10]
```

## 性能比较

### 迭代器 vs 循环

```rust
// 使用循环
fn search_loop(contents: &str, query: &str) -> Vec<&str> {
    let mut results = Vec::new();
    
    for line in contents.lines() {
        if line.contains(query) {
            results.push(line);
        }
    }
    
    results
}

// 使用迭代器
fn search_iterator(contents: &str, query: &str) -> Vec<&str> {
    contents
        .lines()
        .filter(|line| line.contains(query))
        .collect()
}
```

### 零成本抽象

Rust 的迭代器是零成本抽象的例子，编译器会优化迭代器代码，使其性能与手写循环相当。

## 函数式编程的最佳实践

### 1. 使用 Iterator 而不是索引

```rust
// 不推荐
let v = vec![1, 2, 3, 4, 5];
for i in 0..v.len() {
    println!("{}", v[i]);
}

// 推荐
let v = vec![1, 2, 3, 4, 5];
for item in &v {
    println!("{}", item);
}
```

### 2. 优先使用 filter 和 map

```rust
let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

let even_squares: Vec<_> = numbers
    .iter()
    .filter(|&&x| x % 2 == 0)
    .map(|&x| x * x)
    .collect();
```

### 3. 使用 Option 和 Result 的函数式方法

```rust
fn process_data(data: Vec<String>) -> Option<i32> {
    data.first()?
        .parse::<i32>()
        .ok()?
        .checked_mul(2)
}
```

## 💡 关键要点

1. **闭包是匿名函数**：可以捕获其环境中的变量
2. **迭代器是惰性的**：只有在调用消费方法时才会执行
3. **函数式编程提高可读性**：链式调用让代码更清晰
4. **零成本抽象**：编译器会优化迭代器代码
5. **组合胜过继承**：使用函数组合来构建复杂逻辑

## 🎯 实践建议

1. **优先使用迭代器**：而不是手写循环
2. **善用链式调用**：使代码更简洁和表达力强
3. **理解惰性求值**：知道何时会实际执行计算
4. **使用适当的闭包类型**：Fn, FnMut, FnOnce
5. **组合小函数**：构建复杂的数据处理管道

## 🔗 相关链接

- **上一章**: [泛型与特征](./generics-and-traits.md)
- **下一章**: [智能指针](./smart-pointers.md)
- **相关概念**: [集合类型](./collections.md)

---

[返回索引](./index.md) 