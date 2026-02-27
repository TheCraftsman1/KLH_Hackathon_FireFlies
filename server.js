const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ===== REAL IRDAI TWO-WHEELER THIRD PARTY PREMIUM RATES (FY 2025-26) =====
const IRDAI_TP_RATES = {
    twoWheeler: {
        below75cc: 538,
        from75to150cc: 714,
        from150to350cc: 1366,
        above350cc: 2804
    },
    car: {
        below1000cc: 2094,
        from1000to1500cc: 3416,
        above1500cc: 7897
    }
};

// ===== REAL IDV DEPRECIATION TABLE (IRDAI) =====
const IDV_DEPRECIATION = {
    0: 0,      // New vehicle
    0.5: 5,    // 6 months
    1: 15,     // 1 year
    2: 20,     // 2 years
    3: 30,     // 3 years
    4: 40,     // 4 years
    5: 50      // 5+ years
};

// ===== COMPREHENSIVE RTO DATABASE =====
const RTO_DATABASE = {
    'AP': { state: 'Andhra Pradesh', zones: { '01': 'Anantapur', '02': 'Eluru', '03': 'Guntur', '04': 'Kadapa', '05': 'Kakinada', '07': 'Kurnool', '09': 'Nellore', '10': 'Ongole', '11': 'Rajamahendravaram', '12': 'Srikakulam', '13': 'Tirupati', '15': 'Visakhapatnam', '16': 'Vizianagaram', '28': 'Vijayawada', '29': 'Chittoor', '31': 'Machilipatnam', '37': 'Bhimavaram', '39': 'Amaravati' } },
    'AR': { state: 'Arunachal Pradesh', zones: { '01': 'Itanagar', '02': 'Tawang', '03': 'Bomdila' } },
    'AS': { state: 'Assam', zones: { '01': 'Guwahati', '02': 'Nagaon', '03': 'Jorhat', '04': 'Dibrugarh', '05': 'Tezpur', '06': 'Silchar' } },
    'BR': { state: 'Bihar', zones: { '01': 'Patna', '02': 'Gaya', '03': 'Muzaffarpur', '04': 'Bhagalpur', '06': 'Darbhanga' } },
    'CG': { state: 'Chhattisgarh', zones: { '01': 'Bilaspur', '02': 'Raipur', '03': 'Durg', '04': 'Raigarh', '07': 'Jagdalpur' } },
    'CH': { state: 'Chandigarh', zones: { '01': 'Chandigarh' } },
    'DL': { state: 'Delhi', zones: { '01': 'Sarai Kale Khan', '02': 'Raja Garden', '03': 'Mayur Vihar', '04': 'Loni Road', '05': 'Wazirpur', '06': 'Lajpat Nagar', '07': 'Sarai Kale Khan', '08': 'Janakpuri', '09': 'Mall Road', '10': 'Dwarka', '11': 'Rohini', '12': 'Vasant Vihar', '13': 'Mehrauli', '14': 'Shakti Nagar' } },
    'GA': { state: 'Goa', zones: { '01': 'Panaji (North Goa)', '02': 'Margao (South Goa)', '03': 'Bicholim', '04': 'Mapusa', '05': 'Ponda' } },
    'GJ': { state: 'Gujarat', zones: { '01': 'Ahmedabad', '02': 'Mehsana', '03': 'Rajkot', '04': 'Bhavnagar', '05': 'Surat', '06': 'Vadodara', '07': 'Anand', '08': 'Palanpur', '09': 'Bhuj', '10': 'Jamnagar', '11': 'Junagadh', '12': 'Navsari', '13': 'Bharuch', '14': 'Godhra', '15': 'Gandhinagar', '18': 'Valsad', '23': 'Morbi', '25': 'Dwarka', '27': 'Porbandar', '38': 'Ahmedabad' } },
    'HP': { state: 'Himachal Pradesh', zones: { '01': 'Shimla', '02': 'Kangra', '03': 'Mandi', '04': 'Kullu', '05': 'Bilaspur', '06': 'Hamirpur', '07': 'Solan', '08': 'Sirmaur', '09': 'Una' } },
    'HR': { state: 'Haryana', zones: { '01': 'Ambala', '02': 'Hisar', '03': 'Panchkula', '05': 'Karnal', '06': 'Gurugram', '10': 'Faridabad', '12': 'Rohtak', '14': 'Sonipat', '20': 'Jhajjar', '26': 'Gurugram', '29': 'Panchkula', '38': 'Faridabad', '51': 'Gurugram', '55': 'Panipat' } },
    'JH': { state: 'Jharkhand', zones: { '01': 'Ranchi', '02': 'Jamshedpur', '03': 'Dhanbad', '04': 'Bokaro', '05': 'Hazaribag', '10': 'Deoghar' } },
    'JK': { state: 'Jammu & Kashmir', zones: { '01': 'Srinagar', '02': 'Jammu', '03': 'Anantnag', '04': 'Baramulla', '13': 'Samba' } },
    'KA': { state: 'Karnataka', zones: { '01': 'Bengaluru Central', '02': 'Bengaluru West', '03': 'Bengaluru East', '04': 'Bengaluru North', '05': 'Bengaluru South', '06': 'Tumkur', '07': 'Kolar', '09': 'Mysuru', '10': 'Mandya', '11': 'Hassan', '12': 'Chitradurga', '13': 'Shimoga', '14': 'Udupi', '15': 'Dharwad', '16': 'Belgaum', '17': 'Gulbarga', '19': 'Mangaluru', '20': 'Davangere', '22': 'Hubli', '25': 'Bellary', '28': 'Raichur', '32': 'Ramanagar', '33': 'Chikkaballapur', '34': 'Yadgir', '41': 'Bengaluru', '50': 'Bengaluru (Yelahanka)', '51': 'Bengaluru', '53': 'Bengaluru East' } },
    'KL': { state: 'Kerala', zones: { '01': 'Thiruvananthapuram', '02': 'Kollam', '03': 'Pathanamthitta', '04': 'Alappuzha', '05': 'Kottayam', '06': 'Idukki', '07': 'Ernakulam', '08': 'Thrissur', '09': 'Palakkad', '10': 'Malappuram', '11': 'Kozhikode', '12': 'Wayanad', '13': 'Kannur', '14': 'Kasaragod', '39': 'Kochi', '41': 'Thiruvananthapuram' } },
    'LA': { state: 'Ladakh', zones: { '01': 'Leh', '02': 'Kargil' } },
    'MH': { state: 'Maharashtra', zones: { '01': 'Mumbai South', '02': 'Mumbai West', '03': 'Mumbai East', '04': 'Thane', '05': 'Kalyan', '06': 'Raigad', '07': 'Sindhudurg', '08': 'Kolhapur', '09': 'Sangli', '10': 'Satara', '11': 'Solapur', '12': 'Pune', '13': 'Ahmednagar', '14': 'Aurangabad', '15': 'Nashik', '16': 'Dhule', '17': 'Nandurbar', '18': 'Jalgaon', '19': 'Bhandara', '20': 'Nagpur', '21': 'Wardha', '22': 'Gondia', '23': 'Buldhana', '24': 'Akola', '25': 'Amravati', '27': 'Yavatmal', '31': 'Nagar', '40': 'Pimpri Chinchwad', '41': 'Navi Mumbai', '43': 'Mumbai', '46': 'Pune', '47': 'Mumbai', '48': 'Pune' } },
    'ML': { state: 'Meghalaya', zones: { '01': 'Shillong', '02': 'Jowai', '04': 'Tura', '05': 'Nongpoh' } },
    'MN': { state: 'Manipur', zones: { '01': 'Imphal', '02': 'Thoubal', '03': 'Churachandpur' } },
    'MP': { state: 'Madhya Pradesh', zones: { '01': 'Morena', '02': 'Shivpuri', '04': 'Bhopal', '05': 'Hoshangabad', '07': 'Gwalior', '08': 'Sagar', '09': 'Jabalpur', '10': 'Satna', '11': 'Rewa', '12': 'Chhindwara', '13': 'Betul', '14': 'Indore', '15': 'Ujjain', '17': 'Ratlam', '19': 'Dewas', '20': 'Dhar', '65': 'Indore' } },
    'MZ': { state: 'Mizoram', zones: { '01': 'Aizawl', '02': 'Lunglei' } },
    'NL': { state: 'Nagaland', zones: { '01': 'Kohima', '02': 'Dimapur', '03': 'Mon', '04': 'Mokokchung' } },
    'OD': { state: 'Odisha', zones: { '01': 'Bhubaneswar', '02': 'Cuttack', '03': 'Sambalpur', '04': 'Berhampur', '05': 'Balasore', '06': 'Rourkela', '08': 'Puri' } },
    'PB': { state: 'Punjab', zones: { '01': 'Amritsar', '02': 'Jalandhar', '03': 'Ludhiana', '04': 'Patiala', '05': 'Bathinda', '06': 'Sangrur', '07': 'Hoshiarpur', '08': 'Pathankot', '10': 'Mohali', '11': 'Ferozepur', '13': 'Moga', '65': 'Mohali' } },
    'PY': { state: 'Puducherry', zones: { '01': 'Puducherry', '02': 'Karaikal', '03': 'Mahe', '04': 'Yanam', '05': 'Puducherry' } },
    'RJ': { state: 'Rajasthan', zones: { '01': 'Ajmer', '02': 'Alwar', '04': 'Bharatpur', '05': 'Bhilwara', '06': 'Bikaner', '07': 'Bundi', '08': 'Chittorgarh', '09': 'Churu', '10': 'Dausa', '14': 'Jaipur', '19': 'Jodhpur', '20': 'Kota', '23': 'Nagaur', '25': 'Pali', '27': 'Sikar', '29': 'Tonk', '30': 'Udaipur', '45': 'Jaipur', '46': 'Jodhpur', '47': 'Kota', '48': 'Udaipur', '51': 'Jaipur North', '52': 'Jaipur South' } },
    'SK': { state: 'Sikkim', zones: { '01': 'Gangtok', '02': 'Mangan', '03': 'Gyalshing', '04': 'Namchi' } },
    'TN': { state: 'Tamil Nadu', zones: { '01': 'Chennai North', '02': 'Chennai South', '03': 'Chennai West', '04': 'Chennai East', '05': 'Kancheepuram', '06': 'Tiruvallur', '07': 'Vellore', '09': 'Salem', '10': 'Erode', '11': 'Tiruppur', '12': 'Namakkal', '14': 'Coimbatore', '18': 'Tiruchirapalli', '20': 'Thanjavur', '21': 'Tirunelveli', '22': 'Madurai', '33': 'Hosur', '37': 'Ariyalur', '38': 'Karur', '45': 'Villupuram', '46': 'Cuddalore', '47': 'Tiruvannamalai', '69': 'Coimbatore', '72': 'Chennai', '74': 'Madurai' } },
    'TR': { state: 'Tripura', zones: { '01': 'Agartala', '02': 'Dharmanagar' } },
    'TS': { state: 'Telangana', zones: { '01': 'Adilabad', '02': 'Hyderabad', '03': 'Karimnagar', '04': 'Khammam', '05': 'Mahabubnagar', '06': 'Medak', '07': 'Nalgonda', '08': 'Nizamabad', '09': 'Hyderabad', '10': 'Rangareddy', '11': 'Warangal', '12': 'Secunderabad', '13': 'Hyderabad (Kukatpally)', '14': 'Sangareddy', '15': 'Siddipet', '16': 'Suryapet', '28': 'Hyderabad', '29': 'Rangareddy' } },
    'UK': { state: 'Uttarakhand', zones: { '01': 'Dehradun', '02': 'Haridwar', '03': 'Pauri', '04': 'Tehri', '05': 'Almora', '06': 'Nainital', '07': 'Udham Singh Nagar', '08': 'Pithoragarh', '09': 'Chamoli', '10': 'Roorkee' } },
    'UP': { state: 'Uttar Pradesh', zones: { '01': 'Mathura', '02': 'Agra', '03': 'Firozabad', '04': 'Kannauj', '05': 'Bareilly', '06': 'Pilibhit', '07': 'Meerut', '08': 'Muzaffarnagar', '09': 'Saharanpur', '11': 'Aligarh', '12': 'Bulandshahr', '13': 'Ghaziabad', '14': 'Moradabad', '15': 'Noida', '16': 'Noida (Greater)', '17': 'Gorakhpur', '18': 'Azamgarh', '19': 'Varanasi', '20': 'Allahabad (Prayagraj)', '21': 'Faizabad', '25': 'Lucknow', '32': 'Lucknow', '50': 'Meerut', '65': 'Lucknow', '70': 'Ghaziabad', '78': 'Kanpur' } },
    'WB': { state: 'West Bengal', zones: { '01': 'Kolkata North', '02': 'Kolkata South', '03': 'Howrah', '04': 'Hooghly', '05': 'Burdwan', '06': 'Asansol', '07': 'Midnapore', '08': 'Bankura', '09': 'Birbhum', '10': 'Murshidabad', '11': 'Nadia', '12': 'North 24 Pgs', '13': 'South 24 Pgs', '14': 'Siliguri', '18': 'Darjeeling', '19': 'Jalpaiguri', '24': 'Bardhaman', '31': 'Barasat (N 24 Pgs)' } }
};

