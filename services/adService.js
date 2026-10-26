const config = require('../config/adConfig')

function getSlot(slotId) {
  const slot = config.slots[slotId]
  return {
    enabled: !!(config.enabled && slot && slot.enabled && slot.unitId),
    unitId: slot ? slot.unitId : ''
  }
}

module.exports = { getSlot }
