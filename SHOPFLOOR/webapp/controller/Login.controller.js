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

    _initDynamicIcon: function() {
      // Array of industrial icons for dynamic rotation
      this._iconArray = [
        "sap-icon://factory",
        "sap-icon://machine",
        "sap-icon://gears",
        "sap-icon://work-history",
        "sap-icon://production",
        "sap-icon://technical-object",
        "sap-icon://equipment",
        "sap-icon://workflow-tasks",
        "sap-icon://tools-opportunity",
        "sap-icon://process",
        "sap-icon://monitor-payments",
        "sap-icon://activity-2"
      ];
      
      this._currentIconIndex = 0;
      this._iconChangeInterval = null;
      this._iconClickCount = 0;
      
      // Get the icon element
      var oIcon = this.byId("logoIcon");
      if (!oIcon) {
        console.warn("Logo icon element not found, dynamic icon functionality disabled");
        return;
      }
      
      // Start dynamic icon rotation
      this._startIconRotation();
      
      // Add click handler for manual icon change
      oIcon.attachPress(this._onIconClick.bind(this));
      
      // Note: core:Icon doesn't support attachMouseOver/attachMouseOut
      // Use CSS hover effects instead for dynamic interactions
      
      console.log("Dynamic icon functionality initialized successfully");
    },

    _startIconRotation: function() {
      // Clear any existing interval first
      if (this._iconChangeInterval) {
        clearInterval(this._iconChangeInterval);
        this._iconChangeInterval = null;
      }
      
      // Change icon every 4-6 seconds randomly
      var iRandomDelay = 4000 + Math.random() * 2000;
      this._iconChangeInterval = setInterval(function() {
        if (this._changeIcon) {
          this._changeIcon();
          // Randomize next delay
          iRandomDelay = 4000 + Math.random() * 2000;
          clearInterval(this._iconChangeInterval);
          this._iconChangeInterval = setInterval(this._changeIcon.bind(this), iRandomDelay);
        }
      }.bind(this), iRandomDelay);
      
      console.log("Icon rotation started with delay:", iRandomDelay, "ms");
    },

    _changeIcon: function() {
      // Randomly select next icon instead of sequential
      var iNewIndex;
      do {
        iNewIndex = Math.floor(Math.random() * this._iconArray.length);
      } while (iNewIndex === this._currentIconIndex && this._iconArray.length > 1);
      
      this._currentIconIndex = iNewIndex;
      var sNewIcon = this._iconArray[this._currentIconIndex];
      
      // Time-based icon selection (optional override)
      if (this._shouldUseTimeBasedIcon()) {
        sNewIcon = this._getTimeBasedIcon();
      }
      
      var oIcon = this.byId("logoIcon");
      if (!oIcon) {
        console.warn("Logo icon element not found during icon change");
        return;
      }
      
      // Add transition effect
      oIcon.addStyleClass("iconChanging");
      
      // Change icon with slight delay for smooth transition
      setTimeout(function() {
        if (oIcon && oIcon.getDomRef()) {
          oIcon.setSrc(sNewIcon);
          oIcon.removeStyleClass("iconChanging");
        }
      }, 150);
    },

    _shouldUseTimeBasedIcon: function() {
      // 20% chance to use time-based icon
      return Math.random() < 0.2;
    },

    _getTimeBasedIcon: function() {
      var oDate = new Date();
      var iHour = oDate.getHours();
      
      // Different icons for different times of day
      if (iHour >= 6 && iHour < 12) {
        // Morning: production and workflow icons
        return this._iconArray[Math.floor(Math.random() * 3)]; // factory, machine, gears
      } else if (iHour >= 12 && iHour < 18) {
        // Afternoon: technical and equipment icons
        return this._iconArray[Math.floor(Math.random() * 3) + 3]; // work-history, production, technical-object
      } else if (iHour >= 18 && iHour < 22) {
        // Evening: monitoring and process icons
        return this._iconArray[Math.floor(Math.random() * 3) + 6]; // equipment, workflow-tasks, tools-opportunity
      } else {
        // Night: activity and monitoring icons
        return this._iconArray[Math.floor(Math.random() * 3) + 9]; // process, monitor-payments, activity-2
      }
    },

    _onIconClick: function() {
      // Manual icon change on click
      this._iconClickCount++;
      this._changeIcon();
      
      // Set data attribute for CSS effects
      var oIcon = this.byId("logoIcon");
      if (oIcon && oIcon.getDomRef()) {
        oIcon.setCustomData(new sap.ui.core.CustomData({
          key: "click-count",
          value: this._iconClickCount.toString()
        }));
      }
      
      // Reset the automatic rotation timer
      if (this._iconChangeInterval) {
        clearInterval(this._iconChangeInterval);
        this._startIconRotation();
      }
      
      // Show different feedback based on click count
      var sFeedback = "Icon changed!";
      if (this._iconClickCount >= 5) {
        sFeedback = "Icon master! 🎯";
      } else if (this._iconClickCount >= 3) {
        sFeedback = "Icon explorer! ⭐";
      }
      
      MessageToast.show(sFeedback);
    },



    onExit: function() {
      // Clean up interval when controller is destroyed
      if (this._iconChangeInterval) {
        clearInterval(this._iconChangeInterval);
      }
    },

    onAfterRendering: function () {
      // Initialize dynamic icon functionality after rendering
      this._initDynamicIcon();
      
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

    onPasswordToggle: function() {
      var oPasswordInput = this.byId("passwordInput");
      var oPasswordToggle = this.byId("passwordToggle");
      
      if (oPasswordInput && oPasswordToggle) {
        var bIsPassword = oPasswordInput.getType() === "Password";
        
        if (bIsPassword) {
          // Show password
          oPasswordInput.setType("Text");
          oPasswordToggle.setIcon("sap-icon://hide");
          oPasswordToggle.setTooltip("Hide password");
          oPasswordToggle.setCustomData(new sap.ui.core.CustomData({
            key: "password-visible",
            value: "true"
          }));
        } else {
          // Hide password
          oPasswordInput.setType("Password");
          oPasswordToggle.setIcon("sap-icon://show");
          oPasswordToggle.setTooltip("Show password");
          oPasswordToggle.setCustomData(new sap.ui.core.CustomData({
            key: "password-visible",
            value: "false"
          }));
        }
        
        // Focus back to password input for better UX
        oPasswordInput.focus();
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