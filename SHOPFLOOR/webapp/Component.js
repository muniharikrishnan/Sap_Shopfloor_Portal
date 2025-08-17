sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/Device",
  "SHOPFLOOR/model/models"
], function (UIComponent, Device, models) {
  "use strict";

  return UIComponent.extend("SHOPFLOOR.Component", {
    metadata: {
      manifest: "json"
    },

    init: function () {
      // Call the base component's init function
      UIComponent.prototype.init.apply(this, arguments);

      // Set the device model
      this.setModel(models.createDeviceModel(), "device");

      // Initialize the router
      this.getRouter().initialize();
    }
  });
});
