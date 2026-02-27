/**
 * Real-Time Vehicle API Client
 * Connects to local Express backend for vehicle RC lookup,
 * insurance quotes, and premium calculation.
 * 
 * Backend: server.js (Node.js + Express)
 * Data: IRDAI-compliant premium rates, 30+ state RTO database, 
 *       100+ two-wheeler models from 10 brands
 */

const VehicleAPI = (() => {
    // Backend URL (auto-detect: use relative path when served from Express)
    const API_BASE = window.location.port === '3000' 
        ? '' 
        : 'http://localhost:3000';

    // ===== Core API Methods =====

    /**
     * Lookup vehicle by registration number (e.g., "MH 02 AB 1234")
     * Returns: vehicle details, IDV, premiums, and insurance quotes
     */
    async function fetchVehicleDataRealTime(regNumber) {
        const clean = regNumber.replace(/\s/g, '').toUpperCase();
        
        if (clean.length < 8) {
            return { success: false, error: 'Invalid registration number. Format: XX 00 XX 0000' };
        }

        try {
            const response = await fetch(`${API_BASE}/api/vehicle/lookup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registrationNumber: clean })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Lookup failed');
            }

            // Transform backend response to match existing frontend format
            return {
                success: true,
                registrationNumber: result.data.registrationNumber,
                formattedRegNumber: result.data.formattedRegNumber,
                state: result.data.state,
                rto: `${result.data.rtoCode} - ${result.data.rtoName}`,
                rtoName: result.data.rtoName,
                make: result.data.make,
                model: result.data.model,
                year: result.data.year,
                cc: result.data.cc,
                fuel: result.data.fuel,
                type: result.data.type,
                segment: result.data.segment,
                variant: result.data.variant,
                exShowroomPrice: result.data.exShowroomPrice,
                idv: result.data.idv,
                vehicleAge: result.data.vehicleAge,
                depreciation: result.data.depreciation,
                premium: result.data.premium,
                insuranceStatus: result.data.insuranceStatus,
                fitnessValidUpto: result.data.fitnessValidUpto,
                quotes: result.data.quotes || [],
                isRealTime: true,
                timestamp: result.data.timestamp,
                source: result.data.source
            };
        } catch (error) {
            console.error('Vehicle lookup error:', error);
            return { 
                success: false, 
                error: error.message || 'Unable to connect to server. Is the backend running?' 
            };
        }
    }

    /**
     * Get insurance quotes for manually entered vehicle details
     */
    async function getQuotesByDetails(make, model, year, city) {
        try {
            const response = await fetch(`${API_BASE}/api/insurance/quotes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ make, model, year, city })
            });
            return await response.json();
        } catch (error) {
            console.error('Quote fetch error:', error);
            return { success: false, error: 'Failed to fetch quotes' };
        }
    }

    /**
     * Get all available vehicle brands
     */
    async function getBrands() {
        try {
            const response = await fetch(`${API_BASE}/api/vehicle/brands`);
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Failed to fetch brands' };
        }
    }

    /**
     * Get models for a specific brand
     */
    async function getModels(brand) {
        try {
            const response = await fetch(`${API_BASE}/api/vehicle/models/${encodeURIComponent(brand)}`);
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Failed to fetch models' };
        }
    }

    /**
     * Calculate premium with custom IDV and NCB
     */
    async function calculatePremium(idv, ncb, cc, policyType) {
        try {
            const response = await fetch(`${API_BASE}/api/premium/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idv, ncb, cc, policyType })
            });
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Failed to calculate premium' };
        }
    }

    /**
     * Get RTO information by code
     */
    async function getRTOInfo(code) {
        try {
            const response = await fetch(`${API_BASE}/api/rto/${encodeURIComponent(code)}`);
            return await response.json();
        } catch (error) {
            return { success: false, error: 'Failed to fetch RTO info' };
        }
    }

    /**
     * Parse vehicle registration number into components
     */
    function parseVehicleNumber(regNumber) {
        const clean = regNumber.replace(/\s/g, '').toUpperCase();
        if (clean.length < 8) throw new Error('Invalid registration number');
        return {
            stateCode: clean.substring(0, 2),
            districtCode: clean.substring(2, 4),
            series: clean.substring(4, 6),
            number: clean.substring(6),
            clean
        };
    }

    /**
     * Format registration number with spaces: MH02AB1234 -> MH 02 AB 1234
     */
    function formatRegNumber(regNumber) {
        const clean = regNumber.replace(/\s/g, '').toUpperCase();
        if (clean.length >= 8) {
            return `${clean.substring(0, 2)} ${clean.substring(2, 4)} ${clean.substring(4, 6)} ${clean.substring(6)}`;
        }
        return clean;
    }

    /**
     * Validate registration number format
     */
    function isValidRegNumber(regNumber) {
        const clean = regNumber.replace(/\s/g, '').toUpperCase();
        return /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{1,4}$/.test(clean);
    }

    // ===== Public API =====
    return {
        fetchVehicleDataRealTime,
        getQuotesByDetails,
        getBrands,
        getModels,
        calculatePremium,
        getRTOInfo,
        parseVehicleNumber,
        formatRegNumber,
        isValidRegNumber,
        API_BASE
    };
})();

// Export to window for use in HTML pages
window.VehicleAPI = VehicleAPI;
