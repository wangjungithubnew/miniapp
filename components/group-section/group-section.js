Component({
  properties: { group: { type: Object, value: {} } },
  methods: { onSelect(e) { this.triggerEvent('select', e.detail) } }
})
