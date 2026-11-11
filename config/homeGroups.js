// 首页模块清单：新增/调整首页内容只需修改本文件。
// iconPath 指向项目本地 SVG 图片，微信小程序通过 image 组件显示。
module.exports = [
  {
    id: 'esign',
    title: '电子签名',
    features: [
      { id: 'hand-sign', title: '手写签名', iconPath: '/assets/icons/pen.svg', route: '/pages/signature/index', implemented: true, isHot: true },
      { id: 'file-sign', title: '文件签名', iconPath: '/assets/icons/file.svg', description: '为文件添加电子签名', isHot: true, route: '/pages/file-sign/index', implemented: true },
      { id: 'task-sign', title: '任务签名', iconPath: '/assets/icons/list.svg', description: '群接龙与任务签名', isHot: true, route: '/pages/task-sign/index', implemented: true },
      { id: 'design-sign', title: '设计签名', iconPath: '/assets/icons/spark.svg', description: '制作个性化签名', route: '/pages/design-sign/index', implemented: true },
      { id: 'office-seal', title: '办公印章', iconPath: '/assets/icons/seal.svg', description: '制作常用办公印章', route: '/pages/seal/index', implemented: true },
      { id: 'media-extract', title: '网媒提取', iconPath: '/assets/icons/link.svg', description: '前往相关小程序', external: true }
    ]
  },
  {
    id: 'calligraphy',
    title: '书法大师',
    features: [
      { id: 'calligraphy-master', title: '书法大师', iconPath: '/assets/icons/brush.svg', description: '探索书法创作工具', route: '/pages/calligraphy/index', implemented: true },
      { id: 'copybook', title: '字帖临摹', iconPath: '/assets/icons/book.svg', description: '练习与临摹字帖', route: '/pages/copybook/index', implemented: true },
      { id: 'calligraphy-seal', title: '书法印章', iconPath: '/assets/icons/seal.svg', description: '制作书法风格印章', route: '/pages/calligraphy-seal/index', implemented: true },
      { id: 'brush-gif', title: '画笔GIF', iconPath: '/assets/icons/gif.svg', description: '创作动态画笔效果', route: '/pages/brush-gif/index', implemented: true },
      { id: 'handwriting', title: '手写模拟', iconPath: '/assets/icons/hand.svg', description: '生成自然手写效果', route: '/pages/handwriting/index', implemented: true },
      { id: 'timed-message', title: '定时消息', iconPath: '/assets/icons/clock.svg', description: '安排消息发送', route: '/pages/timed-message/index', implemented: true }
    ]
  }
  ,{
    id: 'support',
    title: '支持作者',
    features: [
      { id: 'support-author', title: '支持作者', iconPath: '/assets/icons/heart.svg', description: '支持工具持续维护', route: '/pages/support/index', implemented: true }
    ]
  }
]