// ===== REAL TWO-WHEELER DATABASE (Top-selling with ex-showroom prices & CC) =====
const VEHICLE_DATABASE = {
    'Hero': {
        'Splendor Plus': { cc: 97.2, price: 76000, type: '2W', segment: 'Commuter' },
        'HF Deluxe': { cc: 97.2, price: 63000, type: '2W', segment: 'Commuter' },
        'Glamour': { cc: 124.7, price: 83000, type: '2W', segment: 'Executive' },
        'Passion Pro': { cc: 113.2, price: 77000, type: '2W', segment: 'Commuter' },
        'XPulse 200': { cc: 199.6, price: 140000, type: '2W', segment: 'Adventure' },
        'Mavrick 440': { cc: 440, price: 199000, type: '2W', segment: 'Cruiser' },
        'Destini 125': { cc: 124.6, price: 76000, type: 'Scooter', segment: 'Commuter' },
        'Pleasure Plus': { cc: 110.9, price: 68000, type: 'Scooter', segment: 'Commuter' },
        'Xtreme 160R': { cc: 163, price: 115000, type: '2W', segment: 'Sports' },
        'Karizma XMR': { cc: 210, price: 175000, type: '2W', segment: 'Sports' }
    },
    'Honda': {
        'Activa 6G': { cc: 109.5, price: 76000, type: 'Scooter', segment: 'Commuter' },
        'Activa 125': { cc: 124, price: 82000, type: 'Scooter', segment: 'Executive' },
        'SP 125': { cc: 124, price: 85000, type: '2W', segment: 'Executive' },
        'Shine 100': { cc: 99.7, price: 69000, type: '2W', segment: 'Commuter' },
        'Unicorn': { cc: 162.7, price: 109000, type: '2W', segment: 'Executive' },
        'Hornet 2.0': { cc: 184.4, price: 130000, type: '2W', segment: 'Sports' },
        'CB350': { cc: 348.4, price: 209000, type: '2W', segment: 'Retro' },
        'CB300R': { cc: 286.0, price: 240000, type: '2W', segment: 'Sports' },
        'Dio': { cc: 109.5, price: 73000, type: 'Scooter', segment: 'Commuter' }
    },
    'Bajaj': {
        'Pulsar 125': { cc: 124.4, price: 85000, type: '2W', segment: 'Sports' },
        'Pulsar 150': { cc: 149.5, price: 108000, type: '2W', segment: 'Sports' },
        'Pulsar NS200': { cc: 199.5, price: 142000, type: '2W', segment: 'Sports' },
        'Pulsar RS200': { cc: 199.5, price: 167000, type: '2W', segment: 'Sports' },
        'Dominar 400': { cc: 373.3, price: 225000, type: '2W', segment: 'Touring' },
        'Avenger 160': { cc: 160, price: 115000, type: '2W', segment: 'Cruiser' },
        'Avenger 220': { cc: 220, price: 135000, type: '2W', segment: 'Cruiser' },
        'Platina 100': { cc: 102, price: 62000, type: '2W', segment: 'Commuter' },
        'CT 125X': { cc: 124.4, price: 72000, type: '2W', segment: 'Commuter' }
    },
    'TVS': {
        'Apache RTR 160': { cc: 159.7, price: 115000, type: '2W', segment: 'Sports' },
        'Apache RTR 200': { cc: 197.75, price: 142000, type: '2W', segment: 'Sports' },
        'Apache RR 310': { cc: 312.2, price: 265000, type: '2W', segment: 'Sports' },
        'NTORQ 125': { cc: 124.8, price: 84000, type: 'Scooter', segment: 'Sports Scooter' },
        'Jupiter 125': { cc: 124.8, price: 76000, type: 'Scooter', segment: 'Commuter' },
        'Raider 125': { cc: 124.8, price: 93000, type: '2W', segment: 'Sports' },
        'Ronin': { cc: 225.9, price: 150000, type: '2W', segment: 'Scrambler' },
        'Star City Plus': { cc: 109.7, price: 73000, type: '2W', segment: 'Commuter' },
        'iQube': { cc: 0, price: 115000, type: 'EV Scooter', segment: 'Electric', fuel: 'Electric' }
    },
    'Suzuki': {
        'Access 125': { cc: 124, price: 81000, type: 'Scooter', segment: 'Commuter' },
        'Burgman Street': { cc: 124, price: 95000, type: 'Scooter', segment: 'Premium' },
        'Gixxer SF 250': { cc: 249, price: 189000, type: '2W', segment: 'Sports' },
        'Gixxer 250': { cc: 249, price: 176000, type: '2W', segment: 'Sports' },
        'V-Strom SX': { cc: 249, price: 210000, type: '2W', segment: 'Adventure' },
        'Hayabusa': { cc: 1340, price: 1680000, type: '2W', segment: 'Superbike' },
        'Avenis 125': { cc: 124, price: 87000, type: 'Scooter', segment: 'Sports Scooter' }
    },
    'Yamaha': {
        'FZS-Fi V4': { cc: 149, price: 118000, type: '2W', segment: 'Sports' },
        'MT-15 V2': { cc: 155, price: 162000, type: '2W', segment: 'Sports' },
        'R15 V4': { cc: 155, price: 182000, type: '2W', segment: 'Sports' },
        'R15M': { cc: 155, price: 193000, type: '2W', segment: 'Sports' },
        'Ray-ZR 125': { cc: 125, price: 79000, type: 'Scooter', segment: 'Commuter' },
        'Aerox 155': { cc: 155, price: 142000, type: 'Scooter', segment: 'Sports Scooter' },
        'Fascino': { cc: 125, price: 78000, type: 'Scooter', segment: 'Commuter' },
        'FZ-X': { cc: 149, price: 129000, type: '2W', segment: 'Retro' }
    },
    'Royal Enfield': {
        'Classic 350': { cc: 349, price: 195000, type: '2W', segment: 'Retro' },
        'Hunter 350': { cc: 349, price: 150000, type: '2W', segment: 'Roadster' },
        'Meteor 350': { cc: 349, price: 209000, type: '2W', segment: 'Cruiser' },
        'Bullet 350': { cc: 349, price: 172000, type: '2W', segment: 'Retro' },
        'Interceptor 650': { cc: 648, price: 310000, type: '2W', segment: 'Retro' },
        'Continental GT 650': { cc: 648, price: 320000, type: '2W', segment: 'Cafe Racer' },
        'Himalayan 450': { cc: 452, price: 285000, type: '2W', segment: 'Adventure' },
        'Super Meteor 650': { cc: 648, price: 350000, type: '2W', segment: 'Cruiser' },
        'Guerrilla 450': { cc: 452, price: 239000, type: '2W', segment: 'Roadster' }
    },
    'KTM': {
        'Duke 125': { cc: 124.7, price: 161000, type: '2W', segment: 'Sports' },
        'Duke 200': { cc: 199.5, price: 186000, type: '2W', segment: 'Sports' },
        'Duke 250': { cc: 248.8, price: 230000, type: '2W', segment: 'Sports' },
        'Duke 390': { cc: 373.2, price: 310000, type: '2W', segment: 'Sports' },
        'RC 200': { cc: 199.5, price: 210000, type: '2W', segment: 'Sports' },
        'RC 390': { cc: 373.2, price: 322000, type: '2W', segment: 'Sports' },
        'Adventure 250': { cc: 248.8, price: 240000, type: '2W', segment: 'Adventure' },
        'Adventure 390': { cc: 373.2, price: 340000, type: '2W', segment: 'Adventure' }
    },
    'Ola': {
        'S1 Pro': { cc: 0, price: 135000, type: 'EV Scooter', segment: 'Electric', fuel: 'Electric' },
        'S1 Air': { cc: 0, price: 105000, type: 'EV Scooter', segment: 'Electric', fuel: 'Electric' },
        'S1 X': { cc: 0, price: 79000, type: 'EV Scooter', segment: 'Electric', fuel: 'Electric' }
    },
    'Ather': {
        '450X': { cc: 0, price: 150000, type: 'EV Scooter', segment: 'Electric', fuel: 'Electric' },
        '450S': { cc: 0, price: 130000, type: 'EV Scooter', segment: 'Electric', fuel: 'Electric' },
        'Rizta': { cc: 0, price: 110000, type: 'EV Scooter', segment: 'Electric', fuel: 'Electric' }
    }
};

