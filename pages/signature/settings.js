const DEFAULTS = { gridType: 'small', backgroundColor: '#fff7e8', color: '#17202c', lineWidth: 5, pressure: true }

function hsvToHex(h, s, v) {
  s /= 100; v /= 100
  const c = v * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = v - c
  let rgb
  if (h < 60) rgb = [c, x, 0]
  else if (h < 120) rgb = [x, c, 0]
  else if (h < 180) rgb = [0, c, x]
  else if (h < 240) rgb = [0, x, c]
  else if (h < 300) rgb = [x, 0, c]
  else rgb = [c, 0, x]
  return '#' + rgb.map(n => Math.round((n + m) * 255).toString(16).padStart(2, '0')).join('')
}

Page({
  data: {
    settings: DEFAULTS,
    pickerTarget: 'backgroundColor',
    hue: 35,
    saturation: 8,
    brightness: 100,
    selectedHex: DEFAULTS.backgroundColor,
    hueStyle: 'background:linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)',
    shadeStyle: 'background-color:#f5a100',
    backgrounds: [
      { name: '白色', value: '#ffffff' }, { name: '米黄', value: '#fff7e8' },
      { name: '浅灰', value: '#eef1f4' }, { name: '浅蓝', value: '#e8f3ff' },
      { name: '浅粉', value: '#fff0f2' }, { name: '浅绿', value: '#ebf8ee' },
      { name: '黑色', value: '#20242b' }
    ],
    colors: [
      { name: '黑色', value: '#17202c' }, { name: '深灰', value: '#555b64' },
      { name: '蓝色', value: '#D95778' }, { name: '红色', value: '#d94141' },
      { name: '金色', value: '#ba8b22' }, { name: '绿色', value: '#15966a' },
      { name: '紫色', value: '#7a50b5' }, { name: '白色', value: '#ffffff' }
    ]
  },
  onLoad() {
    const saved = wx.getStorageSync('signatureSettings') || {}
    this.setData({ settings: Object.assign({}, DEFAULTS, saved) })
  },
  selectGrid(e) { this.update('gridType', e.currentTarget.dataset.value) },
  selectBackground(e) { this.update('backgroundColor', e.currentTarget.dataset.value) },
  selectColor(e) { this.update('color', e.currentTarget.dataset.value) },
  showPicker(e) {
    const target = e.currentTarget.dataset.target
    const hex = this.data.settings[target]
    this.setData({ pickerTarget: target, selectedHex: hex })
    this.hexToHsv(hex)
  },
  hidePicker() { this.setData({ pickerTarget: '' }) },
  noop() {},
  hexToHsv(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
    let h = 0
    if (d) {
      if (max === r) h = 60 * (((g - b) / d) % 6)
      else if (max === g) h = 60 * ((b - r) / d + 2)
      else h = 60 * ((r - g) / d + 4)
    }
    if (h < 0) h += 360
    const saturation = max ? d / max * 100 : 0
    this.setData({ hue: h, saturation, brightness: max * 100, hueStyle: `background:linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)`, shadeStyle: `background-color:hsl(${h},100%,50%)` })
  },
  onHueChange(e) {
    const hue = Number(e.detail.value)
    this.setData({ hue, shadeStyle: `background-color:hsl(${hue},100%,50%)` })
    this.updateCustomColor()
  },
  onShadeTouch(e) {
    const touch = e.touches && e.touches[0]
    const rect = e.currentTarget.getBoundingClientRect ? e.currentTarget.getBoundingClientRect() : null
    if (!touch || !rect) return
    const saturation = Math.max(0, Math.min(100, (touch.clientX - rect.left) / rect.width * 100))
    const brightness = Math.max(0, Math.min(100, 100 - (touch.clientY - rect.top) / rect.height * 100))
    this.setData({ saturation, brightness })
    this.updateCustomColor()
  },
  updateCustomColor() {
    const hex = hsvToHex(this.data.hue, this.data.saturation, this.data.brightness)
    this.setData({ selectedHex: hex })
    this.update(this.data.pickerTarget, hex)
  },
  confirmPicker() { this.hidePicker() },
  onWidthChange(e) { this.update('lineWidth', Number(e.detail.value)) },
  onPressureChange(e) { this.update('pressure', e.detail.value) },
  update(key, value) {
    const settings = Object.assign({}, this.data.settings, { [key]: value })
    this.setData({ settings })
    wx.setStorageSync('signatureSettings', settings)
  }
})
