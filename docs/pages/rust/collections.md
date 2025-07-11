# Rust 集合类型

Rust 标准库中包含一系列非常有用的数据结构，称为集合（collections）。这些集合可以包含多个值，并且数据被储存在堆上。

## 📋 本章内容

- [Vector](#vector)
- [字符串](#字符串)
- [HashMap](#hashmap)
- [选择集合类型](#选择集合类型)

## Vector

Vector 允许你在一个单独的数据结构中储存多个值，它在内存中彼此相邻地排列所有的值。

### 创建 Vector

```rust
// 创建空的 Vector
let v: Vec<i32> = Vec::new();

// 使用 vec! 宏创建并初始化
let v2 = vec![1, 2, 3];
```

### 更新 Vector

```rust
let mut v = Vec::new();

v.push(5);
v.push(6);
v.push(7);
v.push(8);
```

### 读取 Vector 的元素

有两种方式引用 Vector 中储存的值：

#### 索引语法

```rust
let v = vec![1, 2, 3, 4, 5];

let third: &i32 = &v[2];
println!("The third element is {}", third);
```

#### get 方法

```rust
let v = vec![1, 2, 3, 4, 5];

match v.get(2) {
    Some(third) => println!("The third element is {}", third),
    None => println!("There is no third element."),
}
```

### 处理无效索引

```rust
let v = vec![1, 2, 3, 4, 5];

// 这会导致 panic!
// let does_not_exist = &v[100];

// 这会返回 None
let does_not_exist = v.get(100);
```

### 遍历 Vector

#### 不可变引用

```rust
let v = vec![100, 32, 57];
for i in &v {
    println!("{}", i);
}
```

#### 可变引用

```rust
let mut v = vec![100, 32, 57];
for i in &mut v {
    *i += 50;
}
```

### 使用枚举储存多种类型

```rust
enum SpreadsheetCell {
    Int(i32),
    Float(f64),
    Text(String),
}

let row = vec![
    SpreadsheetCell::Int(3),
    SpreadsheetCell::Text(String::from("blue")),
    SpreadsheetCell::Float(10.12),
];
```

### Vector 的其他方法

```rust
let mut v = vec![1, 2, 3];

// 添加元素
v.push(4);

// 移除最后一个元素
let last = v.pop(); // 返回 Some(4)

// 获取长度
let len = v.len();

// 检查是否为空
let is_empty = v.is_empty();

// 清空 Vector
v.clear();
```

## 字符串

Rust 中的字符串是 UTF-8 编码的。

### 创建字符串

```rust
// 创建空字符串
let mut s = String::new();

// 从字符串字面量创建
let data = "initial contents";
let s = data.to_string();

// 直接从字符串字面量创建
let s = "initial contents".to_string();

// 使用 String::from
let s = String::from("initial contents");
```

### 更新字符串

#### 使用 push_str 和 push

```rust
let mut s = String::from("foo");
s.push_str("bar");
s.push('l');
```

#### 使用 + 运算符

```rust
let s1 = String::from("Hello, ");
let s2 = String::from("world!");
let s3 = s1 + &s2; // 注意 s1 被移动了，不能继续使用
```

#### 使用 format! 宏

```rust
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");

let s = format!("{}-{}-{}", s1, s2, s3);
```

### 字符串的内部表现

`String` 是一个 `Vec<u8>` 的封装：

```rust
let hello = String::from("Hola");
// len() 返回 4，因为每个字符占 1 字节

let hello = String::from("Здравствуйте");
// len() 返回 24，因为每个字符占 2 字节
```

### 字符串切片

```rust
let hello = "Здравствуйте";
let s = &hello[0..4]; // 获取前 4 个字节

// 注意：必须在字符边界处切片，否则会 panic
```

### 遍历字符串

#### 遍历字符

```rust
for c in "नमस्ते".chars() {
    println!("{}", c);
}
```

#### 遍历字节

```rust
for b in "नमस्ते".bytes() {
    println!("{}", b);
}
```

### 字符串的其他方法

```rust
let s = String::from("hello world");

// 检查是否包含子字符串
let contains = s.contains("world");

// 替换字符串
let s2 = s.replace("world", "Rust");

// 分割字符串
let parts: Vec<&str> = s.split_whitespace().collect();

// 去除首尾空白
let s3 = "  hello  ".trim();
```

## HashMap

HashMap 储存了一个键类型 K 对应一个值类型 V 的映射。

### 创建 HashMap

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);
```

### 通过 collect 方法创建

```rust
use std::collections::HashMap;

let teams = vec![String::from("Blue"), String::from("Yellow")];
let initial_scores = vec![10, 50];

let scores: HashMap<_, _> = teams
    .iter()
    .zip(initial_scores.iter())
    .collect();
```

### HashMap 和所有权

```rust
use std::collections::HashMap;

let field_name = String::from("Favorite color");
let field_value = String::from("Blue");

let mut map = HashMap::new();
map.insert(field_name, field_value);
// 这里 field_name 和 field_value 不再有效，
// 尝试使用它们看看会出现什么编译错误！
```

### 访问 HashMap 中的值

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);

let team_name = String::from("Blue");
let score = scores.get(&team_name);

match score {
    Some(s) => println!("Blue team's score: {}", s),
    None => println!("Blue team not found"),
}
```

### 遍历 HashMap

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);

for (key, value) in &scores {
    println!("{}: {}", key, value);
}
```

### 更新 HashMap

#### 覆盖一个值

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Blue"), 25);

println!("{:?}", scores); // {"Blue": 25}
```

#### 只在键没有对应值时插入

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();
scores.insert(String::from("Blue"), 10);

scores.entry(String::from("Yellow")).or_insert(50);
scores.entry(String::from("Blue")).or_insert(50);

println!("{:?}", scores); // {"Blue": 10, "Yellow": 50}
```

#### 根据旧值更新

```rust
use std::collections::HashMap;

let text = "hello world wonderful world";

let mut map = HashMap::new();

for word in text.split_whitespace() {
    let count = map.entry(word).or_insert(0);
    *count += 1;
}

println!("{:?}", map); // {"hello": 1, "world": 2, "wonderful": 1}
```

### HashMap 的其他方法

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();
scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);

// 检查是否包含键
let has_blue = scores.contains_key(&String::from("Blue"));

// 移除键值对
let removed = scores.remove(&String::from("Blue"));

// 获取键的数量
let len = scores.len();

// 检查是否为空
let is_empty = scores.is_empty();

// 清空 HashMap
scores.clear();
```

## 选择集合类型

### 何时使用 Vector

- 需要一个有序的元素列表
- 需要在末尾添加或删除元素
- 需要通过索引访问元素
- 需要迭代所有元素

### 何时使用 String

- 需要拥有 UTF-8 编码的文本数据
- 需要可变的文本数据
- 需要将文本数据传递给函数（获取所有权）

### 何时使用 &str

- 需要引用 UTF-8 编码的文本数据
- 文本数据不需要修改
- 需要高效的字符串操作

### 何时使用 HashMap

- 需要通过键快速查找值
- 需要键值对的关联数据
- 不关心数据的顺序

### 性能考虑

| 操作 | Vector | String | HashMap |
|------|--------|--------|---------|
| 插入 | O(1) 尾部 | O(1) 尾部 | O(1) 平均 |
| 删除 | O(1) 尾部 | O(1) 尾部 | O(1) 平均 |
| 查找 | O(1) 索引 | O(n) 子串 | O(1) 平均 |
| 迭代 | O(n) | O(n) | O(n) |

## 💡 关键要点

1. **Vector 适合有序数据**：动态数组，适合需要索引访问的场景
2. **String 是 UTF-8 编码**：理解字符、字节和字符串字面量的区别
3. **HashMap 提供快速查找**：通过键快速访问值
4. **所有权规则适用于集合**：理解何时发生移动和借用
5. **选择合适的集合类型**：根据使用场景选择最合适的数据结构

## 🎯 实践建议

1. **优先使用 Vector**：当需要有序集合时首选 Vector
2. **字符串处理要小心**：注意 Unicode 和 UTF-8 的复杂性
3. **合理使用 HashMap**：当需要键值对关联时使用 HashMap
4. **注意性能影响**：了解各种操作的时间复杂度
5. **善用迭代器**：使用迭代器进行高效的数据处理

## 🔗 相关链接

- **上一章**: [数据结构](./data-structures.md)
- **下一章**: [错误处理](./error-handling.md)
- **相关概念**: [所有权系统](./ownership.md)

---

[返回索引](./index.md) 