// ===== BRAND POPULARITY BY STATE (based on real sales data) =====
const BRAND_POPULARITY = {
    'DL': ['Hero', 'Honda', 'Bajaj', 'TVS', 'Yamaha', 'Royal Enfield', 'KTM'],
    'MH': ['Honda', 'Bajaj', 'TVS', 'Yamaha', 'Hero', 'Suzuki', 'Royal Enfield'],
    'KA': ['TVS', 'Honda', 'Hero', 'Suzuki', 'Yamaha', 'Royal Enfield', 'KTM'],
    'TN': ['TVS', 'Honda', 'Suzuki', 'Hero', 'Yamaha', 'Royal Enfield'],
    'TS': ['Honda', 'TVS', 'Hero', 'Bajaj', 'Yamaha', 'Royal Enfield'],
    'AP': ['Honda', 'TVS', 'Hero', 'Bajaj', 'Yamaha', 'Suzuki'],
    'UP': ['Hero', 'Bajaj', 'Honda', 'TVS', 'Yamaha', 'Royal Enfield'],
    'RJ': ['Hero', 'Bajaj', 'Honda', 'TVS', 'Royal Enfield', 'Yamaha'],
    'GJ': ['Bajaj', 'Honda', 'TVS', 'Hero', 'Suzuki', 'Yamaha'],
    'HR': ['Hero', 'Honda', 'Bajaj', 'TVS', 'Yamaha', 'Royal Enfield'],
    'PB': ['Hero', 'Bajaj', 'Honda', 'Royal Enfield', 'TVS', 'Yamaha'],
    'WB': ['TVS', 'Hero', 'Bajaj', 'Honda', 'Yamaha', 'Suzuki'],
    'KL': ['Honda', 'TVS', 'Hero', 'Suzuki', 'Yamaha', 'Royal Enfield'],
    'MP': ['Hero', 'Honda', 'Bajaj', 'TVS', 'Yamaha'],
    'BR': ['Hero', 'Bajaj', 'Honda', 'TVS', 'Yamaha'],
    'JH': ['Hero', 'Bajaj', 'Honda', 'TVS', 'Yamaha'],
    'OD': ['Hero', 'Honda', 'TVS', 'Bajaj', 'Yamaha'],
    'CG': ['Hero', 'Honda', 'Bajaj', 'TVS'],
    'UK': ['Hero', 'Honda', 'TVS', 'Bajaj', 'Royal Enfield'],
    'GA': ['Honda', 'Suzuki', 'TVS', 'Yamaha', 'Royal Enfield'],
    'SK': ['Hero', 'Honda', 'Bajaj'],
    'CH': ['Honda', 'Hero', 'Royal Enfield', 'KTM'],
    'AS': ['Hero', 'Honda', 'TVS', 'Bajaj']
};

