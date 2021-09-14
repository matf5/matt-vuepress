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
          { text: '首页', link: '/' }
      ],
      sidebar: [
          {
              title: '计算机网络',
              children: [
                  {
                      title: '浅析https',
                      path: '/pages/network/https.md'
                  }
              ]
          },
          {
              title: 'vue3学习',
              children: [
                  {
                      title: 'diff',
                      path: '/pages/vue3/diff.md'
                  }
              ]
          },
          {
            title: 'webpack学习',
            children: [
                {
                    title: 'webpack plugin',
                    path: '/pages/webpack/plugin.md'
                }
            ]
          },
          {
            title: 'hybrid',
            children: [
                {
                    title: 'jsbridge原理浅析',
                    path: '/pages/hybrid/jsbridge.md'
                }
            ]
          },
          {
            title: 'react-native',
            children: [
                {
                    title: 'react-native启动过程分析(Android)',
                    path: '/pages/react-native/react-native启动原理探究(Android）.md'
                }
            ]
        },
      ]
  }
}