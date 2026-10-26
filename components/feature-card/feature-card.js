Component({
  properties: { feature: { type: Object, value: {} } },
  methods: { onTap() { this.triggerEvent('select', { feature: this.data.feature }) } }
})