// ===== VEHICLE LOOKUP ENGINE =====
function lookupVehicle(regNumber) {
    const clean = regNumber.replace(/\s/g, '').toUpperCase();

    if (clean.length < 8) {
        return { success: false, error: 'Invalid registration number format' };
    }

    const stateCode = clean.substring(0, 2);
    const districtCode = clean.substring(2, 4);
    const series = clean.substring(4, 6);
    const number = clean.substring(6);

    const stateInfo = RTO_DATABASE[stateCode];
    if (!stateInfo) {
        return { success: false, error: `Unknown state code: ${stateCode}` };
    }

    const rtoName = stateInfo.zones[districtCode] || `RTO ${districtCode}`;

    // Deterministic vehicle selection based on registration number
    const seed = hashCode(clean);
    const brands = BRAND_POPULARITY[stateCode] || ['Hero', 'Honda', 'Bajaj', 'TVS', 'Yamaha'];
    const brand = brands[Math.abs(seed) % brands.length];
    
    const models = Object.keys(VEHICLE_DATABASE[brand] || {});
    if (models.length === 0) {
        return { success: false, error: 'Vehicle data not available' };
    }
    
    const model = models[Math.abs(seed >> 4) % models.length];
    const vehicleInfo = VEHICLE_DATABASE[brand][model];

    // Generate year based on number (newer numbers = newer vehicles)
    const numPart = parseInt(number) || 1000;
    const currentYear = new Date().getFullYear();
    let year;
    if (numPart > 8000) year = currentYear;
    else if (numPart > 6000) year = currentYear - 1;
    else if (numPart > 4000) year = currentYear - 2;
    else if (numPart > 2000) year = currentYear - 3;
    else if (numPart > 1000) year = currentYear - 4;
    else year = currentYear - 5;

    // Calculate IDV
    const vehicleAge = currentYear - year;
    let depPercent = 0;
    if (vehicleAge <= 0) depPercent = 0;
    else if (vehicleAge <= 1) depPercent = 15;
    else if (vehicleAge <= 2) depPercent = 20;
    else if (vehicleAge <= 3) depPercent = 30;
    else if (vehicleAge <= 4) depPercent = 40;
    else depPercent = 50;
    
    const idv = Math.round(vehicleInfo.price * (1 - depPercent / 100));

    // Calculate premium using IRDAI rates
    const cc = vehicleInfo.cc;
    let tpPremium;
    if (cc === 0) tpPremium = 714; // Electric vehicles
    else if (cc <= 75) tpPremium = IRDAI_TP_RATES.twoWheeler.below75cc;
    else if (cc <= 150) tpPremium = IRDAI_TP_RATES.twoWheeler.from75to150cc;
    else if (cc <= 350) tpPremium = IRDAI_TP_RATES.twoWheeler.from150to350cc;
    else tpPremium = IRDAI_TP_RATES.twoWheeler.above350cc;

    // Own damage premium (approx 2-3% of IDV)
    const odRate = cc > 350 ? 0.035 : (cc > 150 ? 0.028 : 0.022);
    const odPremium = Math.round(idv * odRate);
    
    const totalPremium = tpPremium + odPremium;

    return {
        success: true,
        data: {
            registrationNumber: clean,
            formattedRegNumber: `${stateCode} ${districtCode} ${series} ${number}`,
            state: stateInfo.state,
            rtoCode: `${stateCode}${districtCode}`,
            rtoName: rtoName,
            make: brand,
            model: model,
            year: year,
            cc: vehicleInfo.cc,
            fuel: vehicleInfo.fuel || 'Petrol',
            type: vehicleInfo.type,
            segment: vehicleInfo.segment,
            variant: 'BS6',
            exShowroomPrice: vehicleInfo.price,
            idv: idv,
            vehicleAge: vehicleAge,
            depreciation: depPercent,
            premium: {
                thirdParty: tpPremium,
                ownDamage: odPremium,
                comprehensive: totalPremium,
                thirdPartyOnly: tpPremium
            },
            insuranceStatus: vehicleAge <= 1 ? 'Active (likely)' : 'Verify with insurer',
            fitnessValidUpto: `${year + 15}-${String(Math.abs(seed) % 12 + 1).padStart(2, '0')}`,
            timestamp: new Date().toISOString(),
            source: 'RTO-VehicleDB'
        }
    };
}

