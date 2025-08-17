sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, Filter, FilterOperator, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("SHOPFLOOR.controller.PlannedOrdersMonth", {
        onInit: function () {
            // Check if user is logged in
            var sPlant = localStorage.getItem("SHOPFLOOR_PLANT");
            
            if (!sPlant) {
                // User not logged in, redirect to login
                this.getOwnerComponent().getRouter().navTo("Login");
                return;
            }
            
            // Initialize view model
            this._oViewModel = new JSONModel({
                busy: false,
                data: []
            });
            this.getView().setModel(this._oViewModel, "viewModel");
            
            this._loadData();
        },

        onAfterRendering: function () {
            // Additional setup after rendering
        },

        // Formatter functions
        formatSapDate: function (sSapDate) {
            if (!sSapDate) {
                return "";
            }

            try {
                // Handle both escaped and unescaped SAP date formats
                // "/Date(1750982400000)/" or "\/Date(1750982400000)\/"
                var sMatch = sSapDate.match(/\\?\/Date\((\d+)\)\\?\//);
                
                if (sMatch && sMatch[1]) {
                    var iTimestamp = parseInt(sMatch[1]);
                    var oDate = new Date(iTimestamp);
                    return oDate.toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric"
                    });
                } else {
                    // Try different patterns
                    var sMatch2 = sSapDate.match(/Date\((\d+)\)/);
                    
                    if (sMatch2 && sMatch2[1]) {
                        var iTimestamp2 = parseInt(sMatch2[1]);
                        var oDate2 = new Date(iTimestamp2);
                        return oDate2.toLocaleDateString("en-US", {
                            month: "2-digit",
                            day: "2-digit",
                            year: "numeric"
                        });
                    }
                }
            } catch (e) {
                console.error("Error in formatSapDate:", e);
            }
            
            return sSapDate;
        },

        formatMonthYear: function (sMonthYear) {
            if (!sMonthYear) {
                return "";
            }

            try {
                var aParts = sMonthYear.split("-");
                if (aParts.length === 2) {
                    var iMonth = parseInt(aParts[0]) - 1; // Month is 0-indexed
                    var iYear = parseInt(aParts[1]);
                    
                    var oDate = new Date(iYear, iMonth, 1);
                    var sMonthName = oDate.toLocaleDateString("en-US", { month: "long" });
                    
                    return sMonthName + " " + iYear;
                }
            } catch (e) {
                console.error("Error in formatMonthYear:", e);
            }
            
            return sMonthYear;
        },

        _loadData: function () {
            var that = this;
            var oViewModel = this.getView().getModel("viewModel");
            
            oViewModel.setProperty("/busy", true);
            
            // Get plant from localStorage
            var sPlant = localStorage.getItem("SHOPFLOOR_PLANT");
            
            // OData call to fetch month-wise planned orders
            var sUrl = "/sap/opu/odata/SAP/Z48_PP_PORTAL_SRV/pp_planorder_month1Set?$filter=Plwrk eq '" + sPlant + "'&$format=json";
            jQuery.ajax({
                url: sUrl,
                type: "GET",
                dataType: "json",
                success: function (oData) {
                    console.log("Raw response:", oData);
                    
                    // Handle different response formats
                    var aResults = [];
                    
                    if (oData && oData.d && oData.d.results) {
                        // Standard OData format
                        aResults = oData.d.results;
                    } else if (oData && Array.isArray(oData)) {
                        // Direct array format
                        aResults = oData;
                    } else if (oData && oData.results) {
                        // Alternative format
                        aResults = oData.results;
                    } else if (oData && typeof oData === 'object') {
                        // Single object or other format
                        aResults = [oData];
                    }
                    
                    console.log("Processed results:", aResults);
                    
                    if (aResults.length > 0) {
                        // Log first few items to see the data structure
                        console.log("First item sample:", aResults[0]);
                        console.log("Psttr value:", aResults[0].Psttr);
                        console.log("Pedtr value:", aResults[0].Pedtr);
                        console.log("Pertr value:", aResults[0].Pertr);
                        
                        // Pre-process the data to format dates
                        // Use the 'that' variable from the outer scope to access controller methods
                        var aProcessedResults = aResults.map(function(oItem) {
                            var oProcessedItem = Object.assign({}, oItem);
                            
                            // Format Psttr (Start Date)
                            if (oProcessedItem.Psttr) {
                                oProcessedItem.PsttrFormatted = that.formatSapDate(oProcessedItem.Psttr);
                            }
                            
                            // Format Pedtr (End Date)
                            if (oProcessedItem.Pedtr) {
                                oProcessedItem.PedtrFormatted = that.formatSapDate(oProcessedItem.Pedtr);
                            }
                            
                            // Format Pertr (Transaction Date)
                            if (oProcessedItem.Pertr) {
                                oProcessedItem.PertrFormatted = that.formatSapDate(oProcessedItem.Pertr);
                            }
                            
                            // Format Monthyr (Month-Year)
                            if (oProcessedItem.Monthyr) {
                                oProcessedItem.MonthyrFormatted = that.formatMonthYear(oProcessedItem.Monthyr);
                            }
                            
                            return oProcessedItem;
                        });
                        
                        console.log("Processed first item:", aProcessedResults[0]);
                        
                        oViewModel.setProperty("/data", aProcessedResults);
                        MessageToast.show("Data loaded successfully: " + aProcessedResults.length + " records");
                    } else {
                        oViewModel.setProperty("/data", []);
                        MessageToast.show("No data found");
                    }
                },
                error: function (xhr, status, error) {
                    console.error("Error loading data:", error);
                    console.error("Status:", xhr.status);
                    console.error("Response Text:", xhr.responseText);
                    console.error("Response Headers:", xhr.getAllResponseHeaders());
                    MessageBox.error("Failed to load data. Please check your connection and try again.");
                    oViewModel.setProperty("/data", []);
                },
                complete: function () {
                    oViewModel.setProperty("/busy", false);
                }
            });
        },

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            this._applyFilters(sQuery);
        },

        onSearchLiveChange: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue");
            this._applyFilters(sQuery);
        },

        onDateRangeChange: function () {
            this._applyDateRangeFilter();
        },

        onDocumentNumberChange: function (oEvent) {
            var sDocumentNumber = oEvent.getParameter("newValue");
            this._applyDocumentNumberFilter(sDocumentNumber);
        },

        onClearFilters: function () {
            // Clear all filters
            this.byId("searchField").setValue("");
            this.byId("fromDatePicker").setValue("");
            this.byId("toDatePicker").setValue("");
            this.byId("documentNumberInput").setValue("");
            
            // Reset data to original by reloading
            this._loadData();
            
            MessageToast.show("All filters cleared");
        },

        onRefreshData: function () {
            this._loadData();
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("Dashboard");
        },

        _applyFilters: function (sQuery) {
            if (!sQuery) {
                this._resetToOriginalData();
                return;
            }

            var oViewModel = this.getView().getModel("viewModel");
            var oCurrentData = oViewModel.getProperty("/data");
            
            if (!oCurrentData || oCurrentData.length === 0) {
                return;
            }

            var aFilteredData = oCurrentData.filter(function (oItem) {
                // Search by month-year (convert MM-YYYY to Month YYYY for comparison)
                var sMonthYear = oItem.Monthyr;
                if (sMonthYear) {
                    var aParts = sMonthYear.split("-");
                    if (aParts.length === 2) {
                        var iMonth = parseInt(aParts[0]) - 1;
                        var iYear = parseInt(aParts[1]);
                        var oDate = new Date(iYear, iMonth, 1);
                        var sMonthName = oDate.toLocaleDateString("en-US", { month: "long" });
                        var sFormattedMonthYear = sMonthName + " " + iYear;
                        
                        if (sFormattedMonthYear.toLowerCase().includes(sQuery.toLowerCase())) {
                            return true;
                        }
                    }
                }
                
                // Search by other fields
                return oItem.Plnum && oItem.Plnum.toString().toLowerCase().includes(sQuery.toLowerCase()) ||
                       oItem.Matnr && oItem.Matnr.toString().toLowerCase().includes(sQuery.toLowerCase()) ||
                       oItem.Dispo && oItem.Dispo.toString().toLowerCase().includes(sQuery.toLowerCase());
            });

            oViewModel.setProperty("/data", aFilteredData);
        },

        _applyDateRangeFilter: function () {
            var oFromDate = this.byId("fromDatePicker").getDateValue();
            var oToDate = this.byId("toDatePicker").getDateValue();
            
            if (!oFromDate && !oToDate) {
                this._resetToOriginalData();
                return;
            }

            var oViewModel = this.getView().getModel("viewModel");
            var oCurrentData = oViewModel.getProperty("/data");
            
            if (!oCurrentData || oCurrentData.length === 0) {
                return;
            }

            var aFilteredData = oCurrentData.filter(function (oItem) {
                var bInclude = true;
                
                if (oFromDate && oItem.Psttr) {
                    var sMatch = oItem.Psttr.match(/\/Date\((\d+)\)\//);
                    if (sMatch && sMatch[1]) {
                        var oItemDate = new Date(parseInt(sMatch[1]));
                        if (oItemDate < oFromDate) {
                            bInclude = false;
                        }
                    }
                }
                
                if (oToDate && oItem.Pedtr) {
                    var sMatch = oItem.Pedtr.match(/\/Date\((\d+)\)\//);
                    if (sMatch && sMatch[1]) {
                        var oItemDate = new Date(parseInt(sMatch[1]));
                        if (oItemDate > oToDate) {
                            bInclude = false;
                        }
                    }
                }
                
                return bInclude;
            });

            oViewModel.setProperty("/data", aFilteredData);
        },

        _applyDocumentNumberFilter: function (sDocumentNumber) {
            if (!sDocumentNumber) {
                this._resetToOriginalData();
                return;
            }

            var oViewModel = this.getView().getModel("viewModel");
            var oCurrentData = oViewModel.getProperty("/data");
            
            if (!oCurrentData || oCurrentData.length === 0) {
                return;
            }

            var aFilteredData = oCurrentData.filter(function (oItem) {
                return oItem.Plnum && oItem.Plnum.toString().toLowerCase().includes(sDocumentNumber.toLowerCase());
            });

            oViewModel.setProperty("/data", aFilteredData);
        },

        _resetToOriginalData: function () {
            // Reset to original data by reloading
            this._loadData();
        }
    });
});
