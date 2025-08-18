sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
  "use strict";

  return Controller.extend("SHOPFLOOR.controller.Login", {
    onInit: function () {
      console.log("Login controller initialized");
      
      // Check if user is already logged in
      var sStoredPlant = localStorage.getItem("SHOPFLOOR_PLANT");
      if (sStoredPlant) {
        console.log("User already logged in, redirecting to Dashboard");
        this.getOwnerComponent().getRouter().navTo("Dashboard");
      }
    },

    onAfterRendering: function () {
      // Add key press handler for Enter key on password input
      var oPasswordInput = this.byId("passwordInput");
      if (oPasswordInput) {
        oPasswordInput.attachBrowserEvent("keypress", this._onPasswordKeyPress, this);
      }
    },

    _onPasswordKeyPress: function (oEvent) {
      // Handle Enter key press on password input
      if (oEvent.keyCode === 13) { // Enter key
        this.onLoginPress();
      }
    },

    onLoginPress: function () {
      var sUsername = this.byId("usernameInput").getValue().trim();
      var sPassword = this.byId("passwordInput").getValue();

      // Validate input
      if (!sUsername) {
        MessageToast.show("Please enter username");
        this.byId("usernameInput").focus();
        return;
      }

      if (!sPassword) {
        MessageToast.show("Please enter password");
        this.byId("passwordInput").focus();
        return;
      }

      // Set busy state
      this._setBusyState(true);

      // Call SAP backend for authentication
      this._authenticateUser(sUsername, sPassword);
    },

    _setBusyState: function (bBusy) {
      // Update UI elements
      var oLoginButton = this.byId("loginButton");
      var oStatusText = this.byId("statusText");
      
      if (oLoginButton) {
        oLoginButton.setEnabled(!bBusy);
        oLoginButton.setText(bBusy ? "Logging in..." : "Login");
      }
      
      if (oStatusText) {
        oStatusText.setText(bBusy ? "Authenticating..." : "");
        oStatusText.setVisible(bBusy);
      }
    },

    _authenticateUser: function (sUsername, sPassword) {
      var that = this;
      
      // Build the authentication URL using the proxy configuration
      // This matches your SAP backend URL structure
      var sUrl = "/sap/opu/odata/SAP/Z48_PP_PORTAL_SRV/pploginSet(UserId='" + sUsername + "',Password='" + sPassword + "')?$format=json";
      
      console.log("Attempting login for user:", sUsername);
      console.log("Login URL:", sUrl);
      
      jQuery.ajax({
        url: sUrl,
        type: "GET",
        dataType: "json",
        timeout: 30000, // 30 second timeout
        success: function (oData) {
          console.log("Login response:", oData);
          
          // Check if authentication was successful
          if (oData && oData.d && oData.d.UserId && oData.d.Password) {
            // Verify the credentials match exactly
            if (oData.d.UserId === sUsername && oData.d.Password === sPassword) {
              // Authentication successful
              console.log("Authentication successful for user:", sUsername);
              that._onLoginSuccess(sUsername);
            } else {
              // Credentials don't match
              console.log("Credentials mismatch for user:", sUsername);
              console.log("Expected:", sUsername + "/" + sPassword);
              console.log("Received:", oData.d.UserId + "/" + oData.d.Password);
              that._onLoginError("Invalid username or password");
            }
          } else {
            // No data returned or unexpected response format
            console.log("Unexpected response format:", oData);
            that._onLoginError("Authentication failed. Please check your credentials.");
          }
        },
        error: function (xhr, status, error) {
          console.error("Login error:", error);
          console.error("Status:", xhr.status);
          console.error("Response Text:", xhr.responseText);
          
          var sErrorMessage = "Login failed. Please try again.";
          
          if (xhr.status === 401) {
            sErrorMessage = "Invalid username or password";
          } else if (xhr.status === 404) {
            sErrorMessage = "User not found";
          } else if (xhr.status === 0) {
            sErrorMessage = "Network error. Please check your connection.";
          } else if (xhr.status >= 500) {
            sErrorMessage = "Server error. Please try again later.";
          } else if (status === "timeout") {
            sErrorMessage = "Request timeout. Please try again.";
          }
          
          that._onLoginError(sErrorMessage);
        },
        complete: function () {
          that._setBusyState(false);
        }
      });
    },

    _onLoginSuccess: function (sUsername) {
      // Store the USERNAME in SHOPFLOOR_PLANT localStorage
      // This is what other controllers use to filter data
      localStorage.setItem("SHOPFLOOR_PLANT", sUsername);
      localStorage.setItem("SHOPFLOOR_USER", sUsername);
      localStorage.setItem("SHOPFLOOR_LOGIN_TIME", new Date().toISOString());

      console.log("User logged in successfully:", sUsername);
      console.log("Stored in SHOPFLOOR_PLANT:", localStorage.getItem("SHOPFLOOR_PLANT"));

      MessageToast.show("Login Successful - Welcome " + sUsername);

      // Set login info model for the application
      var oLoginModel = new sap.ui.model.json.JSONModel({
        userId: sUsername,
        plant: sUsername
      });

      sap.ui.getCore().setModel(oLoginModel, "loginInfo");
      
      // Navigate to Dashboard
      this.getOwnerComponent().getRouter().navTo("Dashboard");
    },

    _onLoginError: function (sErrorMessage) {
      MessageBox.error(sErrorMessage, {
        title: "Login Failed",
        onClose: function () {
          // Clear password field on error
          this.byId("passwordInput").setValue("");
          this.byId("passwordInput").focus();
        }.bind(this)
      });
    }
  });
});