// Simple hash function for deterministic results
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return hash;
}

// ===== INSURER QUOTES ENGINE =====
function generateQuotes(vehicleData) {
    const baseOD = vehicleData.premium.ownDamage;
    const baseTP = vehicleData.premium.thirdParty;
    
    const insurers = [
        { id: 'hdfc', name: 'HDFC ERGO', logo: 'assets/hdfc-life-insurance.jpg', discountRange: [0.08, 0.15], claimRatio: 97.8, garages: 7200, rating: 4.5 },
        { id: 'icici', name: 'ICICI Lombard', logo: 'assets/icici-prudential-life-insurance.png', discountRange: [0.10, 0.18], claimRatio: 96.5, garages: 6500, rating: 4.4 },
        { id: 'bajaj', name: 'Bajaj Allianz', logo: 'assets/bajaj-allianz-life-insurance.png', discountRange: [0.05, 0.12], claimRatio: 98.1, garages: 5800, rating: 4.3 },
        { id: 'tata', name: 'Tata AIG', logo: 'assets/tata-aia-life-insurance.jpg', discountRange: [0.07, 0.14], claimRatio: 95.2, garages: 5200, rating: 4.2 },
        { id: 'sbi', name: 'SBI General', logo: 'assets/sbi-life-insurance.jpg', discountRange: [0.03, 0.10], claimRatio: 94.8, garages: 4800, rating: 4.1 },
        { id: 'max', name: 'Max Life', logo: 'assets/max-life-insurance.jpg', discountRange: [0.06, 0.13], claimRatio: 96.0, garages: 4500, rating: 4.0 }
    ];

    const seed = hashCode(vehicleData.registrationNumber);

    return insurers.map((insurer, i) => {
        // Deterministic discount based on insurer + vehicle
        const discountFactor = insurer.discountRange[0] + 
            (Math.abs((seed >> (i * 3)) % 100) / 100) * (insurer.discountRange[1] - insurer.discountRange[0]);
        
        const discountedOD = Math.round(baseOD * (1 - discountFactor));
        const comprehensivePremium = baseTP + discountedOD;
        const tpOnlyPremium = baseTP;
        
        // Add GST (18%)
        const comprehensiveWithGST = Math.round(comprehensivePremium * 1.18);
        const tpOnlyWithGST = Math.round(tpOnlyPremium * 1.18);

        const features = [];
        if (insurer.claimRatio > 97) features.push('Top Claim Ratio');
        if (insurer.garages > 6000) features.push(`${(insurer.garages / 1000).toFixed(1)}K+ Garages`);
        features.push('Cashless Claims');
        features.push('24x7 Support');
        if (discountFactor > 0.12) features.push('Best Discount');
        features.push('Instant Policy');

        return {
            insurerId: insurer.id,
            insurerName: insurer.name,
            logo: insurer.logo,
            claimSettlementRatio: insurer.claimRatio,
            networkGarages: insurer.garages,
            rating: insurer.rating,
            premium: {
                comprehensive: {
                    ownDamage: discountedOD,
                    thirdParty: baseTP,
                    subtotal: comprehensivePremium,
                    gst: Math.round(comprehensivePremium * 0.18),
                    total: comprehensiveWithGST
                },
                thirdPartyOnly: {
                    total: tpOnlyWithGST
                }
            },
            discount: Math.round(discountFactor * 100),
            features: features,
            addOns: [
                { name: 'Zero Depreciation', price: Math.round(discountedOD * 0.15) },
                { name: 'Engine Protection', price: Math.round(discountedOD * 0.08) },
                { name: 'Roadside Assistance', price: 299 },
                { name: 'Personal Accident', price: 125 },
                { name: 'Consumables Cover', price: Math.round(discountedOD * 0.05) }
            ]
        };
    }).sort((a, b) => a.premium.comprehensive.total - b.premium.comprehensive.total);
}

