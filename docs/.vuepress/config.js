module.exports = {
    title: 'matt的前端之路', // 显示在左上角的网页名称以及首页在浏览器标签显示的title名称
    description: 'matt的前端之路', // meta 中的描述文字，用于SEO
    base: '/matt-blog/',
    head: [
        ['link', { rel: 'icon', href: '/cainiao.jpg' }],  //浏览器的标签栏的网页图标
    ],
    serviceWorker: true,
    themeConfig: {
        logo: '/cainiao.jpg',
        nav: [
        ],
        sidebar: [
    {
        title: "hybrid",
        collapsable: true,
        children: [
            {
                title: "jsbridge原理浅析",
                path: "/pages/hybrid/jsbridge.md"
            }
        ]
    },
    {
        title: "mini-program",
        collapsable: true,
        children: [
            {
                title: "Taro 框架深度解析",
                path: "/pages/mini-program/taro.md"
            }
        ]
    },
    {
        title: "计算机网络",
        collapsable: true,
        children: [
            {
                title: "浅析https",
                path: "/pages/network/https.md"
            }
        ]
    },
    {
        title: "performance",
        collapsable: true,
        children: [
            {
                title: "图片懒加载",
                path: "/pages/performance/image-lazy.md"
            }
        ]
    },
    {
        title: "项目经验剖析",
        collapsable: true,
        children: [
            {
                title: "深入探索文件上传：从组件设计到断点续传",
                path: "/pages/project/file-upload-deep-dive.md"
            },
            {
                title: "项目经验剖析：面试准备指南",
                path: "/pages/project/interview-preparation.md"
            },
            {
                title: "template-compiler-analysis",
                path: "/pages/project/template-compiler-analysis.md"
            }
        ]
    },
    {
        title: "qwik",
        collapsable: true,
        children: [
            {
                title: "Qwik 框架学习指南",
                path: "/pages/qwik/"
            },
            {
                title: "Qwik 核心思想",
                path: "/pages/qwik/qwik-core-concepts.md"
            },
            {
                title: "Qwik 拓展工具",
                path: "/pages/qwik/qwik-extension-tools.md"
            },
            {
                title: "Qwik 介绍",
                path: "/pages/qwik/qwik-introduction.md"
            },
            {
                title: "Qwik Optimizer",
                path: "/pages/qwik/qwik-optimizer.md"
            },
            {
                title: "Qwik 原理",
                path: "/pages/qwik/qwik-principles.md"
            },
            {
                title: "学习总结",
                path: "/pages/qwik/summary.md"
            }
        ]
    },
    {
        title: "react",
        collapsable: true,
        children: [
            {
                title: "react组件增加标识",
                path: "/pages/react/react组件增加标识.md"
            }
        ]
    },
    {
        title: "react-native",
        collapsable: true,
        children: [
            {
                title: "react-native bridge原理探究",
                path: "/pages/react-native/react-native bridge原理探究.md"
            },
            {
                title: "react-native启动过程分析(Android)",
                path: "/pages/react-native/react-native启动原理探究(Android）.md"
            }
        ]
    },
    {
        title: "rust",
        collapsable: true,
        children: [
            {
                title: "Rust 学习之路",
                path: "/pages/rust/"
            },
            {
                title: "Rust 基础语法",
                path: "/pages/rust/basic-syntax.md"
            },
            {
                title: "集合类型",
                path: "/pages/rust/collections.md"
            },
            {
                title: "数据结构",
                path: "/pages/rust/data-structures.md"
            },
            {
                title: "错误处理",
                path: "/pages/rust/error-handling.md"
            },
            {
                title: "函数式编程",
                path: "/pages/rust/functional-programming.md"
            },
            {
                title: "泛型与特征",
                path: "/pages/rust/generics-and-traits.md"
            },
            {
                title: "所有权系统",
                path: "/pages/rust/ownership.md"
            },
            {
                title: "智能指针",
                path: "/pages/rust/smart-pointers.md"
            },
            {
                title: "工具与项目管理",
                path: "/pages/rust/tools-and-project.md"
            }
        ]
    },
    {
        title: "vue学习",
        collapsable: true,
        children: [
            {
                title: "tsx",
                path: "/pages/vue/tsx-in-vue.md"
            },
            {
                title: "响应式",
                path: "/pages/vue/响应式.md"
            },
            {
                title: "框架分析",
                path: "/pages/vue/框架分析.md"
            }
        ]
    },
    {
        title: "webpack学习",
        collapsable: true,
        children: [
            {
                title: "webpack plugin",
                path: "/pages/webpack/plugin.md"
            }
        ]
    },
    {
        title: "xiaochengxu",
        collapsable: true,
        children: [
            {
                title: "Taro 框架深度解析",
                path: "/pages/xiaochengxu/taro.md"
            }
        ]
    }
]
    }
}