sap.ui.define([
    "sap/ui/core/format/DateFormat"
], function (DateFormat) {
    "use strict";

    return {
        /**
         * Converts MM-YYYY format to MonthName YYYY format
         * @param {string} sMonthYear - Month-Year in MM-YYYY format (e.g., "06-2025")
         * @returns {string} Formatted month-year (e.g., "June 2025")
         */
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
                // If parsing fails, return original value
            }
            
            return sMonthYear;
        },

        /**
         * Formats SAP date string to readable format
         * @param {string} sSapDate - SAP date string (e.g., "/Date(1750982400000)/")
         * @returns {string} Formatted date (e.g., "01/01/2025")
         */
        formatSapDate: function (sSapDate) {
            console.log("formatSapDate called with:", sSapDate, "Type:", typeof sSapDate);
            
            if (!sSapDate) {
                console.log("Empty or null value, returning empty string");
                return "";
            }

            try {
                // Handle both escaped and unescaped SAP date formats
                // "/Date(1750982400000)/" or "\/Date(1750982400000)\/"
                var sMatch = sSapDate.match(/\\?\/Date\((\d+)\)\\?\//);
                console.log("Regex match result:", sMatch);
                
                if (sMatch && sMatch[1]) {
                    var iTimestamp = parseInt(sMatch[1]);
                    var oDate = new Date(iTimestamp);
                    var sFormatted = oDate.toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric"
                    });
                    console.log("Formatted date:", sFormatted);
                    return sFormatted;
                } else {
                    console.log("No regex match found");
                }
            } catch (e) {
                console.error("Error in formatSapDate:", e);
                // If parsing fails, return original value
            }
            
            console.log("Returning original value:", sSapDate);
            return sSapDate;
        },

        /**
         * Formats quantity with unit
         * @param {string} sQuantity - Quantity value
         * @param {string} sUnit - Unit of measurement
         * @returns {string} Formatted quantity with unit
         */
        formatQuantity: function (sQuantity, sUnit) {
            if (!sQuantity) {
                return "";
            }
            
            var sFormatted = parseFloat(sQuantity).toFixed(2);
            return sUnit ? sFormatted + " " + sUnit : sFormatted;
        }
    };
});