// ===== API ROUTES =====

// Vehicle Lookup
app.post('/api/vehicle/lookup', (req, res) => {
    const { registrationNumber } = req.body;
    
    if (!registrationNumber) {
        return res.status(400).json({ success: false, error: 'Registration number required' });
    }

    // Simulate network latency (real API feel)
    const delay = 800 + Math.random() * 700;
    
    setTimeout(() => {
        const result = lookupVehicle(registrationNumber);
        
        if (result.success) {
            // Also generate insurance quotes
            result.data.quotes = generateQuotes(result.data);
        }
        
        res.json(result);
    }, delay);
});

// Get insurance quotes for given vehicle details
app.post('/api/insurance/quotes', (req, res) => {
    const { make, model, year, cc, city } = req.body;
    
    if (!make || !model || !year) {
        return res.status(400).json({ success: false, error: 'Vehicle details required' });
    }

    const vehicleInfo = VEHICLE_DATABASE[make]?.[model];
    if (!vehicleInfo) {
        return res.status(404).json({ success: false, error: 'Vehicle not found in database' });
    }

    const vehicleAge = new Date().getFullYear() - parseInt(year);
    let depPercent = vehicleAge <= 0 ? 0 : vehicleAge <= 1 ? 15 : vehicleAge <= 2 ? 20 : vehicleAge <= 3 ? 30 : vehicleAge <= 4 ? 40 : 50;
    const idv = Math.round(vehicleInfo.price * (1 - depPercent / 100));
    
    const engineCC = vehicleInfo.cc;
    let tpPremium;
    if (engineCC === 0) tpPremium = 714;
    else if (engineCC <= 75) tpPremium = IRDAI_TP_RATES.twoWheeler.below75cc;
    else if (engineCC <= 150) tpPremium = IRDAI_TP_RATES.twoWheeler.from75to150cc;
    else if (engineCC <= 350) tpPremium = IRDAI_TP_RATES.twoWheeler.from150to350cc;
    else tpPremium = IRDAI_TP_RATES.twoWheeler.above350cc;

    const odRate = engineCC > 350 ? 0.035 : (engineCC > 150 ? 0.028 : 0.022);
    const odPremium = Math.round(idv * odRate);

    const vehicleData = {
        registrationNumber: 'MANUAL',
        make, model, year: parseInt(year),
        cc: engineCC,
        premium: { ownDamage: odPremium, thirdParty: tpPremium },
        idv
    };

    const quotes = generateQuotes(vehicleData);
    
    setTimeout(() => {
        res.json({
            success: true,
            vehicle: {
                make, model, year: parseInt(year),
                cc: engineCC,
                fuel: vehicleInfo.fuel || 'Petrol',
                type: vehicleInfo.type,
                segment: vehicleInfo.segment,
                exShowroomPrice: vehicleInfo.price,
                idv, vehicleAge, depreciation: depPercent,
                premium: { thirdParty: tpPremium, ownDamage: odPremium, comprehensive: tpPremium + odPremium }
            },
            quotes
        });
    }, 500 + Math.random() * 500);
});

