sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast"
], function (Controller, MessageToast) {
  "use strict";

  return Controller.extend("SHOPFLOOR.controller.Dashboard", {
    onInit: function () {
      // Check if user is logged in
      var sPlant = localStorage.getItem("SHOPFLOOR_PLANT");
      
      if (!sPlant) {
        // User not logged in, redirect to login
        this.getOwnerComponent().getRouter().navTo("Login");
        return;
      }
      
      var oLoginModel = sap.ui.getCore().getModel("loginInfo");
      if (oLoginModel) {
        this.getView().setModel(oLoginModel);
              } else {
          // Create login model from localStorage
          var oNewLoginModel = new sap.ui.model.json.JSONModel({
            userId: sPlant,
            plant: sPlant
          });
        sap.ui.getCore().setModel(oNewLoginModel, "loginInfo");
        this.getView().setModel(oNewLoginModel);
      }
    },

    onPlannedOrdersMonthPress: function () {
      this.getOwnerComponent().getRouter().navTo("PlannedOrdersMonth");
    },

    onPlannedOrdersYearPress: function () {
      this.getOwnerComponent().getRouter().navTo("PlannedOrdersYear");
    },

    onProductionOrdersMonthPress: function () {
      this.getOwnerComponent().getRouter().navTo("ProductionOrdersMonth");
    },

    onProductionOrdersYearPress: function () {
      this.getOwnerComponent().getRouter().navTo("ProductionOrdersYear");
    },

    onLogoutPress: function () {
      // Clear localStorage
      localStorage.removeItem("SHOPFLOOR_PLANT");
      
      // Clear login model
      sap.ui.getCore().setModel(null, "loginInfo");
      
      this.getOwnerComponent().getRouter().navTo("Login");
    }
  });
});