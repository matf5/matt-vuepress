# Qwik 框架学习指南

> 基于 2024.09.02 的技术分享整理

## 文档目录

### 📚 核心文档

1. [**Qwik 介绍**](./qwik-introduction.md) - 什么是 Qwik？性能表现如何？
2. [**Qwik 核心思想**](./qwik-core-concepts.md) - Resumable、Progressive、Reactivity 三大核心概念
3. [**Qwik 原理**](./qwik-principles.md) - 深入理解 Qwik 的工作原理和实现机制
4. [**Qwik Optimizer**](./qwik-optimizer.md) - 编译工具和代码拆分原理
5. [**Qwik 拓展工具**](./qwik-extension-tools.md) - 如何改造和扩展 Qwik
6. [**学习总结**](./summary.md) - 核心概念回顾和实践指南

## 关于 Qwik

Qwik 是一个革命性的 Web 框架，它通过创新的 **Resumable** 架构解决了传统 SSR 框架的性能瓶颈。

### 主要特性

- 🚀 **极致性能**: 首屏只需 1KB JavaScript
- 🔄 **可恢复性**: 无需传统的水合过程
- 📦 **渐进式**: 按需加载，懒执行
- ⚡ **响应式**: 基于 Signal 的高效响应式系统

### 技术栈

- **核心**: TypeScript + Rust
- **构建**: SWC + Rollup  
- **运行时**: Signal + Proxy
- **优化**: 编译时代码拆分 + 运行时懒加载


## 相关资源

- [Qwik 官方文档](https://qwik.builder.io/)
- [Qwik GitHub](https://github.com/BuilderIO/qwik)
- [Qwik 中文社区](https://qwik.dev/)

---

*最后更新: 2025-01-11* 