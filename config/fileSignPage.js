module.exports = {
  fileTypes: [
    { id: 'pdf', label: 'PDF', extensions: ['pdf'], kind: 'document' },
    { id: 'image', label: '图片', extensions: ['jpg', 'jpeg', 'png', 'webp'], kind: 'image' }
  ],
  actions: [
    { id: 'choose-file', label: '选择文件', icon: '▧' },
    { id: 'choose-signature', label: '选择签名', icon: '✍' },
    { id: 'download', label: '下载文件', icon: '↓' }
  ],
  fileSources: [
    { id: 'pdf', label: '微信 PDF', desc: '从微信聊天文件中选择 PDF 文档', icon: 'PDF' },
    { id: 'image', label: '微信图片', desc: '从微信聊天或相册中选择图片', icon: '▧' },
    { id: 'cancel', label: '取消', desc: '', icon: '×' }
  ],
  signatureSources: [
    { id: 'hand', label: '手写签名', desc: '进入手写签名页创建', icon: '✍' },
    { id: 'text', label: '添加文字', desc: '输入文字作为签名', icon: 'T' },
    { id: 'cancel', label: '取消', desc: '', icon: '×' }
  ]
}