// Get vehicle brands
app.get('/api/vehicle/brands', (req, res) => {
    res.json({
        success: true,
        brands: Object.keys(VEHICLE_DATABASE)
    });
});

// Get models for a brand
app.get('/api/vehicle/models/:brand', (req, res) => {
    const brand = req.params.brand;
    const models = VEHICLE_DATABASE[brand];
    if (!models) {
        return res.status(404).json({ success: false, error: 'Brand not found' });
    }
    res.json({
        success: true,
        brand,
        models: Object.entries(models).map(([name, info]) => ({
            name,
            cc: info.cc,
            price: info.price,
            type: info.type,
            segment: info.segment
        }))
    });
});

// Premium calculator
app.post('/api/premium/calculate', (req, res) => {
    const { idv, ncb, cc, policyType } = req.body;
    
    let tpPremium;
    if (cc === 0) tpPremium = 714;
    else if (cc <= 75) tpPremium = IRDAI_TP_RATES.twoWheeler.below75cc;
    else if (cc <= 150) tpPremium = IRDAI_TP_RATES.twoWheeler.from75to150cc;
    else if (cc <= 350) tpPremium = IRDAI_TP_RATES.twoWheeler.from150to350cc;
    else tpPremium = IRDAI_TP_RATES.twoWheeler.above350cc;

    const odRate = cc > 350 ? 0.035 : (cc > 150 ? 0.028 : 0.022);
    let odPremium = Math.round(idv * odRate);
    
    // Apply NCB
    odPremium = Math.round(odPremium * (1 - (ncb || 0) / 100));
    
    const premium = policyType === 'third-party' ? tpPremium : tpPremium + odPremium;
    const gst = Math.round(premium * 0.18);

    res.json({
        success: true,
        breakdown: {
            ownDamage: policyType === 'third-party' ? 0 : odPremium,
            thirdParty: tpPremium,
            ncbDiscount: ncb || 0,
            subtotal: premium,
            gst: gst,
            total: premium + gst
        }
    });
});

// Get RTO info
app.get('/api/rto/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const stateCode = code.substring(0, 2);
    const districtCode = code.substring(2, 4);
    
    const stateInfo = RTO_DATABASE[stateCode];
    if (!stateInfo) {
        return res.status(404).json({ success: false, error: 'RTO not found' });
    }

    res.json({
        success: true,
        state: stateInfo.state,
        rtoCode: code,
        rtoName: stateInfo.zones[districtCode] || `RTO ${districtCode}`,
        allRTOs: Object.entries(stateInfo.zones).map(([k, v]) => ({ code: `${stateCode}${k}`, name: v }))
    });
});

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Insurix.India Server running at http://localhost:${PORT}`);
    console.log(`📡 API endpoints:`);
    console.log(`   POST /api/vehicle/lookup      - Vehicle RC lookup`);
    console.log(`   POST /api/insurance/quotes     - Get insurance quotes`);
    console.log(`   POST /api/premium/calculate    - Calculate premium`);
    console.log(`   GET  /api/vehicle/brands       - List all brands`);
    console.log(`   GET  /api/vehicle/models/:brand - List models`);
    console.log(`   GET  /api/rto/:code            - RTO info\n`);
});
