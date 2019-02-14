"use strict";

module.exports = (slot, value) => {
    // Do something with value
    // Slot is the contents between the shortcode tags when using tag pairs
    
    if (slot) {
        return value + slot;
    }

    return value;
}
