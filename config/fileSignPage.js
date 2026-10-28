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
    { id: 'local', label: '本地文件', desc: '从聊天文件或本地选择', icon: '▧' },
    { id: 'camera', label: '即时拍照', desc: '拍摄纸质文件', icon: '▣' },
    { id: 'wechat', label: '微信记录', desc: '选择微信中的文件', icon: '▤' },
    { id: 'pdf', label: 'PDF文件', desc: '快速选择 PDF 文档', icon: 'PDF' },
    { id: 'cancel', label: '取消', desc: '', icon: '×' }
  ],
  signatureSources: [
    { id: 'hand', label: '手写签名', desc: '进入手写签名页创建', icon: '✍' },
    { id: 'seal', label: '办公印章', desc: '选择已有印章 PNG', icon: '◎' },
    { id: 'date', label: '年月日', desc: '生成日期签名', icon: '日' },
    { id: 'cancel', label: '取消', desc: '', icon: '×' }
  ]
}
