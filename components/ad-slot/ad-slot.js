const adService = require('../../services/adService')

Component({
  properties: { slotId: { type: String, value: '' } },
  data: { enabled: false, unitId: '' },
  lifetimes: {
    attached() {
      const slot = adService.getSlot(this.properties.slotId)
      this.setData(slot)
    }
  }
})
