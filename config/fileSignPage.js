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
  signatureSources: [
    { id: 'saved', label: '已保存签名' },
    { id: 'create', label: '新建手写签名' }
  ]
}
