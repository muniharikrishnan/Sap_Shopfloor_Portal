sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast"
], function (Controller, MessageToast) {
  "use strict";

  return Controller.extend("SHOPFLOOR.controller.Login", {
    onLoginPress: function () {
      var sPlant = this.byId("usernameInput").getValue(); // This is the plant name (e.g., 0001)
      var sPassword = this.byId("passwordInput").getValue(); // This can be any password for UI purposes

      if (!sPlant || !sPassword) {
        MessageToast.show("Please enter both plant name and password");
        return;
      }

      // Store only the plant name - authentication is handled by the proxy
      localStorage.setItem("SHOPFLOOR_PLANT", sPlant);

      MessageToast.show("Login Successful - Plant: " + sPlant);

      var oLoginModel = new sap.ui.model.json.JSONModel({
        userId: sPlant,
        plant: sPlant
      });

      sap.ui.getCore().setModel(oLoginModel, "loginInfo");
      this.getOwnerComponent().getRouter().navTo("Dashboard");
    }
  });
});