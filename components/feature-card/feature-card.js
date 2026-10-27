Component({
  properties: { feature: { type: Object, value: {} }, tone: { type: Number, value: 0 } },
  data: { displayIconPath: '' },
  lifetimes: {
    attached() {
      const path = this.properties.feature.iconPath || ''
      const file = path.split('/').pop()
      this.setData({ displayIconPath: `/assets/icons/tone${this.properties.tone}-${file}` })
    }
  },
  methods: { onTap() { this.triggerEvent('select', { feature: this.data.feature }) } }
})
