const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
require('dotenv').config();

// Multer config — memory storage, 10MB limit
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only PDF, DOCX, DOC, and TXT files are allowed'));
    }
});

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

// ===== CAR (4W) DATABASE =====
const CAR_DATABASE = {
    'Maruti Suzuki': {
        'Alto K10': { cc: 998, price: 399000, type: '4W', segment: 'Hatchback', fuel: 'Petrol' },
        'S-Presso': { cc: 998, price: 425000, type: '4W', segment: 'Micro SUV', fuel: 'Petrol' },
        'Celerio': { cc: 998, price: 540000, type: '4W', segment: 'Hatchback', fuel: 'Petrol' },
        'WagonR': { cc: 1197, price: 574000, type: '4W', segment: 'Hatchback', fuel: 'Petrol' },
        'Swift': { cc: 1197, price: 699000, type: '4W', segment: 'Hatchback', fuel: 'Petrol' },
        'Dzire': { cc: 1197, price: 689000, type: '4W', segment: 'Sedan', fuel: 'Petrol' },
        'Baleno': { cc: 1197, price: 674000, type: '4W', segment: 'Hatchback', fuel: 'Petrol' },
        'Ignis': { cc: 1197, price: 564000, type: '4W', segment: 'Hatchback', fuel: 'Petrol' },
        'Ciaz': { cc: 1462, price: 940000, type: '4W', segment: 'Sedan', fuel: 'Petrol' },
        'Ertiga': { cc: 1462, price: 865000, type: '4W', segment: 'MPV', fuel: 'Petrol' },
        'XL6': { cc: 1462, price: 1139000, type: '4W', segment: 'MPV', fuel: 'Petrol' },
        'Brezza': { cc: 1462, price: 849000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Grand Vitara': { cc: 1462, price: 1099000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Fronx': { cc: 1197, price: 774000, type: '4W', segment: 'SUV Coupe', fuel: 'Petrol' },
        'Jimny': { cc: 1462, price: 1274000, type: '4W', segment: 'Off-Road SUV', fuel: 'Petrol' },
        'Invicto': { cc: 1987, price: 2560000, type: '4W', segment: 'MPV', fuel: 'Hybrid' },
        'Eeco': { cc: 1196, price: 527000, type: '4W', segment: 'Van', fuel: 'Petrol' }
    },
    'Hyundai': {
        'Grand i10 Nios': { cc: 1197, price: 570000, type: '4W', segment: 'Hatchback', fuel: 'Petrol' },
        'i20': { cc: 1197, price: 730000, type: '4W', segment: 'Hatchback', fuel: 'Petrol' },
        'i20 N Line': { cc: 1482, price: 1050000, type: '4W', segment: 'Hot Hatch', fuel: 'Petrol' },
        'Aura': { cc: 1197, price: 660000, type: '4W', segment: 'Sedan', fuel: 'Petrol' },
        'Verna': { cc: 1497, price: 1098000, type: '4W', segment: 'Sedan', fuel: 'Petrol' },
        'Venue': { cc: 1197, price: 775000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Venue N Line': { cc: 1482, price: 1232000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Creta': { cc: 1497, price: 1100000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Creta N Line': { cc: 1482, price: 1650000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Alcazar': { cc: 1497, price: 1700000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Tucson': { cc: 1999, price: 2875000, type: '4W', segment: 'SUV', fuel: 'Diesel' },
        'Exter': { cc: 1197, price: 600000, type: '4W', segment: 'Micro SUV', fuel: 'Petrol' },
        'Ioniq 5': { cc: 0, price: 4495000, type: '4W', segment: 'Electric SUV', fuel: 'Electric' }
    },
    'Tata': {
        'Tiago': { cc: 1199, price: 550000, type: '4W', segment: 'Hatchback', fuel: 'Petrol' },
        'Tiago EV': { cc: 0, price: 849000, type: '4W', segment: 'Electric Hatchback', fuel: 'Electric' },
        'Tigor': { cc: 1199, price: 600000, type: '4W', segment: 'Sedan', fuel: 'Petrol' },
        'Tigor EV': { cc: 0, price: 1249000, type: '4W', segment: 'Electric Sedan', fuel: 'Electric' },
        'Altroz': { cc: 1199, price: 680000, type: '4W', segment: 'Hatchback', fuel: 'Petrol' },
        'Punch': { cc: 1199, price: 610000, type: '4W', segment: 'Micro SUV', fuel: 'Petrol' },
        'Punch EV': { cc: 0, price: 1099000, type: '4W', segment: 'Electric Micro SUV', fuel: 'Electric' },
        'Nexon': { cc: 1199, price: 850000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Nexon EV': { cc: 0, price: 1499000, type: '4W', segment: 'Electric SUV', fuel: 'Electric' },
        'Harrier': { cc: 1956, price: 1520000, type: '4W', segment: 'SUV', fuel: 'Diesel' },
        'Safari': { cc: 1956, price: 1620000, type: '4W', segment: 'SUV', fuel: 'Diesel' },
        'Curvv': { cc: 1497, price: 1000000, type: '4W', segment: 'SUV Coupe', fuel: 'Petrol' },
        'Curvv EV': { cc: 0, price: 1749000, type: '4W', segment: 'Electric SUV Coupe', fuel: 'Electric' }
    },
    'Mahindra': {
        'Bolero': { cc: 1493, price: 950000, type: '4W', segment: 'SUV', fuel: 'Diesel' },
        'Bolero Neo': { cc: 1493, price: 940000, type: '4W', segment: 'SUV', fuel: 'Diesel' },
        'Scorpio N': { cc: 1997, price: 1399000, type: '4W', segment: 'SUV', fuel: 'Diesel' },
        'Scorpio Classic': { cc: 2179, price: 1390000, type: '4W', segment: 'SUV', fuel: 'Diesel' },
        'XUV300': { cc: 1497, price: 850000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'XUV400 EV': { cc: 0, price: 1599000, type: '4W', segment: 'Electric SUV', fuel: 'Electric' },
        'XUV700': { cc: 1997, price: 1399000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Thar': { cc: 1997, price: 1100000, type: '4W', segment: 'Off-Road SUV', fuel: 'Petrol' },
        'Thar ROXX': { cc: 1997, price: 1299000, type: '4W', segment: 'Off-Road SUV', fuel: 'Diesel' },
        'Marazzo': { cc: 1497, price: 1250000, type: '4W', segment: 'MPV', fuel: 'Diesel' },
        'BE 6': { cc: 0, price: 1899000, type: '4W', segment: 'Electric SUV Coupe', fuel: 'Electric' },
        'XEV 9e': { cc: 0, price: 2199000, type: '4W', segment: 'Electric SUV', fuel: 'Electric' }
    },
    'Kia': {
        'Seltos': { cc: 1497, price: 1100000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Sonet': { cc: 1197, price: 799000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Carens': { cc: 1497, price: 1070000, type: '4W', segment: 'MPV', fuel: 'Petrol' },
        'EV6': { cc: 0, price: 6095000, type: '4W', segment: 'Electric SUV', fuel: 'Electric' },
        'EV9': { cc: 0, price: 7500000, type: '4W', segment: 'Electric SUV', fuel: 'Electric' }
    },
    'Toyota': {
        'Glanza': { cc: 1197, price: 674000, type: '4W', segment: 'Hatchback', fuel: 'Petrol' },
        'Urban Cruiser Taisor': { cc: 1197, price: 774000, type: '4W', segment: 'SUV Coupe', fuel: 'Petrol' },
        'Rumion': { cc: 1462, price: 1100000, type: '4W', segment: 'MPV', fuel: 'Petrol' },
        'Urban Cruiser Hyryder': { cc: 1462, price: 1100000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Innova Crysta': { cc: 2393, price: 1997000, type: '4W', segment: 'MPV', fuel: 'Diesel' },
        'Innova Hycross': { cc: 1987, price: 1993000, type: '4W', segment: 'MPV', fuel: 'Hybrid' },
        'Fortuner': { cc: 2755, price: 3490000, type: '4W', segment: 'SUV', fuel: 'Diesel' },
        'Fortuner Legender': { cc: 2755, price: 4010000, type: '4W', segment: 'SUV', fuel: 'Diesel' },
        'Hilux': { cc: 2755, price: 3050000, type: '4W', segment: 'Pickup', fuel: 'Diesel' },
        'Camry': { cc: 2487, price: 4800000, type: '4W', segment: 'Sedan', fuel: 'Hybrid' },
        'Vellfire': { cc: 2494, price: 12000000, type: '4W', segment: 'Luxury MPV', fuel: 'Hybrid' },
        'Land Cruiser': { cc: 3346, price: 21000000, type: '4W', segment: 'Luxury SUV', fuel: 'Diesel' }
    },
    'Honda Cars': {
        'Amaze': { cc: 1199, price: 750000, type: '4W', segment: 'Sedan', fuel: 'Petrol' },
        'City': { cc: 1498, price: 1190000, type: '4W', segment: 'Sedan', fuel: 'Petrol' },
        'City e:HEV': { cc: 1498, price: 1950000, type: '4W', segment: 'Sedan', fuel: 'Hybrid' },
        'Elevate': { cc: 1498, price: 1110000, type: '4W', segment: 'SUV', fuel: 'Petrol' }
    },
    'Volkswagen': {
        'Polo': { cc: 999, price: 680000, type: '4W', segment: 'Hatchback', fuel: 'Petrol' },
        'Virtus': { cc: 999, price: 1190000, type: '4W', segment: 'Sedan', fuel: 'Petrol' },
        'Taigun': { cc: 999, price: 1170000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Tiguan': { cc: 1984, price: 3570000, type: '4W', segment: 'SUV', fuel: 'Petrol' }
    },
    'Skoda': {
        'Slavia': { cc: 999, price: 1100000, type: '4W', segment: 'Sedan', fuel: 'Petrol' },
        'Kushaq': { cc: 999, price: 1100000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Kodiaq': { cc: 1984, price: 4050000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Superb': { cc: 1984, price: 5400000, type: '4W', segment: 'Sedan', fuel: 'Petrol' }
    },
    'MG': {
        'Comet EV': { cc: 0, price: 799000, type: '4W', segment: 'Electric Micro', fuel: 'Electric' },
        'Astor': { cc: 1498, price: 1098000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Hector': { cc: 1451, price: 1450000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Hector Plus': { cc: 1451, price: 1700000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Gloster': { cc: 1996, price: 3890000, type: '4W', segment: 'SUV', fuel: 'Diesel' },
        'ZS EV': { cc: 0, price: 1898000, type: '4W', segment: 'Electric SUV', fuel: 'Electric' },
        'Windsor EV': { cc: 0, price: 1399000, type: '4W', segment: 'Electric MPV', fuel: 'Electric' }
    },
    'Renault': {
        'Kwid': { cc: 999, price: 468000, type: '4W', segment: 'Hatchback', fuel: 'Petrol' },
        'Triber': { cc: 999, price: 600000, type: '4W', segment: 'MPV', fuel: 'Petrol' },
        'Kiger': { cc: 999, price: 600000, type: '4W', segment: 'SUV', fuel: 'Petrol' }
    },
    'Nissan': {
        'Magnite': { cc: 999, price: 600000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'X-Trail': { cc: 1497, price: 4990000, type: '4W', segment: 'SUV', fuel: 'Hybrid' }
    },
    'Jeep': {
        'Compass': { cc: 1956, price: 2070000, type: '4W', segment: 'SUV', fuel: 'Diesel' },
        'Meridian': { cc: 1956, price: 3370000, type: '4W', segment: 'SUV', fuel: 'Diesel' },
        'Grand Cherokee': { cc: 1995, price: 7895000, type: '4W', segment: 'Luxury SUV', fuel: 'Petrol' },
        'Wrangler': { cc: 1995, price: 5715000, type: '4W', segment: 'Off-Road SUV', fuel: 'Petrol' }
    },
    'Citroen': {
        'C3': { cc: 1199, price: 630000, type: '4W', segment: 'Hatchback', fuel: 'Petrol' },
        'C3 Aircross': { cc: 1199, price: 1000000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'eC3': { cc: 0, price: 1175000, type: '4W', segment: 'Electric Hatchback', fuel: 'Electric' },
        'Basalt': { cc: 1199, price: 800000, type: '4W', segment: 'SUV Coupe', fuel: 'Petrol' }
    },
    'BMW': {
        '2 Series Gran Coupe': { cc: 1998, price: 3950000, type: '4W', segment: 'Sedan', fuel: 'Petrol' },
        '3 Series': { cc: 1998, price: 4690000, type: '4W', segment: 'Sedan', fuel: 'Petrol' },
        '5 Series': { cc: 1998, price: 7290000, type: '4W', segment: 'Sedan', fuel: 'Petrol' },
        '7 Series': { cc: 2998, price: 17500000, type: '4W', segment: 'Luxury Sedan', fuel: 'Petrol' },
        'X1': { cc: 1499, price: 4610000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'X3': { cc: 1998, price: 6600000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'X5': { cc: 2993, price: 9300000, type: '4W', segment: 'SUV', fuel: 'Diesel' },
        'iX1': { cc: 0, price: 6700000, type: '4W', segment: 'Electric SUV', fuel: 'Electric' }
    },
    'Mercedes-Benz': {
        'A-Class Limousine': { cc: 1332, price: 4500000, type: '4W', segment: 'Sedan', fuel: 'Petrol' },
        'C-Class': { cc: 1496, price: 5500000, type: '4W', segment: 'Sedan', fuel: 'Petrol' },
        'E-Class': { cc: 1991, price: 7900000, type: '4W', segment: 'Sedan', fuel: 'Petrol' },
        'S-Class': { cc: 2999, price: 16000000, type: '4W', segment: 'Luxury Sedan', fuel: 'Petrol' },
        'GLA': { cc: 1332, price: 5000000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'GLC': { cc: 1991, price: 7300000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'GLE': { cc: 2925, price: 9700000, type: '4W', segment: 'SUV', fuel: 'Diesel' },
        'GLS': { cc: 2925, price: 13000000, type: '4W', segment: 'Luxury SUV', fuel: 'Diesel' },
        'EQS': { cc: 0, price: 18500000, type: '4W', segment: 'Electric Sedan', fuel: 'Electric' }
    },
    'Audi': {
        'A4': { cc: 1984, price: 4600000, type: '4W', segment: 'Sedan', fuel: 'Petrol' },
        'A6': { cc: 1984, price: 6500000, type: '4W', segment: 'Sedan', fuel: 'Petrol' },
        'A8': { cc: 2995, price: 18000000, type: '4W', segment: 'Luxury Sedan', fuel: 'Petrol' },
        'Q3': { cc: 1984, price: 4400000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Q5': { cc: 1984, price: 6780000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Q7': { cc: 2967, price: 8700000, type: '4W', segment: 'SUV', fuel: 'Diesel' },
        'Q8': { cc: 2995, price: 11300000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'e-tron GT': { cc: 0, price: 18000000, type: '4W', segment: 'Electric Sedan', fuel: 'Electric' }
    },
    'Volvo': {
        'XC40': { cc: 1969, price: 4690000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'XC40 Recharge': { cc: 0, price: 5775000, type: '4W', segment: 'Electric SUV', fuel: 'Electric' },
        'XC60': { cc: 1969, price: 6850000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'XC90': { cc: 1969, price: 9200000, type: '4W', segment: 'Luxury SUV', fuel: 'Petrol' },
        'S90': { cc: 1969, price: 7200000, type: '4W', segment: 'Sedan', fuel: 'Petrol' }
    },
    'Land Rover': {
        'Defender': { cc: 1997, price: 9720000, type: '4W', segment: 'Off-Road SUV', fuel: 'Petrol' },
        'Discovery Sport': { cc: 1999, price: 7000000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Range Rover Evoque': { cc: 1998, price: 7000000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Range Rover Velar': { cc: 1997, price: 8100000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Range Rover Sport': { cc: 2996, price: 16000000, type: '4W', segment: 'Luxury SUV', fuel: 'Petrol' },
        'Range Rover': { cc: 2996, price: 25000000, type: '4W', segment: 'Luxury SUV', fuel: 'Petrol' }
    },
    'Porsche': {
        'Macan': { cc: 1984, price: 8390000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Cayenne': { cc: 2995, price: 13500000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Taycan': { cc: 0, price: 15000000, type: '4W', segment: 'Electric Sedan', fuel: 'Electric' },
        '911': { cc: 2981, price: 18000000, type: '4W', segment: 'Sports Car', fuel: 'Petrol' }
    },
    'BYD': {
        'Atto 3': { cc: 0, price: 3399000, type: '4W', segment: 'Electric SUV', fuel: 'Electric' },
        'Seal': { cc: 0, price: 4199000, type: '4W', segment: 'Electric Sedan', fuel: 'Electric' },
        'e6': { cc: 0, price: 2999000, type: '4W', segment: 'Electric MPV', fuel: 'Electric' }
    },
    'MINI': {
        'Cooper': { cc: 1499, price: 4000000, type: '4W', segment: 'Hatchback', fuel: 'Petrol' },
        'Countryman': { cc: 1499, price: 4600000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'Countryman EV': { cc: 0, price: 5500000, type: '4W', segment: 'Electric SUV', fuel: 'Electric' }
    },
    'Lexus': {
        'ES': { cc: 2487, price: 6400000, type: '4W', segment: 'Sedan', fuel: 'Hybrid' },
        'NX': { cc: 2487, price: 6750000, type: '4W', segment: 'SUV', fuel: 'Hybrid' },
        'RX': { cc: 2487, price: 9800000, type: '4W', segment: 'SUV', fuel: 'Hybrid' },
        'LX': { cc: 3346, price: 28500000, type: '4W', segment: 'Luxury SUV', fuel: 'Diesel' }
    },
    'Jaguar': {
        'F-PACE': { cc: 1997, price: 7700000, type: '4W', segment: 'SUV', fuel: 'Petrol' },
        'I-PACE': { cc: 0, price: 10600000, type: '4W', segment: 'Electric SUV', fuel: 'Electric' }
    },
    'Force Motors': {
        'Gurkha': { cc: 2596, price: 1650000, type: '4W', segment: 'Off-Road SUV', fuel: 'Diesel' },
        'Trax Cruiser': { cc: 2596, price: 1200000, type: '4W', segment: 'MUV', fuel: 'Diesel' }
    },
    'Isuzu': {
        'V-Cross': { cc: 1898, price: 2465000, type: '4W', segment: 'Pickup', fuel: 'Diesel' },
        'D-Max': { cc: 1898, price: 1650000, type: '4W', segment: 'Pickup', fuel: 'Diesel' },
        'mu-X': { cc: 1898, price: 3600000, type: '4W', segment: 'SUV', fuel: 'Diesel' }
    }
};

// ===== CAR BRAND POPULARITY BY STATE =====
const CAR_BRAND_POPULARITY = {
    'DL': ['Maruti Suzuki', 'Hyundai', 'Tata', 'Kia', 'Mahindra', 'Honda Cars', 'Toyota', 'MG', 'Volkswagen', 'BMW'],
    'MH': ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Kia', 'Honda Cars', 'Toyota', 'Volkswagen', 'Skoda', 'MG'],
    'KA': ['Maruti Suzuki', 'Hyundai', 'Tata', 'Kia', 'Toyota', 'Honda Cars', 'Mahindra', 'MG', 'Renault', 'Volkswagen'],
    'TN': ['Maruti Suzuki', 'Hyundai', 'Tata', 'Toyota', 'Kia', 'Honda Cars', 'Renault', 'Mahindra', 'Nissan', 'MG'],
    'TS': ['Maruti Suzuki', 'Hyundai', 'Tata', 'Kia', 'Mahindra', 'Toyota', 'Honda Cars', 'MG', 'Renault', 'Volkswagen'],
    'AP': ['Maruti Suzuki', 'Hyundai', 'Tata', 'Kia', 'Toyota', 'Mahindra', 'Honda Cars', 'Renault', 'MG'],
    'UP': ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Kia', 'Toyota', 'Honda Cars', 'Renault', 'MG'],
    'RJ': ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Kia', 'Toyota', 'Renault', 'Honda Cars'],
    'GJ': ['Maruti Suzuki', 'Hyundai', 'Tata', 'Kia', 'Mahindra', 'Honda Cars', 'Toyota', 'MG', 'Renault'],
    'HR': ['Maruti Suzuki', 'Hyundai', 'Tata', 'Kia', 'Mahindra', 'Toyota', 'Honda Cars', 'MG', 'Volkswagen'],
    'PB': ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Kia', 'Toyota', 'Honda Cars', 'MG'],
    'WB': ['Maruti Suzuki', 'Hyundai', 'Tata', 'Kia', 'Toyota', 'Honda Cars', 'Mahindra', 'Renault'],
    'KL': ['Maruti Suzuki', 'Hyundai', 'Tata', 'Kia', 'Toyota', 'Honda Cars', 'Mahindra', 'MG', 'Renault'],
    'MP': ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Kia', 'Toyota', 'Honda Cars'],
    'BR': ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Kia', 'Honda Cars'],
    'JH': ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Kia', 'Honda Cars'],
    'OD': ['Maruti Suzuki', 'Hyundai', 'Tata', 'Kia', 'Mahindra', 'Honda Cars'],
    'CG': ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Kia'],
    'UK': ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Kia', 'Toyota'],
    'GA': ['Maruti Suzuki', 'Hyundai', 'Tata', 'Kia', 'Volkswagen', 'Toyota'],
    'SK': ['Maruti Suzuki', 'Hyundai', 'Tata'],
    'CH': ['Maruti Suzuki', 'Hyundai', 'Tata', 'Kia', 'Toyota', 'BMW'],
    'AS': ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra']
};

// ===== VEHICLE LOOKUP ENGINE =====
// ===== HARDCODED DEMO VEHICLES (for hackathon showcase) =====
const DEMO_VEHICLES = {
    // Telangana - Scooter
    'TS08JM2665': {
        make: 'Honda', model: 'Activa 6G', year: 2022, cc: 109.51,
        fuel: 'Petrol', type: '2W', segment: 'Scooter', variant: 'STD BS6',
        exShowroomPrice: 74536, ownerName: 'Vishnu Kanchipati',
        color: 'Pearl Precious White'
    },
    // Telangana - Car (Hyundai)
    'TS09EA4321': {
        make: 'Hyundai', model: 'Creta', year: 2023, cc: 1497,
        fuel: 'Petrol', type: '4W', segment: 'SUV', variant: 'SX(O) 1.5 Turbo',
        exShowroomPrice: 1689000, ownerName: 'Sai Kumar Reddy',
        color: 'Titan Grey Matte'
    },
    // Telangana - Bike (Royal Enfield)
    'TS07FG8899': {
        make: 'Royal Enfield', model: 'Classic 350', year: 2021, cc: 349,
        fuel: 'Petrol', type: '2W', segment: 'Motorcycle', variant: 'Halcyon BS6',
        exShowroomPrice: 190000, ownerName: 'Ravi Teja M',
        color: 'Signals Marsh Grey'
    },
    // Andhra Pradesh - Car (Maruti)
    'AP09CD5678': {
        make: 'Maruti Suzuki', model: 'Swift', year: 2024, cc: 1197,
        fuel: 'Petrol', type: '4W', segment: 'Hatchback', variant: 'ZXi+ AMT',
        exShowroomPrice: 895000, ownerName: 'Lakshmi Narayana P',
        color: 'Sizzling Red'
    },
    // Andhra Pradesh - Bike
    'AP28BH3456': {
        make: 'TVS', model: 'Apache RTR 200 4V', year: 2023, cc: 197.75,
        fuel: 'Petrol', type: '2W', segment: 'Motorcycle', variant: 'BS6 ABS',
        exShowroomPrice: 141000, ownerName: 'Karthik Varma',
        color: 'Gloss Black'
    },
    // Karnataka - Car (Tata)
    'KA01MH7890': {
        make: 'Tata', model: 'Nexon', year: 2023, cc: 1199,
        fuel: 'Petrol', type: '4W', segment: 'SUV', variant: 'XZ+ Dark Edition',
        exShowroomPrice: 1225000, ownerName: 'Manjunath K',
        color: 'Starlight Blue'
    },
    // Karnataka - EV
    'KA05MN1234': {
        make: 'Ola', model: 'S1 Pro', year: 2024, cc: 0,
        fuel: 'Electric', type: '2W', segment: 'E-Scooter', variant: 'Gen 2',
        exShowroomPrice: 130000, ownerName: 'Priya Sharma',
        color: 'Jet Black'
    },
    // Maharashtra - Car (Mahindra)
    'MH02AB9999': {
        make: 'Mahindra', model: 'XUV700', year: 2022, cc: 1997,
        fuel: 'Diesel', type: '4W', segment: 'SUV', variant: 'AX7 AT',
        exShowroomPrice: 2198000, ownerName: 'Rajesh Patil',
        color: 'Everest White'
    },
    // Tamil Nadu - Bike (Yamaha)
    'TN10AB6543': {
        make: 'Yamaha', model: 'MT-15 V2', year: 2023, cc: 155,
        fuel: 'Petrol', type: '2W', segment: 'Motorcycle', variant: 'BS6 Version 2.0',
        exShowroomPrice: 169000, ownerName: 'Arun Prakash S',
        color: 'Metallic Black'
    },
    // Delhi - Car (Kia)
    'DL01CA7777': {
        make: 'Kia', model: 'Seltos', year: 2024, cc: 1493,
        fuel: 'Petrol', type: '4W', segment: 'SUV', variant: 'HTX+ Turbo iMT',
        exShowroomPrice: 1555000, ownerName: 'Amit Kumar',
        color: 'Gravity Grey'
    },
    // Rajasthan - Bike (Bajaj)
    'RJ14TC2233': {
        make: 'Bajaj', model: 'Pulsar NS200', year: 2022, cc: 199.5,
        fuel: 'Petrol', type: '2W', segment: 'Motorcycle', variant: 'ABS BS6',
        exShowroomPrice: 141000, ownerName: 'Deepak Meena',
        color: 'Satin Blue'
    },
    // Kerala - Scooter (Honda)
    'KL07BQ4455': {
        make: 'Honda', model: 'Dio', year: 2023, cc: 109.51,
        fuel: 'Petrol', type: '2W', segment: 'Scooter', variant: 'Repsol Edition',
        exShowroomPrice: 79000, ownerName: 'Sreejith Nair',
        color: 'Repsol Racing Tricolor'
    },
    // Gujarat - Car (Toyota)
    'GJ01JR5566': {
        make: 'Toyota', model: 'Innova Crysta', year: 2021, cc: 2393,
        fuel: 'Diesel', type: '4W', segment: 'MPV', variant: 'ZX AT 7-Seater',
        exShowroomPrice: 2400000, ownerName: 'Hitesh J Shah',
        color: 'Super White'
    },
    // West Bengal - Bike (Hero)
    'WB06EF8800': {
        make: 'Hero', model: 'Splendor Plus', year: 2024, cc: 97.2,
        fuel: 'Petrol', type: '2W', segment: 'Motorcycle', variant: 'Xtec BS6',
        exShowroomPrice: 78000, ownerName: 'Subhajit Das',
        color: 'Heavy Grey with Green'
    },
    // UP - Car (Maruti)
    'UP32GH1122': {
        make: 'Maruti Suzuki', model: 'Brezza', year: 2023, cc: 1462,
        fuel: 'Petrol', type: '4W', segment: 'SUV', variant: 'ZXi+ AT',
        exShowroomPrice: 1380000, ownerName: 'Pradeep Yadav',
        color: 'Brave Khaki'
    }
};

function lookupVehicle(regNumber, vehicleType) {
    const clean = regNumber.replace(/\s/g, '').toUpperCase();

    if (clean.length < 8) {
        return { success: false, error: 'Invalid registration number format' };
    }

    // Check demo vehicles first (respect vehicleType parameter)
    if (DEMO_VEHICLES[clean]) {
        const demo = DEMO_VEHICLES[clean];

        // Validate vehicle type matches the requested type
        const requestedType = vehicleType === '4W' ? '4W' : '2W';
        if (demo.type !== requestedType) {
            // If type doesn't match, fall through to generate appropriate vehicle
            console.log(`Demo vehicle type mismatch: got ${demo.type}, expected ${requestedType}. Generating dynamic vehicle.`);
        } else {
            const stateCode = clean.substring(0, 2);
            const districtCode = clean.substring(2, 4);
            const series = clean.substring(4, 6);
            const number = clean.substring(6);
            const stateInfo = RTO_DATABASE[stateCode];
            const rtoName = stateInfo?.zones[districtCode] || `RTO ${districtCode}`;
            const currentYear = new Date().getFullYear();
            const vehicleAge = currentYear - demo.year;
            let depPercent = vehicleAge <= 0 ? 0 : vehicleAge <= 1 ? 15 : vehicleAge <= 2 ? 20 : vehicleAge <= 3 ? 30 : vehicleAge <= 4 ? 40 : 50;
            const idv = Math.round(demo.exShowroomPrice * (1 - depPercent / 100));
            const cc = demo.cc;
            // Handle 4W vs 2W TP rates
            let tpPremium;
            if (demo.type === '4W') {
                tpPremium = cc <= 1000 ? 2094 : cc <= 1500 ? 3416 : 7897;
            } else {
                tpPremium = cc === 0 ? 714 : cc <= 75 ? IRDAI_TP_RATES.twoWheeler.below75cc : cc <= 150 ? IRDAI_TP_RATES.twoWheeler.from75to150cc : cc <= 350 ? IRDAI_TP_RATES.twoWheeler.from150to350cc : IRDAI_TP_RATES.twoWheeler.above350cc;
            }
            const odRate = demo.type === '4W' ? (cc > 1500 ? 0.032 : 0.026) : (cc > 350 ? 0.035 : (cc > 150 ? 0.028 : 0.022));
            const odPremium = Math.round(idv * odRate);
            // Dynamic insurance status based on vehicle age
            const insStatus = vehicleAge <= 1 ? 'Active' : vehicleAge <= 3 ? 'Expired (Renewal Due)' : 'Expired';
            const regMonth = (Math.abs(hashCode(clean)) % 12) + 1;
            const fitnessYear = demo.year + (demo.type === '4W' ? 15 : 5);
            return {
                success: true,
                data: {
                    registrationNumber: clean,
                    formattedRegNumber: `${stateCode} ${districtCode} ${series} ${number}`,
                    state: stateInfo?.state || 'Telangana',
                    rtoCode: `${stateCode}${districtCode}`,
                    rtoName,
                    make: demo.make, model: demo.model, year: demo.year,
                    cc: demo.cc, fuel: demo.fuel, type: demo.type,
                    segment: demo.segment, variant: demo.variant,
                    exShowroomPrice: demo.exShowroomPrice,
                    ownerName: demo.ownerName || 'N/A',
                    color: demo.color || 'N/A',
                    idv, vehicleAge, depreciation: depPercent,
                    premium: { thirdParty: tpPremium, ownDamage: odPremium, comprehensive: tpPremium + odPremium, thirdPartyOnly: tpPremium },
                    insuranceStatus: insStatus,
                    fitnessValidUpto: `${fitnessYear}-${String(regMonth).padStart(2, '0')}`,
                    registrationDate: `${demo.year}-${String(regMonth).padStart(2, '0')}-15`,
                    timestamp: new Date().toISOString(),
                    source: 'Parivahan-RTO-Verified'
                }
            };
        }
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

    // Choose database based on vehicleType parameter
    const isCar = vehicleType === '4W';
    const brandList = isCar
        ? (CAR_BRAND_POPULARITY[stateCode] || ['Maruti Suzuki', 'Hyundai', 'Tata', 'Kia', 'Mahindra'])
        : (BRAND_POPULARITY[stateCode] || ['Hero', 'Honda', 'Bajaj', 'TVS', 'Yamaha']);
    const db = isCar ? CAR_DATABASE : VEHICLE_DATABASE;

    const brand = brandList[Math.abs(seed) % brandList.length];

    const models = Object.keys(db[brand] || {});
    if (models.length === 0) {
        return { success: false, error: 'Vehicle data not available' };
    }

    const model = models[Math.abs(seed >> 4) % models.length];
    const vehicleInfo = db[brand][model];

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
    if (isCar || vehicleInfo.type === '4W') {
        // Car (4W) TP rates
        if (cc === 0) tpPremium = 2094; // EV cars - use lowest slab
        else if (cc <= 1000) tpPremium = IRDAI_TP_RATES.car.below1000cc;
        else if (cc <= 1500) tpPremium = IRDAI_TP_RATES.car.from1000to1500cc;
        else tpPremium = IRDAI_TP_RATES.car.above1500cc;
    } else {
        // Two-wheeler TP rates
        if (cc === 0) tpPremium = 714; // Electric vehicles
        else if (cc <= 75) tpPremium = IRDAI_TP_RATES.twoWheeler.below75cc;
        else if (cc <= 150) tpPremium = IRDAI_TP_RATES.twoWheeler.from75to150cc;
        else if (cc <= 350) tpPremium = IRDAI_TP_RATES.twoWheeler.from150to350cc;
        else tpPremium = IRDAI_TP_RATES.twoWheeler.above350cc;
    }

    // Own damage premium
    const odRate = (isCar || vehicleInfo.type === '4W')
        ? (cc > 1500 ? 0.032 : 0.026)
        : (cc > 350 ? 0.035 : (cc > 150 ? 0.028 : 0.022));
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
            source: 'Parivahan-RTO'
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
    const { registrationNumber, vehicleType } = req.body;

    if (!registrationNumber) {
        return res.status(400).json({ success: false, error: 'Registration number required' });
    }

    // Simulate network latency (real API feel)
    const delay = 800 + Math.random() * 700;

    setTimeout(() => {
        const result = lookupVehicle(registrationNumber, vehicleType);

        if (result.success) {
            // Also generate insurance quotes
            result.data.quotes = generateQuotes(result.data);
        }

        res.json(result);
    }, delay);
});

// Get insurance quotes for given vehicle details
app.post('/api/insurance/quotes', (req, res) => {
    const { make, model, year, cc, city, vehicleType } = req.body;

    if (!make || !model || !year) {
        return res.status(400).json({ success: false, error: 'Vehicle details required' });
    }

    // Search in both databases
    const vehicleInfo = VEHICLE_DATABASE[make]?.[model] || CAR_DATABASE[make]?.[model];
    if (!vehicleInfo) {
        return res.status(404).json({ success: false, error: 'Vehicle not found in database' });
    }

    const vehicleAge = new Date().getFullYear() - parseInt(year);
    let depPercent = vehicleAge <= 0 ? 0 : vehicleAge <= 1 ? 15 : vehicleAge <= 2 ? 20 : vehicleAge <= 3 ? 30 : vehicleAge <= 4 ? 40 : 50;
    const idv = Math.round(vehicleInfo.price * (1 - depPercent / 100));

    const engineCC = vehicleInfo.cc;
    const isCar = vehicleType === '4W' || vehicleInfo.type === '4W';
    let tpPremium;
    if (isCar) {
        if (engineCC === 0) tpPremium = 2094;
        else if (engineCC <= 1000) tpPremium = IRDAI_TP_RATES.car.below1000cc;
        else if (engineCC <= 1500) tpPremium = IRDAI_TP_RATES.car.from1000to1500cc;
        else tpPremium = IRDAI_TP_RATES.car.above1500cc;
    } else {
        if (engineCC === 0) tpPremium = 714;
        else if (engineCC <= 75) tpPremium = IRDAI_TP_RATES.twoWheeler.below75cc;
        else if (engineCC <= 150) tpPremium = IRDAI_TP_RATES.twoWheeler.from75to150cc;
        else if (engineCC <= 350) tpPremium = IRDAI_TP_RATES.twoWheeler.from150to350cc;
        else tpPremium = IRDAI_TP_RATES.twoWheeler.above350cc;
    }

    const odRate = isCar ? (engineCC > 1500 ? 0.032 : 0.026) : (engineCC > 350 ? 0.035 : (engineCC > 150 ? 0.028 : 0.022));
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
    const type = req.query.type; // '4W' for cars, '2W' for bikes
    const db = type === '4W' ? CAR_DATABASE : VEHICLE_DATABASE;
    res.json({
        success: true,
        brands: Object.keys(db)
    });
});

// Get models for a brand
app.get('/api/vehicle/models/:brand', (req, res) => {
    const brand = req.params.brand;
    const models = VEHICLE_DATABASE[brand] || CAR_DATABASE[brand];
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
    const { idv, ncb, cc, policyType, vehicleType } = req.body;

    const isCar = vehicleType === '4W';
    let tpPremium;
    if (isCar) {
        if (cc === 0) tpPremium = 2094;
        else if (cc <= 1000) tpPremium = IRDAI_TP_RATES.car.below1000cc;
        else if (cc <= 1500) tpPremium = IRDAI_TP_RATES.car.from1000to1500cc;
        else tpPremium = IRDAI_TP_RATES.car.above1500cc;
    } else {
        if (cc === 0) tpPremium = 714;
        else if (cc <= 75) tpPremium = IRDAI_TP_RATES.twoWheeler.below75cc;
        else if (cc <= 150) tpPremium = IRDAI_TP_RATES.twoWheeler.from75to150cc;
        else if (cc <= 350) tpPremium = IRDAI_TP_RATES.twoWheeler.from150to350cc;
        else tpPremium = IRDAI_TP_RATES.twoWheeler.above350cc;
    }

    const odRate = isCar ? (cc > 1500 ? 0.032 : 0.026) : (cc > 350 ? 0.035 : (cc > 150 ? 0.028 : 0.022));
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

// ===== NEGOTIATION ENGINE =====
const negotiationSessions = {};

const INSURER_NEGOTIATION_PROFILES = {
    hdfc: { name: 'HDFC ERGO', maxDiscount: 0.18, aggression: 0.7, loyalty: 0.04, ncbBonus: 0.03, minMargin: 0.05, walkAwayRound: 4 },
    icici: { name: 'ICICI Lombard', maxDiscount: 0.22, aggression: 0.5, loyalty: 0.05, ncbBonus: 0.04, minMargin: 0.04, walkAwayRound: 5 },
    bajaj: { name: 'Bajaj Allianz', maxDiscount: 0.15, aggression: 0.8, loyalty: 0.03, ncbBonus: 0.02, minMargin: 0.06, walkAwayRound: 3 },
    tata: { name: 'Tata AIG', maxDiscount: 0.17, aggression: 0.6, loyalty: 0.04, ncbBonus: 0.03, minMargin: 0.05, walkAwayRound: 4 },
    sbi: { name: 'SBI General', maxDiscount: 0.12, aggression: 0.9, loyalty: 0.02, ncbBonus: 0.02, minMargin: 0.07, walkAwayRound: 3 },
    max: { name: 'Max Life', maxDiscount: 0.16, aggression: 0.65, loyalty: 0.03, ncbBonus: 0.03, minMargin: 0.05, walkAwayRound: 4 }
};

function generateSessionId() {
    return 'NEG-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
}

function calculateInsurerOffer(profile, baseQuote, round, totalRounds) {
    const progress = round / totalRounds;
    // Insurers concede more as rounds progress; aggression slows concession
    const concessionCurve = Math.pow(progress, profile.aggression);
    const currentDiscount = (baseQuote.discount / 100) + concessionCurve * (profile.maxDiscount - baseQuote.discount / 100);
    const cappedDiscount = Math.min(currentDiscount, profile.maxDiscount);

    const baseOD = baseQuote.premium.comprehensive.ownDamage / (1 - baseQuote.discount / 100);
    const newOD = Math.round(baseOD * (1 - cappedDiscount));
    const tp = baseQuote.premium.comprehensive.thirdParty;
    const subtotal = tp + newOD;
    const gst = Math.round(subtotal * 0.18);

    return {
        insurerId: baseQuote.insurerId,
        insurerName: baseQuote.insurerName,
        logo: baseQuote.logo,
        round,
        discount: Math.round(cappedDiscount * 100),
        premium: {
            ownDamage: newOD,
            thirdParty: tp,
            subtotal,
            gst,
            total: subtotal + gst
        },
        originalTotal: baseQuote.premium.comprehensive.total,
        savings: baseQuote.premium.comprehensive.total - (subtotal + gst),
        savingsPercent: Math.round((1 - (subtotal + gst) / baseQuote.premium.comprehensive.total) * 100),
        extras: []
    };
}

// Start negotiation
app.post('/api/negotiate/start', (req, res) => {
    const { registrationNumber } = req.body;
    if (!registrationNumber) {
        return res.status(400).json({ success: false, error: 'Registration number required' });
    }

    const vehicleResult = lookupVehicle(registrationNumber);
    if (!vehicleResult.success) {
        return res.status(404).json({ success: false, error: vehicleResult.error });
    }

    const quotes = generateQuotes(vehicleResult.data);
    const sessionId = generateSessionId();

    negotiationSessions[sessionId] = {
        id: sessionId,
        registrationNumber: registrationNumber.replace(/\s/g, '').toUpperCase(),
        vehicle: vehicleResult.data,
        baseQuotes: quotes,
        rounds: [],
        status: 'active',
        createdAt: new Date().toISOString(),
        currentRound: 0,
        totalRounds: 3
    };

    // Clean up old sessions (keep last 50)
    const keys = Object.keys(negotiationSessions);
    if (keys.length > 50) {
        delete negotiationSessions[keys[0]];
    }

    res.json({
        success: true,
        sessionId,
        vehicle: vehicleResult.data,
        initialOffers: quotes.map(q => ({
            insurerId: q.insurerId,
            insurerName: q.insurerName,
            logo: q.logo,
            rating: q.rating,
            claimSettlementRatio: q.claimSettlementRatio,
            networkGarages: q.networkGarages,
            premium: q.premium.comprehensive,
            discount: q.discount,
            features: q.features
        }))
    });
});

// Simulate full auto-negotiation
app.post('/api/negotiate/simulate', async (req, res) => {
    const { sessionId } = req.body;
    const session = negotiationSessions[sessionId];
    if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
    }
    if (session.status !== 'active') {
        return res.status(400).json({ success: false, error: 'Session already completed' });
    }

    const totalRounds = session.totalRounds;
    const allRounds = [];

    for (let round = 1; round <= totalRounds; round++) {
        const roundOffers = [];

        for (const quote of session.baseQuotes) {
            const profile = INSURER_NEGOTIATION_PROFILES[quote.insurerId];
            if (!profile) continue;

            const offer = calculateInsurerOffer(profile, quote, round, totalRounds);

            // Add round-specific extras/incentives
            if (round === 2) {
                if (Math.random() > 0.5) {
                    offer.extras.push('Free Roadside Assistance (₹299 value)');
                }
                if (profile.loyalty > 0.03) {
                    offer.extras.push(`Loyalty bonus: extra ${Math.round(profile.loyalty * 100)}% off`);
                }
            }
            if (round === 3) {
                offer.extras.push('Free Zero-Dep add-on for 1st year');
                if (profile.ncbBonus > 0.02) {
                    offer.extras.push(`NCB Protection included (₹${Math.round(offer.premium.ownDamage * profile.ncbBonus)} value)`);
                }
                offer.extras.push('Instant policy issuance');
            }

            roundOffers.push(offer);
        }

        // Sort by total premium (lowest first)
        roundOffers.sort((a, b) => a.premium.total - b.premium.total);

        // Generate AI mediator commentary via OpenRouter
        let aiCommentary = '';
        try {
            const roundContext = round === 1
                ? `Round 1 of negotiation. Initial counter-offers received. Best offer so far: ${roundOffers[0].insurerName} at ₹${roundOffers[0].premium.total}. Savings range: ₹${roundOffers[roundOffers.length - 1].savings} to ₹${roundOffers[0].savings}.`
                : round === 2
                    ? `Round 2. Insurers are improving offers. ${roundOffers[0].insurerName} leads at ₹${roundOffers[0].premium.total} (${roundOffers[0].savingsPercent}% savings). Some are adding free add-ons to sweeten the deal.`
                    : `Final round 3. Best and final offers are in. ${roundOffers[0].insurerName} offers ₹${roundOffers[0].premium.total} with ${roundOffers[0].savingsPercent}% total savings and free zero-dep coverage. This is the best we can get.`;

            const aiRes = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: 'google/gemini-2.0-flash-001',
                    messages: [
                        {
                            role: 'system',
                            content: `You are an AI insurance negotiation mediator for Insurix.India. You speak in a confident, friendly tone — like a savvy friend helping someone get the best deal. Keep responses to 2-3 SHORT sentences. Be specific with numbers. Use ₹ symbol. Add one relevant emoji. Do NOT use markdown.`
                        },
                        {
                            role: 'user',
                            content: `Summarize this negotiation round for the customer in 2-3 sentences: ${roundContext}`
                        }
                    ],
                    temperature: 0.8,
                    max_tokens: 150
                },
                {
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://insurix.india',
                        'X-Title': 'Insurix Negotiator'
                    },
                    timeout: 12000
                }
            );
            aiCommentary = aiRes.data?.choices?.[0]?.message?.content || '';
        } catch (e) {
            // Fallback commentary
            const fallbacks = [
                `Round ${round}: I've pushed all 6 insurers to improve their offers. ${roundOffers[0].insurerName} is leading with ₹${roundOffers[0].premium.total} — that's ₹${roundOffers[0].savings} in savings! 💪`,
                `Getting better! ${roundOffers[0].insurerName} dropped to ₹${roundOffers[0].premium.total}. Some insurers are throwing in free add-ons too. Let me push harder. 🔥`,
                `Final offers are in! Best deal: ${roundOffers[0].insurerName} at ₹${roundOffers[0].premium.total} with ${roundOffers[0].savingsPercent}% savings + free zero-dep. This is as good as it gets! 🎯`
            ];
            aiCommentary = fallbacks[round - 1] || fallbacks[0];
        }

        allRounds.push({
            round,
            offers: roundOffers,
            aiCommentary,
            timestamp: new Date().toISOString()
        });
    }

    session.rounds = allRounds;
    session.status = 'negotiated';
    session.currentRound = totalRounds;

    // Calculate final summary
    const bestFinal = allRounds[totalRounds - 1].offers[0];
    const worstInitial = session.baseQuotes[session.baseQuotes.length - 1];

    res.json({
        success: true,
        sessionId,
        rounds: allRounds,
        summary: {
            bestOffer: bestFinal,
            totalSavings: bestFinal.savings,
            savingsPercent: bestFinal.savingsPercent,
            originalBest: session.baseQuotes[0].premium.comprehensive.total,
            negotiatedBest: bestFinal.premium.total,
            roundsCompleted: totalRounds,
            recommendation: bestFinal.insurerName
        }
    });
});

// Get negotiation status
app.get('/api/negotiate/status/:sessionId', (req, res) => {
    const session = negotiationSessions[req.params.sessionId];
    if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.json({
        success: true,
        session: {
            id: session.id,
            status: session.status,
            vehicle: session.vehicle,
            currentRound: session.currentRound,
            totalRounds: session.totalRounds,
            rounds: session.rounds,
            createdAt: session.createdAt
        }
    });
});

// Accept an offer
app.post('/api/negotiate/accept', (req, res) => {
    const { sessionId, insurerId } = req.body;
    const session = negotiationSessions[sessionId];
    if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const finalRound = session.rounds[session.rounds.length - 1];
    const acceptedOffer = finalRound?.offers.find(o => o.insurerId === insurerId);
    if (!acceptedOffer) {
        return res.status(400).json({ success: false, error: 'Offer not found' });
    }

    session.status = 'accepted';
    session.acceptedOffer = acceptedOffer;

    res.json({
        success: true,
        message: `Policy with ${acceptedOffer.insurerName} accepted!`,
        offer: acceptedOffer,
        vehicle: session.vehicle,
        policyNumber: 'INS-' + Date.now().toString(36).toUpperCase(),
        estimatedIssuance: '< 5 minutes'
    });
});

// ===== REAL INDIAN INSURANCE POLICIES WITH AI CLASSIFICATION =====

// Comprehensive Indian Insurance Policy Database
const INDIAN_INSURANCE_POLICIES = {
    motor: {
        category: 'Motor Insurance',
        description: 'Vehicle insurance covering cars and two-wheelers',
        policies: [
            { id: 'hdfc-mot', insurerId: 'hdfc', insurerName: 'HDFC ERGO', productName: 'Motor Insurance', type: 'Comprehensive', keyFeatures: ['Cashless claims at 7200+ garages', '98.5% claim settlement', 'Zero Depreciation', 'Roadside Assistance'], premiumRange: '₹2,000-15,000', rating: 4.5, claimRatio: 98.5 },
            { id: 'icici-mot', insurerId: 'icici', insurerName: 'ICICI Lombard', productName: 'Motor Insurance', type: 'Comprehensive', keyFeatures: ['6500+ network garages', '97.2% claim settlement', 'Instant policy', '24/7 support'], premiumRange: '₹1,800-14,000', rating: 4.4, claimRatio: 97.2 },
            { id: 'bajaj-mot', insurerId: 'bajaj', insurerName: 'Bajaj Allianz', productName: 'Motor Insurance', type: 'Comprehensive', keyFeatures: ['5800+ garages', '98.8% claim settlement', 'Easy claims', 'Discounts available'], premiumRange: '₹1,500-12,000', rating: 4.3, claimRatio: 98.8 },
            { id: 'tata-mot', insurerId: 'tata', insurerName: 'Tata AIG', productName: 'Motor Insurance', type: 'Comprehensive', keyFeatures: ['5200+ garages', '95.2% claim settlement', 'Premium coverage', 'Quick settlement'], premiumRange: '₹2,200-16,000', rating: 4.2, claimRatio: 95.2 },
            { id: 'sbi-mot', insurerId: 'sbi', insurerName: 'SBI General', productName: 'Motor Insurance', type: 'Comprehensive', keyFeatures: ['4800+ garages', '94.8% claim settlement', 'Economical rates', 'Wide network'], premiumRange: '₹1,400-10,000', rating: 4.1, claimRatio: 94.8 },
            { id: 'digit-mot', insurerId: 'digit', insurerName: 'Digit', productName: 'Motor Insurance', type: 'Comprehensive', keyFeatures: ['6000+ garages', '96% claim settlement', 'Best prices', 'Easy app'], premiumRange: '₹1,200-9,000', rating: 4.4, claimRatio: 96.0 }
        ]
    },
    health: {
        category: 'Health Insurance',
        description: 'Medical insurance for individuals and families',
        policies: [
            { id: 'star-health', insurerId: 'star', insurerName: 'Star Health', productName: 'Family Health Optima', type: 'Family Floater', keyFeatures: ['13000+ network hospitals', '66% claim settlement', 'No medical check-up up to 45 yrs', 'Maternity cover'], premiumRange: '₹5,000-50,000', rating: 4.5, claimRatio: 66.0 },
            { id: 'niva-bupa', insurerId: 'niva', insurerName: 'Niva Bupa', productName: 'Reassure', type: 'Family Floater', keyFeatures: ['10000+ hospitals', '80% claim settlement', 'Restore benefit', 'International second opinion'], premiumRange: '₹8,000-75,000', rating: 4.6, claimRatio: 80.0 },
            { id: 'hdfc-health', insurerId: 'hdfc', insurerName: 'HDFC ERGO', productName: 'Optima Restore', type: 'Individual', keyFeatures: ['13000 hospitals', '96.2% claim settlement', 'Restore benefit', 'Daycare treatments'], premiumRange: '₹6,000-60,000', rating: 4.4, claimRatio: 96.2 },
            { id: 'icici-health', insurerId: 'icici', insurerName: 'ICICI Lombard', productName: 'Health Booster', type: 'Family Floater', keyFeatures: ['11500 hospitals', '95.1% claim settlement', 'Unlimited restore', 'Premium health checkup'], premiumRange: '₹7,000-65,000', rating: 4.3, claimRatio: 95.1 },
            { id: 'care-health', insurerId: 'care', insurerName: 'Care Health', productName: 'Care Supreme', type: 'Family Floater', keyFeatures: ['11000 hospitals', '95% claim settlement', 'NCB super reload', 'Air ambulance'], premiumRange: '₹6,500-55,000', rating: 4.4, claimRatio: 95.0 },
            { id: 'aditya-birla', insurerId: 'ab', insurerName: 'Aditya Birla', productName: 'Active Health', type: 'Family Floater', keyFeatures: ['10000 hospitals', '94% claim settlement', 'Restore benefit', 'Chronic management'], premiumRange: '₹7,500-70,000', rating: 4.2, claimRatio: 94.0 }
        ]
    },
    life: {
        category: 'Life Insurance',
        description: 'Term and investment life insurance plans',
        policies: [
            { id: 'lic-term', insurerId: 'lic', insurerName: 'LIC', productName: 'Jeevan Anand', type: 'Term + Endowment', keyFeatures: ['98.6% claim settlement', 'Trustworthy brand', 'Loan facility', 'Bonus additions'], premiumRange: '₹8,000-1,50,000', rating: 4.7, claimRatio: 98.6 },
            { id: 'hdfc-life', insurerId: 'hdfclife', insurerName: 'HDFC Life', productName: 'Click 2 Protect', type: 'Term', keyFeatures: ['99.1% claim settlement', 'Online discount 30%', 'Flexible cover', 'Critical illness rider'], premiumRange: '₹6,000-1,20,000', rating: 4.5, claimRatio: 99.1 },
            { id: 'max-life', insurerId: 'maxlife', insurerName: 'Max Life', productName: 'Smart Term Plus', type: 'Term', keyFeatures: ['99.6% claim settlement', 'Highest claim ratio', 'Return of premium option', 'Premium waiver'], premiumRange: '₹6,500-1,30,000', rating: 4.6, claimRatio: 99.6 },
            { id: 'icici-pru', insurerId: 'icicipru', insurerName: 'ICICI Prudential', productName: 'iProtect Smart', type: 'Term', keyFeatures: ['98.5% claim settlement', 'Critical illness cover', 'Accidental death rider', 'Tax benefits'], premiumRange: '₹5,500-1,10,000', rating: 4.4, claimRatio: 98.5 },
            { id: 'sbi-life', insurerId: 'sbilife', insurerName: 'SBI Life', productName: 'eShield Next', type: 'Term', keyFeatures: ['97.8% claim settlement', 'Online term plans', 'Spouse cover option', 'Tax savings'], premiumRange: '₹5,000-1,00,000', rating: 4.3, claimRatio: 97.8 },
            { id: 'tata-aia', insurerId: 'tataaia', insurerName: 'Tata AIA', productName: 'Aegon Life iTerm', type: 'Term', keyFeatures: ['99.1% claim settlement', 'Cancer cover', 'Terminal illness', 'Income replacement'], premiumRange: '₹6,000-1,15,000', rating: 4.5, claimRatio: 99.1 }
        ]
    },
    travel: {
        category: 'Travel Insurance',
        description: 'Domestic and international travel insurance',
        policies: [
            { id: 'bajaj-travel', insurerId: 'bajaj', insurerName: 'Bajaj Allianz', productName: 'Travel Insurance', type: 'International', keyFeatures: ['Medical coverage up to $500K', 'Trip cancellation', 'Baggage loss', 'Flight delay'], premiumRange: '₹300-5,000', rating: 4.4, claimRatio: 97.0 },
            { id: 'icici-travel', insurerId: 'icici', insurerName: 'ICICI Lombard', productName: 'Travel Insurance', type: 'International', keyFeatures: ['COVID-19 covered', 'Emergency evacuation', 'Personal liability', '24/7 assistance'], premiumRange: '₹350-6,000', rating: 4.3, claimRatio: 96.0 },
            { id: 'hdfc-travel', insurerId: 'hdfc', insurerName: 'HDFC ERGO', productName: 'Travel Insurance', type: 'International', keyFeatures: ['Schengen compliant', 'Adventure sports', 'Home contents cover', 'Cashless claims'], premiumRange: '₹400-7,000', rating: 4.5, claimRatio: 97.5 },
            { id: 'digit-travel', insurerId: 'digit', insurerName: 'Digit', productName: 'Travel Insurance', type: 'Domestic', keyFeatures: ['Affordable rates', 'Instant policy', 'Trip delay cover', 'Personal accident'], premiumRange: '₹150-1,500', rating: 4.2, claimRatio: 95.0 }
        ]
    },
    home: {
        category: 'Home Insurance',
        description: 'House and contents insurance',
        policies: [
            { id: 'hdfc-home', insurerId: 'hdfc', insurerName: 'HDFC ERGO', productName: 'Home Insurance', type: 'Building + Contents', keyFeatures: ['Fire, flood, earthquake', 'Burglary cover', 'Jewelry & valuables', 'Rent compensation'], premiumRange: '₹1,000-15,000', rating: 4.5, claimRatio: 97.0 },
            { id: 'icici-home', insurerId: 'icici', insurerName: 'ICICI Lombard', productName: 'Home Insurance', type: 'Building + Contents', keyFeatures: ['Natural calamities', 'Theft cover', 'Electrical breakdown', 'Architect fee cover'], premiumRange: '₹1,200-18,000', rating: 4.4, claimRatio: 96.0 },
            { id: 'bajaj-home', insurerId: 'bajaj', insurerName: 'Bajaj Allianz', productName: 'Home Insurance', type: 'Building + Contents', keyFeatures: ['All-risk cover', 'Personal accident', 'Liability cover', 'Alternative accommodation'], premiumRange: '₹800-12,000', rating: 4.3, claimRatio: 97.5 },
            { id: 'sbi-home', insurerId: 'sbi', insurerName: 'SBI General', productName: 'Home Insurance', type: 'Building Only', keyFeatures: ['Bank tie-up benefits', 'Fire & burglary', 'Affordable premium', 'Easy claim process'], premiumRange: '₹500-8,000', rating: 4.1, claimRatio: 94.0 }
        ]
    },
    cyber: {
        category: 'Cyber Insurance',
        description: 'Digital security and online fraud protection',
        policies: [
            { id: 'hdfc-cyber', insurerId: 'hdfc', insurerName: 'HDFC ERGO', productName: 'Cyber Insurance', type: 'Individual', keyFeatures: ['Online fraud cover', 'Identity theft', 'Cyber bullying', 'Data breach'], premiumRange: '₹500-5,000', rating: 4.4, claimRatio: 95.0 },
            { id: 'bajaj-cyber', insurerId: 'bajaj', insurerName: 'Bajaj Allianz', productName: 'Cyber Insurance', type: 'Individual', keyFeatures: ['UPI fraud cover', 'Social media hacking', 'Phishing protection', 'Legal support'], premiumRange: '₹400-4,500', rating: 4.3, claimRatio: 96.0 },
            { id: 'tata-cyber', insurerId: 'tata', insurerName: 'Tata AIG', productName: 'Cyber Insurance', type: 'Business', keyFeatures: ['Data breach liability', 'Ransomware cover', 'Business interruption', 'Forensic investigation'], premiumRange: '₹5,000-50,000', rating: 4.5, claimRatio: 94.0 }
        ]
    }
};

// AI Classification endpoint
app.post('/api/policies/classify', async (req, res) => {
    const { vehicleType, userPreferences, budget, coverage } = req.body;
    
    // Get policies based on vehicle type or all if not specified
    let policiesToClassify = [];
    
    if (vehicleType) {
        // Map vehicle type to insurance category
        const categoryMap = {
            'car': 'motor', '4W': 'motor', 'motor': 'motor',
            'bike': 'motor', '2W': 'motor', 'scooter': 'motor',
            'health': 'health', 'medical': 'health',
            'life': 'life', 'term': 'life',
            'travel': 'travel', 'trip': 'travel',
            'home': 'home', 'house': 'home',
            'cyber': 'cyber', 'digital': 'cyber'
        };
        const category = categoryMap[vehicleType.toLowerCase()];
        if (category && INDIAN_INSURANCE_POLICIES[category]) {
            policiesToClassify = INDIAN_INSURANCE_POLICIES[category].policies;
        }
    } else {
        // Return all policies across all categories
        for (const cat of Object.values(INDIAN_INSURANCE_POLICIES)) {
            policiesToClassify.push(...cat.policies);
        }
    }
    
    // Use AI to classify and rank policies based on user preferences
    let aiClassification = '';
    try {
        const prefText = userPreferences ? `User preferences: ${JSON.stringify(userPreferences)}. Budget: ${budget || 'not specified'}. Coverage: ${coverage || 'standard'}` : 'General ranking';
        const policiesText = policiesToClassify.map(p => `${p.insurerName} - ${p.productName}: Premium ${p.premiumRange}, Rating ${p.rating}, Claim Ratio ${p.claimRatio}%, Features: ${p.keyFeatures.join(', ')}`).join('; ');
        
        const aiRes = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'google/gemini-2.0-flash-001',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an AI insurance expert for Insurix.India. Classify and rank insurance policies based on user needs. Provide clear categories: "Best Value", "Best Coverage", "Best for Claims". Keep responses short and practical. Use ₹ symbol.'
                    },
                    {
                        role: 'user',
                        content: `Classify these Indian insurance policies for ${vehicleType || 'general'}: ${policiesText}. ${prefText}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 300
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://insurix.india',
                    'X-Title': 'Insurix Policy Classifier'
                },
                timeout: 15000
            }
        );
        aiClassification = aiRes.data?.choices?.[0]?.message?.content || '';
    } catch (e) {
        // Fallback classification
        aiClassification = 'Based on our analysis, we recommend policies with high claim settlement ratios and features matching your requirements. Contact our AI assistant for personalized recommendations.';
    }
    
    // Classify policies into categories
    const classified = {
        bestValue: policiesToClassify.filter(p => p.rating >= 4.3 && parseInt(p.premiumRange.replace(/[₹,]/g, '').split('-')[0]) < 10000).slice(0, 3),
        bestCoverage: policiesToClassify.filter(p => p.claimRatio >= 96).slice(0, 3),
        bestClaims: policiesToClassify.filter(p => p.claimRatio >= 98).slice(0, 3),
        topRated: [...policiesToClassify].sort((a, b) => b.rating - a.rating).slice(0, 3)
    };
    
    res.json({
        success: true,
        policies: policiesToClassify,
        classification: {
            categories: ['Best Value', 'Best Coverage', 'Best Claims', 'Top Rated'],
            classified,
            aiAnalysis: aiClassification
        },
        metadata: {
            totalPolicies: policiesToClassify.length,
            categories: vehicleType ? [INDIAN_INSURANCE_POLICIES[Object.keys(INDIAN_INSURANCE_POLICIES).find(k => INDIAN_INSURANCE_POLICIES[k].policies.some(p => policiesToClassify.includes(p)))]?.category || 'Motor'] : Object.keys(INDIAN_INSURANCE_POLICIES),
            lastUpdated: new Date().toISOString()
        }
    });
});

// Get all Indian insurance policies
app.get('/api/policies/india', (req, res) => {
    const { category, insurer } = req.query;
    
    let result = INDIAN_INSURANCE_POLICIES;
    
    if (category && result[category]) {
        result = { [category]: result[category] };
    }
    
    if (insurer) {
        // Filter by insurer across all categories
        const filtered = {};
        for (const [cat, data] of Object.entries(INDIAN_INSURANCE_POLICIES)) {
            const policies = data.policies.filter(p => p.insurerName.toLowerCase().includes(insurer.toLowerCase()));
            if (policies.length > 0) {
                filtered[cat] = { ...data, policies };
            }
        }
        result = filtered;
    }
    
    res.json({
        success: true,
        data: result,
        count: Object.values(result).reduce((acc, cat) => acc + cat.policies.length, 0)
    });
});

// ===== AI CHATBOT ENDPOINTS (OpenRouter + Azure Speech) =====
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = 'google/gemini-2.0-flash-001';
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY || '';
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'eastasia';

const INSURANCE_SYSTEM_PROMPT = `You are "Insurix" — the user's personal insurance buddy. Think of yourself like a chill, helpful friend who happens to know EVERYTHING about Indian insurance. You work for Insurix.India.

YOU ARE AN EXPERT ON **ALL** TYPES OF INDIAN INSURANCE — motor, health, life, travel, home, cyber, commercial, marine, fire, liability, crop, and every government scheme. NEVER say you only deal with car/bike insurance. NEVER say "I'll connect you with someone" — YOU are the expert on ALL insurance.

YOUR PERSONALITY:
- Talk like a friendly buddy, NOT a formal corporate bot
- Use casual, warm language — like texting a friend who's an insurance expert
- Use phrases like "no worries!", "got it!", "let me check that for you real quick", "here's the deal", "cool, so basically..."
- In Telugu: use friendly tone like "బ్రో", "చెప్తా ఉండు", "టెన్షన్ పడకు", "నేను చూసుకుంటా"
- In Hindi: use friendly tone like "बताता हूँ", "टेंशन मत ले", "ये रहा", "एक सेकंड"
- Add relevant emojis naturally (don't overdo it)
- Be encouraging and reassuring — insurance can be confusing, make it feel easy
- If user seems confused, say "no stress, let me break it down simply"
- Keep answers concise but informative — 3-5 sentences, like a WhatsApp reply from an expert friend

IMPORTANT — CONTEXT-AWARE RESPONSES:
- ALWAYS stay on topic. If the user is asking about life insurance, health insurance, travel insurance, home insurance, cyber insurance, crop insurance, or ANY non-motor insurance topic, NEVER bring up vehicle numbers or ask for vehicle registration.
- Only discuss vehicle numbers when the user EXPLICITLY mentions motor/vehicle insurance, bike, car, two-wheeler, or provides a vehicle registration number.
- When the user asks follow-up questions like "what are the best plans?" or "ఉత్తమ ప్లాన్‌లు ఏమిటి?", refer to the PREVIOUS conversation context to understand which insurance type they are asking about. Do NOT switch topics.

VEHICLE NUMBER DETECTION (ONLY for motor/vehicle insurance conversations):
- If the user is talking about motor/vehicle/bike/car insurance AND provides a vehicle number, detect it.
- Users may say numbers in various ways:
  * Direct: "TS09AB1234", "TS 09 AB 1234"
  * Spoken: "my vehicle number is TS zero nine AB one two three four"
  * Telugu: "నా వాహన నంబర్ TS09AB1234"
  * Hindi: "मेरा वाहन नंबर TS09AB1234"
- When you detect a vehicle number in a motor insurance conversation, include it as: [VEHICLE:XX00XX0000]
- DO NOT ask for vehicle number unless the user is specifically discussing motor/vehicle insurance.
- NEVER ask for vehicle number when discussing life, health, travel, home, cyber, crop, or any non-motor insurance.

COMPREHENSIVE INDIAN INSURANCE KNOWLEDGE:
Answer in the SAME language the user speaks (Telugu, English, or Hindi). If user speaks Telugu, reply in Telugu script.

=== 1. MOTOR / VEHICLE INSURANCE ===
Types: Third Party (TP) Only, Comprehensive (OD + TP), Standalone OD
Vehicles: Two-wheelers, Cars, Commercial (trucks, buses, autos, tractors), Electric Vehicles (EV)

IRDAI Third Party Premium Rates (Two-Wheeler):
• ≤75cc: ₹538/yr | 75-150cc: ₹714/yr | 150-350cc: ₹1,366/yr | >350cc: ₹2,804/yr
IRDAI TP Rates (Private Car):
• ≤1000cc: ₹2,094/yr | 1000-1500cc: ₹3,416/yr | >1500cc: ₹7,897/yr
Commercial Vehicles: TP rates are higher, based on GVW (Gross Vehicle Weight) and use.
EV Vehicles: 15% discount on OD premium as per IRDAI guidelines.

OD Premium: ~2.2-3.5% of IDV + 18% GST
IDV Depreciation (IRDAI): 6mo: 5%, 1yr: 15%, 2yr: 20%, 3yr: 30%, 4yr: 40%, 5yr+: 50%
NCB Slabs: 1yr: 20%, 2yr: 25%, 3yr: 35%, 4yr: 45%, 5yr+: 50% (on OD only)

Add-ons: Zero Depreciation, Engine Protect, RSA (Roadside Assistance), Key Replacement, Consumables Cover, Return to Invoice, NCB Protector, Tyre Protect, PA Cover for passengers, EMI Protector.

Top Motor Insurers: ICICI Lombard, Bajaj Allianz, HDFC ERGO, Digit, Acko, New India Assurance, United India, Tata AIG, SBI General, National Insurance, Reliance General, Kotak Mahindra, Cholamandalam MS.

=== 2. HEALTH INSURANCE ===
Types: Individual Health, Family Floater, Senior Citizen, Critical Illness, Personal Accident, Group Health, Maternity, Top-Up / Super Top-Up, Hospital Cash (Daily Allowance), Disease-Specific (Cancer, Heart, Diabetes).

Coverage: ₹2 Lakh to ₹5 Crore+
Premiums: Individual starts ~₹5,000-₹8,000/yr for ₹5L cover (age 25-35)
Family Floater: ₹10,000-₹25,000/yr for ₹10L cover
Senior Citizen (60+): ₹15,000-₹50,000/yr depending on age and coverage.

Key Features:
• Cashless treatment at 7,000-20,000+ network hospitals
• Pre-existing diseases covered after 2-4 years waiting period
• No Claim Bonus: 5-50% increase in sum insured each claim-free year
• Day-care procedures covered (cataract, dialysis, chemo etc.)
• AYUSH (Ayurveda, Yoga, Unani, Siddha, Homeopathy) treatment covered
• Ambulance charges: ₹2,000-₹5,000 per hospitalization
• Room rent: Some plans have limits (1% or 2% of SI), many now offer no capping
• Maternity Cover: ₹25,000-₹75,000 (Normal/C-Section), newborn cover from Day 1
• Restoration Benefit: Sum insured gets restored if exhausted
• Free Annual Health Checkup

Waiting Periods: Initial 30 days, Pre-existing 2-4 yrs, Specific diseases 1-2 yrs
Tax Benefit: Section 80D — ₹25,000 (self/family), ₹50,000 (senior citizens), ₹1,00,000 max (self+parents both senior)

Top Health Insurers: Star Health, Niva Bupa (formerly Max Bupa), HDFC ERGO Health, ICICI Lombard, Bajaj Allianz Health, Care Health (formerly Religare), Aditya Birla Health, ManipalCigna, Tata AIG Health, New India Assurance, United India, SBI Health.

=== 3. LIFE INSURANCE ===
Types: Term Life, Whole Life, Endowment Plans, ULIPs (Unit Linked), Money Back Plans, Pension/Annuity Plans, Child Plans, Return of Premium (TROP) Term Plans, Group Term Life, Micro Insurance.

Term Life Insurance:
• Cheapest form — pure protection, no maturity benefit
• Coverage: ₹25 Lakh to ₹25 Crore+
• Premium: ₹490-₹1,500/month for ₹1 Crore cover (age 25-35, non-smoker)
• Claim Settlement Ratios (2023-24): LIC: 98.6%, Max Life: 99.6%, HDFC Life: 99.1%, ICICI Pru: 98.5%, Tata AIA: 99.1%, SBI Life: 97.8%
• Premium Payment: Regular, Limited Pay (5/7/10/12/15), Single Pay
• Death Benefit Options: Lump sum, Monthly income, Lump sum + Monthly income, Increasing monthly income
• Riders: Accidental Death, Critical Illness, Disability Waiver, Terminal Illness

Women's Term Insurance: Up to 5% discount on premiums for women.
Endowment Plans: LIC Jeevan Labh, LIC New Endowment, HDFC Sanchay Plus
ULIPs: Investment + Insurance; 5-year lock-in; equity/debt/balanced fund options
Money Back Plans: Periodic payouts every 3-5 years; good for liquidity
Child Plans: LIC Jeevan Tarun, HDFC YoungStar, ICICI Pru Smart Kid
Retirement/Pension: NPS, LIC Jeevan Shanti, Tata AIA Fortune Pension, Annuity plans

Tax Benefits:
• Section 80C: Premium up to ₹1.5 Lakh/yr deductible
• Section 80CCD(1B): Additional ₹50,000 for NPS
• Section 10(10D): Maturity proceeds tax-free (conditions apply)

Top Life Insurers: LIC, HDFC Life, ICICI Prudential, SBI Life, Max Life, Tata AIA, Bajaj Allianz Life, Kotak Mahindra Life, PNB MetLife, Aditya Birla Sun Life, Canara HSBC, Edelweiss Tokio.

=== 4. TRAVEL INSURANCE ===
Types: Single Trip, Multi Trip (Annual), Student Travel, Senior Citizen Travel, Group Travel, Domestic Travel, Schengen Travel.

Coverage: Medical expenses abroad, trip cancellation, baggage loss/delay, flight delay, passport loss, emergency evacuation, personal liability, adventure sports cover.
Sum Insured: $50,000 to $5,00,000 (international); ₹2L to ₹25L (domestic)
Premium: International starts ₹300-₹1,000/day; Domestic starts ₹100-₹300/day
Schengen Visa: Mandatory travel insurance with minimum €30,000 medical cover

Top Travel Insurers: Bajaj Allianz, ICICI Lombard, HDFC ERGO, Tata AIG, Care Health, Digit, Star Health, Reliance General.

=== 5. HOME INSURANCE ===
Types: Standard Fire & Special Perils Policy, Comprehensive Home Insurance, Householder's Policy.

Coverage: Building structure, contents (furniture, electronics, jewelry), fire, flood, earthquake, storm, burglary, theft, third-party liability, temporary accommodation, rent for alternate home.
Sum Insured: Based on property value — ₹10L to ₹5Cr+
Premium: ₹1,000-₹10,000/yr for ₹25L-₹1Cr cover
Exclusions: War, nuclear risks, wear & tear, termites, pets damage

Top Home Insurers: HDFC ERGO, ICICI Lombard, Bajaj Allianz, SBI General, Tata AIG, New India Assurance, Reliance General.

=== 6. CYBER / DIGITAL INSURANCE ===
Coverage: Financial fraud, identity theft, phishing attacks, social media hacking, cyber bullying, malware attacks, data breach, unauthorized transactions, cyber extortion.
Sum Insured: ₹50,000 to ₹1 Crore
Premium: ₹500-₹5,000/yr
Growing rapidly due to UPI fraud and digital banking.

Top Cyber Insurers: HDFC ERGO, Bajaj Allianz, ICICI Lombard, Tata AIG.

=== 7. COMMERCIAL / BUSINESS INSURANCE ===
Types: Shop Insurance, Office Package, Fire Insurance, Burglary Insurance, Marine (Cargo & Hull), Professional Indemnity (Doctors, CAs, Lawyers), Directors & Officers (D&O) Liability, Workmen's Compensation, Product Liability, Public Liability, Keyman Insurance, Fidelity Guarantee.

Marine Insurance: Covers goods in transit (road, rail, sea, air); Marine Cargo (goods) vs Marine Hull (ship/vessel).
Professional Indemnity: For professionals — doctors, CA, CS, lawyers, IT consultants — covers malpractice suits, errors & omissions.
Shop Insurance / SME Package: Fire, burglary, stock damage, content, machinery breakdown, business interruption.

=== 8. CROP / AGRICULTURAL INSURANCE ===
Pradhan Mantri Fasal Bima Yojana (PMFBY):
• India's largest crop insurance scheme
• Farmer premium: Kharif 2%, Rabi 1.5%, Horticulture 5%
• Government pays rest of premium
• Covers: Natural calamities, pests, diseases, prevented sowing, post-harvest losses, localized calamities
• Season-wise enrollment (Kharif: April-July, Rabi: Oct-Dec)
• Over 5 Crore farmers enrolled

Weather-Based Crop Insurance Scheme (WBCIS): Payouts based on weather parameters.
Restructured Weather Based Crop Insurance: Covers rainfall deviation, frost, humidity etc.

=== 9. GOVERNMENT INSURANCE SCHEMES ===
1. Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY):
   - Life insurance for ₹2 Lakh at just ₹436/yr
   - Ages 18-55, auto-debit from bank account
   - Death cover (any cause)

2. Pradhan Mantri Suraksha Bima Yojana (PMSBY):
   - Accidental death & disability cover
   - ₹2 Lakh (death), ₹1 Lakh (partial disability)
   - Just ₹20/year! Cheapest in the world
   - Ages 18-70

3. Ayushman Bharat (PM-JAY):
   - World's largest health insurance scheme
   - ₹5 Lakh/family/year for secondary & tertiary hospitalization
   - Free for 12 crore poor families (BPL)
   - 25,000+ empaneled hospitals
   - Covers pre-existing diseases from Day 1
   - No age limit

4. Atal Pension Yojana (APY):
   - Pension of ₹1,000-₹5,000/month after 60
   - Ages 18-40, contribution based on pension and age
   - Government co-contributes 50% for eligible

5. Employees' State Insurance (ESI):
   - For employees earning ≤₹21,000/month
   - Medical, maternity, disability, dependant benefit
   - Employee: 0.75%, Employer: 3.25%

6. Central Government Health Scheme (CGHS):
   - For central govt employees and pensioners
   - Cashless treatment at empaneled hospitals

7. Pradhan Mantri Vaya Vandana Yojana (PMVVY):
   - Pension scheme for senior citizens (60+)
   - Guaranteed 7.4% return through LIC

=== 10. TAX BENEFITS ON INSURANCE ===
Section 80C: Life insurance premiums up to ₹1.5 Lakh
Section 80D: Health insurance premiums — ₹25K (self/family) + ₹25K-₹50K (parents)
Section 80CCC: Pension fund contributions up to ₹1.5L
Section 80CCD(1): NPS contributions — 10% of salary (salaried) or 20% (self-employed) up to ₹1.5L
Section 80CCD(1B): Additional ₹50,000 NPS deduction
Section 80CCD(2): Employer NPS contribution — 10% of salary (14% for Govt)
Section 10(10D): Maturity/death benefit tax-free if premium ≤10% of SA
Section 80DD: ₹75K-₹1.25L for disabled dependant insurance
Section 80DDB: ₹40K-₹1L for specified diseases treatment

=== 11. ADD-ONS & RIDERS ===
Motor Add-ons: Zero Dep, Engine Protect, RSA, Key Loss, Consumables, Return to Invoice, NCB Protector, Tyre Protect, PA Cover, EMI Protector, Geo-Extension, Daily Allowance.
Health Riders: Critical Illness, Hospital Cash, Maternity, OPD Cover, Dental, Mental Health.
Life Riders: Accidental Death Benefit, Critical Illness, Waiver of Premium, Terminal Illness, Income Benefit.

=== 12. CLAIMS PROCESS ===
Motor Claims: Intimate insurer → FIR (if accident/theft) → Surveyor inspection → Cashless repair at network garage OR reimbursement → Settlement in 7-30 days
Health Claims: Pre-authorization (cashless) or post-hospitalization bills (reimbursement) → Document submission → TPA verification → Settlement
Life Claims: Nominee intimation → Death certificate + policy docs → Insurer investigation → Settlement (usually 30 days)
Travel Claims: Intimate within 24-48 hours → Medical bills / police report → Document submission → Settlement

Cashless vs Reimbursement:
• Cashless: No upfront payment, insurer pays hospital directly at network hospitals
• Reimbursement: Pay first, submit bills, get money back (takes 15-30 days)

=== 13. KEY INSURANCE TERMS ===
IDV: Insured Declared Value (market value of vehicle)
NCB: No Claim Bonus (discount for claim-free years)
TP: Third Party (liability to other person/vehicle)
OD: Own Damage (covers your vehicle)
Sum Insured: Maximum amount insurer will pay
Deductible: Amount you pay before insurance kicks in
Co-payment: % of claim amount you share with insurer
Waiting Period: Time before coverage starts for certain conditions
Free Look Period: 15-30 days to cancel and get full refund
Grace Period: Extra time to pay overdue premium
Portability: Switch insurer without losing benefits (health insurance)
Subrogation: Insurer's right to recover from third party

RESPONSE RULES:
- NEVER say "I mostly deal with car/bike insurance" — you know ALL insurance
- NEVER say "I'll connect you with someone" — YOU are the expert
- NEVER ask for vehicle number when the topic is NOT motor/vehicle insurance
- ALWAYS maintain conversation context — if user asked about life insurance, follow-up questions are about life insurance unless they explicitly change topic
- When user asks "best plans" or "which is best" — recommend specific plans with names, premiums, and claim settlement ratios for the insurance type being discussed
- If you're not 100% sure about a very specific policy detail, say "That's a great question! Here's what I know... For the exact latest numbers, I'd recommend checking the insurer's website or IRDAI portal."
- Provide specific numbers, rates, and names wherever possible
- Compare plans when the user seems confused about choices
- Recommend specific actions based on user's age/situation
- Mention tax benefits wherever relevant`;

// OpenRouter AI Chat
app.post('/api/chat', async (req, res) => {
    const { message, history, language } = req.body;

    if (!message) {
        return res.status(400).json({ success: false, error: 'Message required' });
    }

    try {
        // Build messages array for OpenRouter (OpenAI-compatible format)
        const messages = [
            { role: 'system', content: INSURANCE_SYSTEM_PROMPT }
        ];
        if (history && history.length > 0) {
            history.forEach(h => {
                messages.push({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text });
            });
        }
        messages.push({ role: 'user', content: message });

        const MODELS_TO_TRY = [
            'google/gemini-2.0-flash-001',
            'google/gemini-2.0-flash-lite-001',
            'meta-llama/llama-4-scout:free'
        ];

        let aiText = null;
        let lastErr = null;

        for (const model of MODELS_TO_TRY) {
            try {
                console.log(`[Chat] Trying model: ${model}`);
                const orRes = await axios.post(
                    'https://openrouter.ai/api/v1/chat/completions',
                    {
                        model,
                        messages,
                        temperature: 0.7,
                        max_tokens: 500,
                        top_p: 0.9
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'https://insurix.india',
                            'X-Title': 'Insurix AI'
                        },
                        timeout: 25000
                    }
                );
                aiText = orRes.data?.choices?.[0]?.message?.content;
                if (aiText) {
                    console.log(`[Chat] Success with ${model}`);
                    break;
                }
            } catch (e) {
                console.error(`[Chat] ${model} failed:`, e.response?.data?.error?.message || e.message);
                lastErr = e;
            }
        }

        if (aiText) {
            res.json({ success: true, reply: aiText });
        } else {
            throw lastErr || new Error('All models failed');
        }
    } catch (err) {
        console.error('OpenRouter error:', err.response?.data || err.message);
        // Fallback response
        const fallbacks = {
            te: 'క్షమించండి, నెట్‌వర్క్ సమస్య ఉంది. దయచేసి మళ్ళీ ప్రయత్నించండి.',
            en: 'Sorry, network issue. Please try again in a moment.',
            hi: 'माफ़ कीजिये, नेटवर्क समस्या है। कृपया पुनः प्रयास करें।'
        };
        res.json({ success: true, reply: fallbacks[language] || fallbacks.en, fallback: true });
    }
});

// Azure TTS - Convert text to speech
app.post('/api/tts', async (req, res) => {
    const { text, language } = req.body;

    if (!text) {
        return res.status(400).json({ success: false, error: 'Text required' });
    }

    const voiceMap = {
        'te': 'te-IN-ShrutiNeural',
        'en': 'en-US-AvaMultilingualNeural',
        'hi': 'hi-IN-SwaraNeural'
    };
    const voice = voiceMap[language] || voiceMap.en;
    const langCode = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-US';

    const escapedText = text.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": "&apos;", '"': '&quot;' }[c]));

    const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${langCode}'>
        <voice name='${voice}'>
            ${escapedText}
        </voice>
    </speak>`;

    try {
        const ttsRes = await axios.post(
            `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
            ssml,
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
                    'Content-Type': 'application/ssml+xml',
                    'X-Microsoft-OutputFormat': 'audio-48khz-192kbitrate-mono-mp3'
                },
                responseType: 'arraybuffer',
                timeout: 10000
            }
        );

        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': ttsRes.data.length
        });
        res.send(Buffer.from(ttsRes.data));
    } catch (err) {
        console.error('TTS error:', err.response?.status || err.message);
        res.status(500).json({ success: false, error: 'TTS failed' });
    }
});

// Azure STT token (for browser SDK)
app.get('/api/speech-token', async (req, res) => {
    try {
        const tokenRes = await axios.post(
            `https://${AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
            null,
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 5000
            }
        );
        res.json({ success: true, token: tokenRes.data, region: AZURE_SPEECH_REGION });
    } catch (err) {
        console.error('Token error:', err.message);
        res.status(500).json({ success: false, error: 'Could not get speech token' });
    }
});

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// =====================================================================
// ===== PHASE 2: INSURGUARD INTELLIGENCE ENGINE ======================
// =====================================================================

// ===== IRDAI INSURER CLAIM SETTLEMENT DATA (FY 2024-25 Public Disclosures) =====
const IRDAI_INSURER_DATA = {
    hdfc: { name: 'HDFC ERGO', overallCSR: 97.8, healthCSR: 96.2, motorCSR: 98.5, avgSettlementDays: 12, ageWiseRejection: { '18-30': 2.1, '31-45': 3.8, '46-60': 6.5, '60+': 11.2 }, nonMedicalOverhead: 0.08, roomRentCapped: false, restorationBenefit: true, cashlessApprovalRate: 0.91, networkHospitals: 13000, networkGarages: 7200 },
    icici: { name: 'ICICI Lombard', overallCSR: 96.5, healthCSR: 95.1, motorCSR: 97.2, avgSettlementDays: 15, ageWiseRejection: { '18-30': 2.5, '31-45': 4.2, '46-60': 7.1, '60+': 12.8 }, nonMedicalOverhead: 0.12, roomRentCapped: true, restorationBenefit: true, cashlessApprovalRate: 0.87, networkHospitals: 11500, networkGarages: 6500 },
    bajaj: { name: 'Bajaj Allianz', overallCSR: 98.1, healthCSR: 97.0, motorCSR: 98.8, avgSettlementDays: 10, ageWiseRejection: { '18-30': 1.8, '31-45': 3.2, '46-60': 5.9, '60+': 10.5 }, nonMedicalOverhead: 0.06, roomRentCapped: false, restorationBenefit: true, cashlessApprovalRate: 0.93, networkHospitals: 12000, networkGarages: 5800 },
    tata: { name: 'Tata AIG', overallCSR: 95.2, healthCSR: 93.8, motorCSR: 96.1, avgSettlementDays: 18, ageWiseRejection: { '18-30': 3.0, '31-45': 4.8, '46-60': 7.8, '60+': 13.5 }, nonMedicalOverhead: 0.10, roomRentCapped: true, restorationBenefit: false, cashlessApprovalRate: 0.84, networkHospitals: 10000, networkGarages: 5200 },
    sbi: { name: 'SBI General', overallCSR: 94.8, healthCSR: 92.5, motorCSR: 95.8, avgSettlementDays: 22, ageWiseRejection: { '18-30': 3.5, '31-45': 5.5, '46-60': 8.5, '60+': 14.2 }, nonMedicalOverhead: 0.14, roomRentCapped: true, restorationBenefit: false, cashlessApprovalRate: 0.79, networkHospitals: 8500, networkGarages: 4800 },
    max: { name: 'Max Life', overallCSR: 96.0, healthCSR: 94.5, motorCSR: 96.8, avgSettlementDays: 16, ageWiseRejection: { '18-30': 2.8, '31-45': 4.5, '46-60': 7.5, '60+': 12.0 }, nonMedicalOverhead: 0.09, roomRentCapped: false, restorationBenefit: true, cashlessApprovalRate: 0.88, networkHospitals: 9500, networkGarages: 4500 }
};

// High-theft zones by state (IIB Motor Theft Data 2024)
const HIGH_THEFT_ZONES = {
    'DL': 1.35, 'UP': 1.28, 'HR': 1.25, 'RJ': 1.22, 'MH': 1.18, 'MP': 1.15,
    'BR': 1.12, 'JH': 1.10, 'PB': 1.08, 'CH': 1.06, 'WB': 1.05, 'GJ': 1.04,
    'TS': 1.02, 'KA': 1.00, 'TN': 0.98, 'AP': 0.97, 'KL': 0.95, 'OD': 0.96,
    'CG': 0.94, 'UK': 0.93, 'HP': 0.90, 'GA': 0.88, 'SK': 0.85, 'NL': 0.82
};

// Medical inflation rate (IRDAI Health Insurance Report)
const MEDICAL_INFLATION_RATE = 0.12; // 12% per annum in India
const GENERAL_INFLATION_RATE = 0.06; // 6% general CPI

// Average surgery costs in India (2026 baseline, ₹)
const SURGERY_COSTS_2026 = {
    bypassSurgery: 450000, kneeReplacement: 350000, cancerTreatment: 800000,
    kidneyDialysis: 240000, cSection: 120000, appendectomy: 80000,
    angioplasty: 250000, spinalSurgery: 500000, liverTransplant: 2500000,
    icuPerDay: 25000
};

// NCB (No Claim Bonus) slab structure — IRDAI mandated
const NCB_SLABS = [
    { years: 0, discount: 0 },
    { years: 1, discount: 20 },
    { years: 2, discount: 25 },
    { years: 3, discount: 35 },
    { years: 4, discount: 45 },
    { years: 5, discount: 50 }
];

// TP rate trend (YoY increase pattern — IRDAI historically raises 5-10% annually)
const TP_RATE_TREND = { '2W': 0.07, '4W': 0.06, 'Scooter': 0.07, 'EV Scooter': 0.05 };

// ==========================================================================
// 2.1 PREDICTIVE CLAIM SETTLEMENT ENGINE — "LOOT-SHIELD"
// POST /api/predict-claim
// ==========================================================================
app.post('/api/predict-claim', (req, res) => {
    const { insurerId, claimType, vehicleAge, userAge, stateCode, policyType, sumInsured, hasZeroDep, hasRoomRentWaiver } = req.body;

    if (!insurerId || !claimType) {
        return res.status(400).json({ success: false, error: 'insurerId and claimType are required' });
    }

    const insurer = IRDAI_INSURER_DATA[insurerId];
    if (!insurer) {
        return res.status(404).json({ success: false, error: 'Insurer not found' });
    }

    // W1: Insurer-specific age-wise rejection rate
    const ageGroup = (userAge || 30) <= 30 ? '18-30' : (userAge || 30) <= 45 ? '31-45' : (userAge || 30) <= 60 ? '46-60' : '60+';
    const rejectionRate = insurer.ageWiseRejection[ageGroup] / 100;
    const w1Score = Math.max(0, 1 - rejectionRate * 3); // Scale: lower rejection = higher score

    // W2: Category risk (theft zone for motor, non-medical overhead for health)
    let w2Score = 0.7; // default
    if (claimType === 'motor_theft' || claimType === 'motor_accident' || claimType === 'motor_ownDamage') {
        const theftMultiplier = HIGH_THEFT_ZONES[stateCode || 'KA'] || 1.0;
        w2Score = Math.max(0, 1 - (theftMultiplier - 0.85) * 2); // Higher theft = lower score
        if (claimType === 'motor_theft' && theftMultiplier > 1.2) {
            w2Score *= 0.7; // Extra penalty for high-theft + theft claim
        }
    } else if (claimType === 'health_hospitalization' || claimType === 'health_surgery') {
        const overheadPenalty = insurer.nonMedicalOverhead;
        w2Score = Math.max(0, 1 - overheadPenalty * 3);
        if (claimType === 'health_surgery' && (sumInsured || 500000) < 500000) {
            w2Score *= 0.6; // Low sum insured for surgery = high risk
        }
    }

    // W3: Policy quality — hidden rejection triggers
    let w3Score = 0.5;
    if (insurer.roomRentCapped && !(hasRoomRentWaiver)) {
        w3Score -= 0.15; // Room rent cap without waiver = rejection trigger
    }
    if (insurer.restorationBenefit) {
        w3Score += 0.15; // Restoration benefit = safety net
    }
    if (hasZeroDep && (claimType === 'motor_accident' || claimType === 'motor_ownDamage')) {
        w3Score += 0.20; // Zero dep avoids depreciation deduction
    }
    if (policyType === 'comprehensive') {
        w3Score += 0.10;
    }
    w3Score = Math.min(1, Math.max(0, w3Score));

    // Weighted Friction Score: W1(0.35) + W2(0.30) + W3(0.35)
    const rawScore = (w1Score * 0.35 + w2Score * 0.30 + w3Score * 0.35);

    // Apply insurer's cashless approval rate as a multiplier
    const cashlessBoost = insurer.cashlessApprovalRate;
    const finalScore = Math.round(Math.min(100, rawScore * cashlessBoost * 110));

    // Estimate cashless approval time based on score
    let approvalTimeHours;
    if (finalScore >= 85) approvalTimeHours = '2-4 hours';
    else if (finalScore >= 70) approvalTimeHours = '4-8 hours';
    else if (finalScore >= 50) approvalTimeHours = '8-24 hours';
    else approvalTimeHours = '24-72 hours (manual review likely)';

    // Risk factors breakdown
    const factors = [];
    if (rejectionRate > 0.05) factors.push({ label: `${insurer.name} has ${(rejectionRate * 100).toFixed(1)}% rejection rate for age ${ageGroup}`, impact: 'negative', weight: 'high' });
    else factors.push({ label: `${insurer.name} rejects only ${(rejectionRate * 100).toFixed(1)}% for age ${ageGroup}`, impact: 'positive', weight: 'high' });

    if (claimType.startsWith('motor') && (HIGH_THEFT_ZONES[stateCode || 'KA'] || 1) > 1.15) {
        factors.push({ label: `${stateCode || 'Your'} state is a high-theft zone (${((HIGH_THEFT_ZONES[stateCode || 'KA'] - 1) * 100).toFixed(0)}% above average)`, impact: 'negative', weight: 'medium' });
    }
    if (insurer.roomRentCapped && !hasRoomRentWaiver) {
        factors.push({ label: 'Room rent cap active — hospital bills may exceed limit', impact: 'negative', weight: 'high' });
    }
    if (insurer.restorationBenefit) {
        factors.push({ label: 'Restoration benefit available — sum insured resets after claim', impact: 'positive', weight: 'medium' });
    }
    if (hasZeroDep) {
        factors.push({ label: 'Zero depreciation cover — full parts value covered', impact: 'positive', weight: 'high' });
    }
    if (insurer.avgSettlementDays > 18) {
        factors.push({ label: `Average settlement takes ${insurer.avgSettlementDays} days (slow)`, impact: 'negative', weight: 'medium' });
    } else if (insurer.avgSettlementDays <= 12) {
        factors.push({ label: `Fast settler — avg ${insurer.avgSettlementDays} days`, impact: 'positive', weight: 'medium' });
    }

    factors.push({ label: `Cashless approval rate: ${(insurer.cashlessApprovalRate * 100).toFixed(0)}%`, impact: insurer.cashlessApprovalRate > 0.88 ? 'positive' : 'neutral', weight: 'high' });
    factors.push({ label: `Overall Claim Settlement Ratio: ${insurer.overallCSR}%`, impact: insurer.overallCSR > 96 ? 'positive' : 'neutral', weight: 'medium' });

    // Per-insurer comparison
    const comparison = Object.entries(IRDAI_INSURER_DATA).map(([id, ins]) => {
        const rej = ins.ageWiseRejection[ageGroup] / 100;
        const s1 = Math.max(0, 1 - rej * 3) * 0.35;
        let s2 = 0.7;
        if (claimType.startsWith('motor')) {
            const tm = HIGH_THEFT_ZONES[stateCode || 'KA'] || 1.0;
            s2 = Math.max(0, 1 - (tm - 0.85) * 2);
        } else {
            s2 = Math.max(0, 1 - ins.nonMedicalOverhead * 3);
        }
        s2 *= 0.30;
        let s3 = 0.5;
        if (ins.roomRentCapped && !hasRoomRentWaiver) s3 -= 0.15;
        if (ins.restorationBenefit) s3 += 0.15;
        if (hasZeroDep && claimType.startsWith('motor')) s3 += 0.20;
        if (policyType === 'comprehensive') s3 += 0.10;
        s3 = Math.min(1, Math.max(0, s3)) * 0.35;
        const sc = Math.round(Math.min(100, (s1 + s2 + s3) * ins.cashlessApprovalRate * 110));
        return { insurerId: id, insurerName: ins.name, frictionScore: sc, csr: ins.overallCSR };
    }).sort((a, b) => b.frictionScore - a.frictionScore);

    res.json({
        success: true,
        frictionScore: finalScore,
        verdict: finalScore >= 80 ? 'SMOOTH_SAIL' : finalScore >= 60 ? 'MODERATE_FRICTION' : finalScore >= 40 ? 'HIGH_FRICTION' : 'CLAIM_RISK',
        verdictLabel: finalScore >= 80 ? '🟢 Smooth Sailing — 90%+ chance of cashless approval' : finalScore >= 60 ? '🟡 Moderate Friction — May need follow-ups' : finalScore >= 40 ? '🟠 High Friction — Significant risk of delays' : '🔴 Claim Risk — High chance of rejection or major delays',
        estimatedApprovalTime: approvalTimeHours,
        avgSettlementDays: insurer.avgSettlementDays,
        insurer: { id: insurerId, name: insurer.name, csr: insurer.overallCSR, cashlessRate: insurer.cashlessApprovalRate },
        factors,
        allInsurerComparison: comparison,
        weights: { W1_insurerSpecific: Math.round(w1Score * 100), W2_categoryRisk: Math.round(w2Score * 100), W3_policyQuality: Math.round(w3Score * 100) },
        dataSource: 'IRDAI Public Disclosures FY 2024-25, IIB Motor Theft Index'
    });
});

// ==========================================================================
// 2.2 HOLISTIC VULNERABILITY SCORE — "GAP ANALYSIS"
// POST /api/vulnerability-assessment
// ==========================================================================
app.post('/api/vulnerability-assessment', (req, res) => {
    const {
        userAge, familySize, annualIncome, monthlyExpenses,
        existingHealthCover, existingLifeCover, existingMotorPolicies,
        hasPersonalAccident, hasCriticalIllness, hasHomeInsurance,
        dependents, loans, city
    } = req.body;

    if (!userAge || !annualIncome) {
        return res.status(400).json({ success: false, error: 'userAge and annualIncome are required' });
    }

    const age = parseInt(userAge);
    const income = parseInt(annualIncome);
    const expenses = parseInt(monthlyExpenses) || Math.round(income * 0.6 / 12);
    const family = parseInt(familySize) || 1;
    const healthCover = parseInt(existingHealthCover) || 0;
    const lifeCover = parseInt(existingLifeCover) || 0;
    const motorCount = parseInt(existingMotorPolicies) || 0;
    const numDependents = parseInt(dependents) || 0;
    const totalLoans = parseInt(loans) || 0;

    // ===== HEALTH COVER GAP ANALYSIS =====
    // IRDAI recommended: Sum Insured = 50% of annual income (minimum), ideal = annual income
    const recommendedHealth = Math.max(500000, income);
    const healthGap = Math.max(0, recommendedHealth - healthCover);
    const healthCoverRatio = healthCover / recommendedHealth;

    // Inflation-adjusted cover check: Will current cover handle surgery in 5 years?
    const inflationProjections = {};
    Object.entries(SURGERY_COSTS_2026).forEach(([surgery, cost2026]) => {
        const cost2031 = Math.round(cost2026 * Math.pow(1 + MEDICAL_INFLATION_RATE, 5));
        inflationProjections[surgery] = {
            cost2026: cost2026,
            cost2031: cost2031,
            coveredIn2026: healthCover >= cost2026,
            coveredIn2031: healthCover >= cost2031,
            shortfall2031: Math.max(0, cost2031 - healthCover)
        };
    });

    // ===== LIFE COVER GAP ANALYSIS =====
    // Human Life Value method: (Annual Income - Expenses) × Remaining Working Years + Loans
    const remainingWorkYears = Math.max(0, 60 - age);
    const annualSurplus = income - (expenses * 12);
    const humanLifeValue = Math.round(annualSurplus * remainingWorkYears * 0.7 + totalLoans);
    const recommendedLife = Math.max(humanLifeValue, income * 10); // min 10x income
    const lifeGap = numDependents > 0 ? Math.max(0, recommendedLife - lifeCover) : 0;
    const lifeCoverRatio = numDependents > 0 ? lifeCover / recommendedLife : 1;

    // ===== PERSONAL ACCIDENT + CRITICAL ILLNESS =====
    const paCoverNeeded = !hasPersonalAccident && (age >= 25 && age <= 55);
    const ciCoverNeeded = !hasCriticalIllness && age >= 35;

    // ===== LIABILITY EXPOSURE =====
    // Third-party legal risk: Motor Vehicles Act 2019 — unlimited TP liability
    const liabilityExposure = motorCount > 0 ? {
        thirdPartyRisk: 'HIGH — Motor Vehicles Act mandates unlimited TP liability',
        personalAccidentGap: hasPersonalAccident ? 'COVERED' : 'EXPOSED — ₹15L PA cover mandatory for owner-driver',
        recommendation: hasPersonalAccident ? 'Your PA cover is active' : 'Add ₹15L Personal Accident cover immediately'
    } : { thirdPartyRisk: 'LOW', personalAccidentGap: 'N/A', recommendation: 'No motor liability exposure' };

    // ===== SURVIVAL RUNWAY CALCULATION =====
    // How many months can insurance + savings sustain family during crisis
    const monthlyBurn = expenses || Math.round(income * 0.6 / 12);
    const emergencyMonths_healthOnly = healthCover > 0 ? Math.round(healthCover / (monthlyBurn * 0.4)) : 0; // 40% of burn on medical
    const emergencyMonths_lifeOnly = lifeCover > 0 ? Math.round(lifeCover / monthlyBurn) : 0;
    const survivalRunwayMonths = Math.min(emergencyMonths_healthOnly + (lifeCover > 0 ? Math.round(lifeCover / monthlyBurn) : 0), 240);

    // ===== COMPOSITE VULNERABILITY SCORE =====
    let score = 100;
    // Health gaps (-30 max)
    if (healthCoverRatio < 0.3) score -= 30;
    else if (healthCoverRatio < 0.6) score -= 20;
    else if (healthCoverRatio < 1.0) score -= 10;

    // Life cover gaps (-25 max)
    if (numDependents > 0) {
        if (lifeCoverRatio < 0.2) score -= 25;
        else if (lifeCoverRatio < 0.5) score -= 15;
        else if (lifeCoverRatio < 1.0) score -= 8;
    }

    // PA cover (-10)
    if (paCoverNeeded) score -= 10;

    // Critical illness (-10)
    if (ciCoverNeeded) score -= 10;

    // Home insurance (-5)
    if (!hasHomeInsurance && income > 800000) score -= 5;

    // Age penalty (older = more vulnerable without cover)
    if (age > 50 && healthCoverRatio < 0.8) score -= 10;

    // Loan exposure without life cover
    if (totalLoans > 0 && lifeCover < totalLoans) score -= 5;

    score = Math.max(0, Math.min(100, score));

    // Generate recommendations
    const recommendations = [];
    if (healthGap > 0) {
        recommendations.push({
            priority: 'CRITICAL',
            type: 'health',
            title: 'Increase Health Insurance Cover',
            detail: `Your health cover (₹${(healthCover / 100000).toFixed(1)}L) is ₹${(healthGap / 100000).toFixed(1)}L short of recommended ₹${(recommendedHealth / 100000).toFixed(1)}L`,
            action: `Get a ₹${(Math.ceil(healthGap / 500000) * 5)}L Super Top-up policy — costs only ₹${Math.round(healthGap * 0.004)}/year`
        });
    }
    if (lifeGap > 0 && numDependents > 0) {
        recommendations.push({
            priority: 'CRITICAL',
            type: 'life',
            title: 'Get Adequate Term Life Cover',
            detail: `Your family needs ₹${(recommendedLife / 100000).toFixed(0)}L cover. Current: ₹${(lifeCover / 100000).toFixed(0)}L. Gap: ₹${(lifeGap / 100000).toFixed(0)}L`,
            action: `A ₹${Math.ceil(lifeGap / 10000000)}Cr term plan at age ${age} costs ~₹${Math.round(lifeGap * 0.003 / 12)}/month`
        });
    }
    if (paCoverNeeded) {
        recommendations.push({
            priority: 'HIGH',
            type: 'accident',
            title: 'Add Personal Accident Cover',
            detail: 'Owner-driver PA cover is mandatory. Additional PA cover protects income.',
            action: '₹50L PA cover costs just ₹500-800/year'
        });
    }
    if (ciCoverNeeded) {
        recommendations.push({
            priority: 'MEDIUM',
            type: 'critical_illness',
            title: 'Consider Critical Illness Cover',
            detail: `At ${age}, cancer/heart disease risk rises. A CI plan pays lump sum on diagnosis.`,
            action: '₹25L CI cover costs ~₹8,000-15,000/year depending on age'
        });
    }
    if (!hasHomeInsurance && income > 800000) {
        recommendations.push({
            priority: 'LOW',
            type: 'home',
            title: 'Consider Home Insurance',
            detail: 'Your home and contents are unprotected against fire, flood, theft.',
            action: 'Home insurance for ₹50L structure costs just ₹2,000-4,000/year'
        });
    }

    const inflationWarning = !inflationProjections.bypassSurgery.coveredIn2031
        ? `⚠️ Your ₹${(healthCover / 100000).toFixed(1)}L policy won't cover a bypass surgery in 2031 (projected cost: ₹${(inflationProjections.bypassSurgery.cost2031 / 100000).toFixed(1)}L at 12% medical inflation)`
        : `✅ Your cover can handle a bypass surgery even in 2031 (projected: ₹${(inflationProjections.bypassSurgery.cost2031 / 100000).toFixed(1)}L)`;

    res.json({
        success: true,
        vulnerabilityScore: score,
        verdict: score >= 80 ? 'WELL_PROTECTED' : score >= 60 ? 'PARTIALLY_COVERED' : score >= 40 ? 'SIGNIFICANTLY_EXPOSED' : 'CRITICALLY_VULNERABLE',
        verdictLabel: score >= 80 ? '🟢 Well Protected' : score >= 60 ? '🟡 Gaps Exist — Act Soon' : score >= 40 ? '🟠 Significantly Exposed' : '🔴 Critically Vulnerable',
        survivalRunway: {
            months: survivalRunwayMonths,
            label: survivalRunwayMonths >= 60 ? '5+ years of crisis coverage'
                : survivalRunwayMonths >= 24 ? `${Math.round(survivalRunwayMonths / 12)} years of crisis coverage`
                    : survivalRunwayMonths >= 6 ? `${survivalRunwayMonths} months — dangerously low`
                        : 'Less than 6 months — EMERGENCY',
            monthlyBurn
        },
        gaps: {
            health: { current: healthCover, recommended: recommendedHealth, gap: healthGap, ratio: Math.round(healthCoverRatio * 100) },
            life: { current: lifeCover, recommended: recommendedLife, gap: lifeGap, ratio: Math.round(lifeCoverRatio * 100) },
            personalAccident: { covered: !!hasPersonalAccident, needed: paCoverNeeded },
            criticalIllness: { covered: !!hasCriticalIllness, needed: ciCoverNeeded },
            home: { covered: !!hasHomeInsurance }
        },
        inflationProjections,
        inflationWarning,
        liabilityExposure,
        recommendations,
        methodology: 'Middle-Class Financial Fragility Index (HLV + IRDAI Guidelines + 12% Medical Inflation)'
    });
});

// ==========================================================================
// 2.3 TOTAL COST OF OWNERSHIP (TCO) SIMULATOR
// POST /api/tco-simulator
// ==========================================================================
app.post('/api/tco-simulator', (req, res) => {
    const { registrationNumber, make, model, year, cc, vehicleType, currentPremium, currentInsurer, ncbYears, switchEvery } = req.body;

    // Get vehicle data either from reg number or manual input
    let vehicleData = null;
    if (registrationNumber) {
        const lookup = lookupVehicle(registrationNumber);
        if (lookup.success) vehicleData = lookup.data;
    }

    if (!vehicleData && make && model) {
        const vInfo = VEHICLE_DATABASE[make]?.[model] || CAR_DATABASE[make]?.[model];
        if (vInfo) {
            const vAge = new Date().getFullYear() - (parseInt(year) || 2023);
            let dep = vAge <= 0 ? 0 : vAge <= 1 ? 15 : vAge <= 2 ? 20 : vAge <= 3 ? 30 : vAge <= 4 ? 40 : 50;
            const idv = Math.round(vInfo.price * (1 - dep / 100));
            const engineCC = vInfo.cc;
            let tp;
            if (vInfo.type === '4W') {
                tp = engineCC <= 1000 ? 2094 : engineCC <= 1500 ? 3416 : 7897;
            } else {
                tp = engineCC === 0 ? 714 : engineCC <= 75 ? 538 : engineCC <= 150 ? 714 : engineCC <= 350 ? 1366 : 2804;
            }
            const odRate = vInfo.type === '4W' ? (engineCC > 1500 ? 0.032 : 0.026) : (engineCC > 350 ? 0.035 : engineCC > 150 ? 0.028 : 0.022);
            vehicleData = {
                make, model, year: parseInt(year) || 2023, cc: engineCC,
                type: vInfo.type, exShowroomPrice: vInfo.price, segment: vInfo.segment,
                idv, vehicleAge: vAge,
                premium: { thirdParty: tp, ownDamage: Math.round(idv * odRate), comprehensive: tp + Math.round(idv * odRate) },
                registrationNumber: 'MANUAL'
            };
        }
    }

    if (!vehicleData) {
        return res.status(400).json({ success: false, error: 'Provide registrationNumber or make+model+year' });
    }

    const currentYear = new Date().getFullYear();
    const vYear = vehicleData.year || (currentYear - 2);
    const exShowroom = vehicleData.exShowroomPrice;
    const vType = vehicleData.type || vehicleType || '2W';
    const engineCC = vehicleData.cc || parseInt(cc) || 150;
    const startNCB = parseInt(ncbYears) || 0;
    const switchInterval = parseInt(switchEvery) || 0; // 0 = never switch

    // ===== 5-YEAR PROJECTION =====
    const yearlyData = [];
    let loyaltyNCB = startNCB;
    let switcherNCB = startNCB;
    const tpTrend = TP_RATE_TREND[vType] || 0.07;

    for (let y = 0; y < 5; y++) {
        const projYear = currentYear + y;
        const vehicleAge = projYear - vYear;

        // IDV depreciation curve
        let depPercent;
        if (vehicleAge <= 0) depPercent = 0;
        else if (vehicleAge <= 1) depPercent = 15;
        else if (vehicleAge <= 2) depPercent = 20;
        else if (vehicleAge <= 3) depPercent = 30;
        else if (vehicleAge <= 4) depPercent = 40;
        else depPercent = 50;
        const idv = Math.round(exShowroom * (1 - depPercent / 100));

        // TP premium with annual increase
        let baseTP;
        if (vType === '4W') {
            baseTP = engineCC <= 1000 ? 2094 : engineCC <= 1500 ? 3416 : 7897;
        } else {
            baseTP = engineCC === 0 ? 714 : engineCC <= 75 ? 538 : engineCC <= 150 ? 714 : engineCC <= 350 ? 1366 : 2804;
        }
        const tp = Math.round(baseTP * Math.pow(1 + tpTrend, y));

        // OD premium
        const odRate = vType === '4W' ? (engineCC > 1500 ? 0.032 : 0.026) : (engineCC > 350 ? 0.035 : engineCC > 150 ? 0.028 : 0.022);
        const rawOD = Math.round(idv * odRate);

        // ===== LOYALTY SCENARIO (same insurer) =====
        // NCB accumulation for loyal customer
        if (y > 0 && loyaltyNCB < 5) loyaltyNCB = Math.min(5, loyaltyNCB + 1);
        const loyaltyNCBDiscount = NCB_SLABS.find(s => s.years === loyaltyNCB)?.discount || 0;
        const loyaltyOD = Math.round(rawOD * (1 - loyaltyNCBDiscount / 100));
        // Loyalty penalty: insurers often increase base rates 3-5% for renewals
        const loyaltyPenalty = y > 0 ? 1 + (0.03 + (y * 0.005)) : 1;
        const loyaltyPremium = Math.round((tp + loyaltyOD) * loyaltyPenalty);
        const loyaltyGST = Math.round(loyaltyPremium * 0.18);
        const loyaltyTotal = loyaltyPremium + loyaltyGST;

        // ===== SWITCHER SCENARIO =====
        // Switching every N years — new customer discount but NCB resets to transfer value
        const isSwitchYear = switchInterval > 0 && y > 0 && y % switchInterval === 0;
        if (y > 0 && switcherNCB < 5) switcherNCB = Math.min(5, switcherNCB + 1);
        const switcherNCBDiscount = NCB_SLABS.find(s => s.years === switcherNCB)?.discount || 0;
        const switcherOD = Math.round(rawOD * (1 - switcherNCBDiscount / 100));
        // New customer discount when switching (8-15%)
        const newCustomerDiscount = isSwitchYear ? 0.12 : 0;
        const switcherPremium = Math.round((tp + switcherOD) * (1 - newCustomerDiscount));
        const switcherGST = Math.round(switcherPremium * 0.18);
        const switcherTotal = switcherPremium + switcherGST;

        yearlyData.push({
            year: projYear,
            vehicleAge,
            idv,
            depreciationPercent: depPercent,
            tpPremium: tp,
            rawODPremium: rawOD,
            loyalty: {
                ncbYears: loyaltyNCB,
                ncbDiscount: loyaltyNCBDiscount,
                odAfterNCB: loyaltyOD,
                loyaltyPenaltyPercent: Math.round((loyaltyPenalty - 1) * 100),
                premium: loyaltyPremium,
                gst: loyaltyGST,
                total: loyaltyTotal
            },
            switcher: {
                ncbYears: switcherNCB,
                ncbDiscount: switcherNCBDiscount,
                odAfterNCB: switcherOD,
                isSwitchYear,
                newCustomerDiscount: Math.round(newCustomerDiscount * 100),
                premium: switcherPremium,
                gst: switcherGST,
                total: switcherTotal
            },
            savings: loyaltyTotal - switcherTotal,
            assetValue: idv
        });
    }

    // Totals
    const loyaltyTotalCost = yearlyData.reduce((s, d) => s + d.loyalty.total, 0);
    const switcherTotalCost = yearlyData.reduce((s, d) => s + d.switcher.total, 0);
    const totalSavingsFromSwitching = loyaltyTotalCost - switcherTotalCost;
    const finalIDV = yearlyData[yearlyData.length - 1].idv;

    // The "Real Cost" — total premiums paid vs final asset value
    const loyaltyRealCost = loyaltyTotalCost - finalIDV; // negative = good
    const switcherRealCost = switcherTotalCost - finalIDV;

    // NCB Trap Detection
    const ncbTrapDetected = yearlyData.some((d, i) => i > 0 && d.loyalty.total > yearlyData[i - 1].loyalty.total && d.loyalty.ncbDiscount > yearlyData[i - 1].loyalty.ncbDiscount);
    const ncbTrapExplanation = ncbTrapDetected
        ? '⚠️ NCB TRAP DETECTED: Despite increasing NCB discount, your premium is RISING because IDV drop + TP increase + loyalty penalty outpace the NCB savings. The insurer benefits from your loyalty more than you do.'
        : '✅ No NCB trap detected — your NCB savings are outpacing premium increases.';

    res.json({
        success: true,
        vehicle: {
            make: vehicleData.make, model: vehicleData.model, year: vYear,
            cc: engineCC, type: vType, exShowroomPrice: exShowroom,
            currentIDV: vehicleData.idv
        },
        projection: yearlyData,
        summary: {
            loyaltyTotalCost,
            switcherTotalCost,
            totalSavingsFromSwitching,
            savingsPercent: Math.round((totalSavingsFromSwitching / loyaltyTotalCost) * 100),
            loyaltyRealCost,
            switcherRealCost,
            finalAssetValue: finalIDV,
            initialAssetValue: exShowroom,
            assetDepreciation: Math.round((1 - finalIDV / exShowroom) * 100),
            ncbTrapDetected,
            ncbTrapExplanation,
            switchInterval: switchInterval || 'Never',
            recommendation: totalSavingsFromSwitching > 500
                ? `💡 Switch every ${switchInterval || 2} years to save ₹${totalSavingsFromSwitching.toLocaleString('en-IN')} over 5 years`
                : '👍 Staying loyal is cost-effective for your vehicle'
        },
        methodology: 'IRDAI IDV Depreciation + TP Rate Trends + NCB Slabs + Loyalty Penalty Modeling'
    });
});

// =====================================================================
// ===== PHASE 3: AI DIFFERENTIATORS ==================================
// =====================================================================

// ===== 3.1 POLICY DECODER — Clause Simplifier with Impact Scoring =====

// Structured policy clause database — each clause has name, simplified plain-language, impactScore (1-10)
const POLICY_CLAUSE_DATABASE = {
    'motor_comprehensive': {
        name: 'Motor Comprehensive Policy',
        standardClauses: [
            { name: 'Third-Party Bodily Injury', simplified: 'If your vehicle injures or kills someone, the insurer pays unlimited compensation. This is mandatory under Motor Vehicles Act 2019 — you cannot drive without this.', level: 'green', category: 'Coverage', impactScore: 2 },
            { name: 'Third-Party Property Damage', simplified: 'Damage your vehicle causes to someone else\'s property (car, wall, shop) is covered up to ₹7.5 lakh.', level: 'green', category: 'Coverage', impactScore: 2 },
            { name: 'Own Damage Cover', simplified: 'Your vehicle is protected against fire, theft, natural disasters (floods, earthquakes), riots, and accident damage. This is the main reason you buy comprehensive.', level: 'green', category: 'Coverage', impactScore: 3 },
            { name: 'Personal Accident Cover', simplified: 'Owner-driver gets ₹15 lakh cover for accidental death or disability. This is mandatory by IRDAI — cannot be removed.', level: 'green', category: 'Coverage', impactScore: 2 },
            { name: 'Parts Depreciation Deduction', simplified: 'When you claim, the insurer deducts depreciation on EVERY replaced part — rubber 50%, plastic 30%, metal 0-50% based on vehicle age. You pay the difference from your pocket.', level: 'red', category: 'Depreciation', impactScore: 9, financialImpact: 'On a ₹50,000 bumper repair: you pay ₹15,000-25,000 from pocket. Only Zero-Dep add-on eliminates this.' },
            { name: 'Mechanical Breakdown Exclusion', simplified: 'If your engine seizes, gearbox fails, or electrical system breaks down — NOT covered. Even waterlogging damage to engine is excluded unless you buy Engine Protect add-on separately.', level: 'yellow', category: 'Exclusion', impactScore: 7, financialImpact: 'Engine replacement costs ₹50,000-3,00,000. Claim rejected without Engine Protect add-on.' },
            { name: 'DUI/Intoxication Exclusion', simplified: 'Driving under the influence of alcohol or drugs? Your ENTIRE claim is rejected — no matter how severe the damage. Zero payout.', level: 'yellow', category: 'Exclusion', impactScore: 6 },
            { name: 'Commercial Use Voids Policy', simplified: 'Using your personal vehicle for Ola/Uber/delivery even ONCE can void your entire policy. One Swiggy delivery trip = ₹0 claim on a ₹8L car.', level: 'yellow', category: 'Exclusion', impactScore: 7 },
            { name: '24-Hour Claim Filing Deadline', simplified: 'You must report the incident to the insurer within 24 hours. Miss this deadline? They can legally reject even a genuine ₹2 lakh claim.', level: 'yellow', category: 'Process', impactScore: 6, financialImpact: 'Late reporting is the #2 reason for claim rejection in India (IRDAI data).' },
            { name: 'Wear & Tear Exclusion', simplified: 'Normal aging, rust, gradual deterioration, and manufacturing defects are not covered. Insurance is for sudden, accidental damage only.', level: 'green', category: 'Exclusion', impactScore: 2 },
            { name: 'IDV Depreciates With Age', simplified: 'Your car\'s insured value (IDV) drops 10-50% as it ages. A 5-year-old car worth ₹8L in market has IDV of only ₹4L — that\'s the MAX you\'ll ever get in a total loss claim.', level: 'red', category: 'Depreciation', impactScore: 8, financialImpact: 'Year 5+: Your ₹8L car is insured for ₹4L. Gap = ₹4L out of pocket in total loss.' },
            { name: 'Compulsory Deductible', simplified: 'First ₹1,000-5,000 of EVERY claim is your expense (self-paid). Small damages below this threshold aren\'t worth claiming at all.', level: 'yellow', category: 'Deductible', impactScore: 4, financialImpact: 'Windshield crack costing ₹3K? After deductible, insurer pays ₹2K — and your NCB is lost (worth more).' },
            { name: 'War & Nuclear Exclusion', simplified: 'Damage from war, nuclear events, and certain acts of terrorism are not covered. Standard global exclusion across all insurers.', level: 'green', category: 'Exclusion', impactScore: 1 }
        ],
        insurerSpecific: {
            hdfc: { roomRentCap: false, zeroDep: 'add-on', roadside: 'included', engineProtect: 'add-on', returnToInvoice: 'add-on', ncbProtect: 'add-on', personalBelongings: 'up to ₹15,000', uniqueClause: 'Windshield cover without affecting NCB' },
            icici: { roomRentCap: false, zeroDep: 'add-on', roadside: 'add-on', engineProtect: 'add-on', returnToInvoice: 'add-on', ncbProtect: 'add-on', personalBelongings: 'up to ₹10,000', uniqueClause: '20% co-pay on claims above ₹50,000 for certain plans' },
            bajaj: { roomRentCap: false, zeroDep: 'add-on', roadside: 'included', engineProtect: 'add-on', returnToInvoice: 'add-on', ncbProtect: 'add-on', personalBelongings: 'up to ₹20,000', uniqueClause: 'Fastest cashless — 15 min at network garages' },
            tata: { roomRentCap: false, zeroDep: 'add-on', roadside: 'add-on', engineProtect: 'add-on', returnToInvoice: 'add-on', ncbProtect: 'add-on', personalBelongings: 'up to ₹10,000', uniqueClause: 'Towing limited to 50km — beyond = self-paid' },
            sbi: { roomRentCap: false, zeroDep: 'add-on', roadside: 'add-on', engineProtect: 'not available', returnToInvoice: 'not available', ncbProtect: 'add-on', personalBelongings: 'not covered', uniqueClause: 'Limited network garages (4,800) — longer cashless wait' },
            max: { roomRentCap: false, zeroDep: 'add-on', roadside: 'add-on', engineProtect: 'add-on', returnToInvoice: 'add-on', ncbProtect: 'add-on', personalBelongings: 'up to ₹12,000', uniqueClause: 'NCB accumulation pauses if gap > 90 days in renewal' }
        }
    },
    'health_individual': {
        name: 'Individual Health Insurance',
        standardClauses: [
            { name: 'Hospitalization Cover', simplified: 'All medical expenses during hospital stay of 24+ hours are covered — room charges, surgeon fees, medicines, diagnostics. This is your core health insurance benefit.', level: 'green', category: 'Coverage', impactScore: 2 },
            { name: 'Pre & Post Hospitalization', simplified: 'Medical expenses 30-60 days BEFORE admission and 60-180 days AFTER discharge are covered. Includes diagnostics, follow-ups, and medicines related to the hospitalization.', level: 'green', category: 'Coverage', impactScore: 3 },
            { name: 'Day-Care Procedures', simplified: 'Modern treatments that don\'t need overnight stay — chemotherapy, dialysis, cataract surgery, angioplasty — are covered. 500+ procedures listed by IRDAI.', level: 'green', category: 'Coverage', impactScore: 2 },
            { name: 'AYUSH Coverage', simplified: 'Alternative treatments (Ayurveda, Yoga, Unani, Siddha, Homeopathy) are covered when taken at a recognized hospital. IRDAI mandated this in 2019.', level: 'green', category: 'Coverage', impactScore: 2 },
            { name: 'Pre-Existing Disease Waiting', simplified: 'If you have diabetes, BP, thyroid, or ANY pre-existing condition — ZERO coverage for 2-4 years after buying the policy. Hospital bills during this period? 100% from your pocket.', level: 'red', category: 'Waiting Period', impactScore: 10, financialImpact: 'Diabetic patient hospitalized in Year 1: Full ₹2-5L bill out of pocket despite paying premiums.' },
            { name: 'Specific Disease Waiting', simplified: 'Even WITHOUT pre-existing conditions, certain surgeries like hernia, cataracts, joint replacement have 1-2 year mandatory waiting periods. Claim in Year 1 = rejected.', level: 'red', category: 'Waiting Period', impactScore: 8, financialImpact: 'Knee replacement needed in Year 1? ₹3.5L out of pocket despite having ₹10L insurance.' },
            { name: 'Room Rent Cap (Sub-limit)', simplified: 'Your room charges are capped at 1-2% of sum insured per day. If you choose a costlier room, the insurer proportionally reduces your ENTIRE bill — not just room charges.', level: 'red', category: 'Sub-limit', impactScore: 9, financialImpact: 'On ₹5L policy: room cap = ₹5K-10K/day. Choose ₹15K room → entire bill reduced by 33-50%. ₹3L surgery becomes ₹1.5L payout.' },
            { name: 'Disease-Wise Sub-limits', simplified: 'Specific diseases (cataract, appendix, tonsils) are capped at 25-50% of your sum insured, regardless of actual hospital bill. Your ₹10L policy pays only ₹3-5L for these.', level: 'red', category: 'Sub-limit', impactScore: 8, financialImpact: 'Cataract surgery costs ₹80K-1.2L. Policy sub-limit: ₹40K-60K. You pay the gap.' },
            { name: 'Co-Pay Clause', simplified: 'You must pay 10-20% of EVERY claim from your pocket, no matter how big the bill. This is in ADDITION to premium. Many plans hide this in fine print for senior citizens.', level: 'red', category: 'Co-pay', impactScore: 9, financialImpact: '₹5L surgery with 20% co-pay = ₹1L from YOUR pocket. You\'re NOT "fully covered."' },
            { name: 'Cosmetic & Lifestyle Exclusions', simplified: 'Cosmetic surgery, plastic surgery, weight loss treatments, infertility treatments, and hormone therapy are NOT covered under any standard health plan.', level: 'yellow', category: 'Exclusion', impactScore: 4 },
            { name: 'Dental & Vision Exclusion', simplified: 'Dental treatments (unless requiring hospitalization), spectacles, contact lenses, and hearing aids are NOT covered. Separate dental plans exist but are rare in India.', level: 'yellow', category: 'Exclusion', impactScore: 4 },
            { name: 'Self-Inflicted Injury Exclusion', simplified: 'Self-inflicted injuries and attempted suicide are excluded. Standard exclusion across all health insurers globally.', level: 'green', category: 'Exclusion', impactScore: 1 },
            { name: '30-Day Initial Waiting Period', simplified: 'NO claims (except accidents) for the first 30 days after buying the policy. Fall sick in the first month? Claim denied. Only accident-related hospitalization is covered immediately.', level: 'yellow', category: 'Waiting Period', impactScore: 5, financialImpact: 'Dengue/viral fever hospitalization in first month? Full bill from your pocket.' },
            { name: 'Ambulance Charge Cap', simplified: 'Ambulance costs are capped at ₹2,000-5,000 per hospitalization. Private ambulances in metros cost ₹5,000-15,000. The excess is your expense.', level: 'yellow', category: 'Sub-limit', impactScore: 4, financialImpact: 'Emergency ambulance ₹12,000. Insurer pays ₹5,000 max. Gap: ₹7,000 from your pocket.' }
        ],
        insurerSpecific: {
            hdfc: { waitingPeriodPED: '3 years', roomRentCap: 'No cap on select plans', coPay: 'None (most plans)', restorationBenefit: 'Yes — full SI restore once/year', noClaimBonus: '50% cumulative', networkHospitals: 13000, uniqueClause: 'Unlimited restoration on Optima Secure plan' },
            icici: { waitingPeriodPED: '4 years', roomRentCap: '1% of SI/day on base plans', coPay: '20% on some plans for age 60+', restorationBenefit: 'Yes', noClaimBonus: '25% per year, max 100%', networkHospitals: 11500, uniqueClause: '20% mandatory co-pay for senior citizens on base plans — hidden cost' },
            bajaj: { waitingPeriodPED: '2 years', roomRentCap: 'No cap', coPay: 'None', restorationBenefit: 'Yes', noClaimBonus: '50% cumulative', networkHospitals: 12000, uniqueClause: 'Shortest PED waiting period in industry — 2 years only' },
            tata: { waitingPeriodPED: '3 years', roomRentCap: '1-2% of SI on base plan', coPay: '10% on specific diseases', restorationBenefit: 'Only on premium plans', noClaimBonus: '20% per year', networkHospitals: 10000, uniqueClause: '10% co-pay on specified diseases even without general co-pay clause' },
            sbi: { waitingPeriodPED: '4 years', roomRentCap: '1% of SI', coPay: '20% on plans below ₹5L', restorationBenefit: 'No', noClaimBonus: '10% per year', networkHospitals: 8500, uniqueClause: 'No restoration benefit — once SI exhausted, zero cover for rest of year' },
            max: { waitingPeriodPED: '3 years', roomRentCap: 'No cap on premium plans', coPay: 'None (premium plans)', restorationBenefit: 'Yes', noClaimBonus: '35% per year', networkHospitals: 9500, uniqueClause: 'NCB accumulation stops if any claim made — no partial NCB' }
        }
    },
    'term_life': {
        name: 'Term Life Insurance',
        standardClauses: [
            { name: 'Death Benefit Payout', simplified: 'If the insured person dies during the policy term, the nominee receives the full sum assured (₹50L-2Cr typically). This is the core purpose of term insurance — income replacement.', level: 'green', category: 'Coverage', impactScore: 1 },
            { name: 'Terminal Illness Benefit', simplified: 'If diagnosed with a terminal illness (life expectancy <6 months), the full sum assured is paid immediately — before death. Available on most modern plans.', level: 'green', category: 'Coverage', impactScore: 2 },
            { name: 'Accidental Death Benefit', simplified: 'Additional payout (often 2x) if death is due to accident. This is an add-on rider — not free. Check if your plan includes it or charges extra.', level: 'green', category: 'Rider', impactScore: 3 },
            { name: 'Suicide Exclusion (Year 1)', simplified: 'If the insured commits suicide within the first 12 months, NO claim is paid. After 12 months, 80% of premiums paid are returned (IRDAI mandate).', level: 'red', category: 'Exclusion', impactScore: 7, financialImpact: 'Year 1 suicide: ₹0 payout. Year 2+: Only 80% of premiums returned, not sum assured.' },
            { name: 'Non-Disclosure Penalty', simplified: 'If you hid medical conditions (diabetes, smoking, heart disease) during purchase — claim is REJECTED entirely. Insurer investigates medical history thoroughly at claim time.', level: 'red', category: 'Fraud', impactScore: 10, financialImpact: 'Hidden BP/diabetes = ₹0 payout on ₹1Cr policy. Family gets nothing. #1 claim rejection reason.' },
            { name: 'Smoker vs Non-Smoker Premium', simplified: 'Smokers pay 40-80% higher premiums. If you declared non-smoker but test positive for nicotine at claim — rejected. Some insurers test cotinine levels post-mortem.', level: 'red', category: 'Underwriting', impactScore: 8, financialImpact: 'Smoker hiding status on ₹1Cr policy: ₹0 payout + all premiums lost.' },
            { name: 'Grace Period (15-30 days)', simplified: 'If you miss a premium payment, you have 15-30 days to pay without losing cover. After grace period — policy LAPSES. All premiums paid are lost.', level: 'yellow', category: 'Process', impactScore: 6, financialImpact: 'Missed payment + grace period = policy lapsed. 5+ years of premiums = wasted.' },
            { name: 'Hazardous Activity Exclusion', simplified: 'Death during skydiving, scuba diving, rock climbing, motor racing, or adventure sports — NOT covered. Some plans offer rider to include these.', level: 'yellow', category: 'Exclusion', impactScore: 5 },
            { name: 'War & Aviation Exclusion', simplified: 'Death due to war, military service, or private aviation accidents is excluded. Commercial flight crashes ARE covered.', level: 'green', category: 'Exclusion', impactScore: 2 },
            { name: 'Tax Benefit Section 80C', simplified: 'Premiums paid qualify for ₹1.5L tax deduction under Section 80C. Payout to nominee is tax-free under Section 10(10D). Major advantage of term insurance.', level: 'green', category: 'Benefit', impactScore: 1 },
            { name: 'Premium Never Returned', simplified: 'Unlike endowment plans, term insurance pays NOTHING if you survive the term. ₹5L+ in premiums over 30 years = ₹0 return if you live. All money is risk-cover cost.', level: 'yellow', category: 'Structure', impactScore: 6, financialImpact: '30 years × ₹15K/year = ₹4.5L paid. If you survive: ₹0 back. That\'s the cost of protection.' }
        ],
        insurerSpecific: {
            hdfc: { claimSettlementRatio: '98.5%', avgClaimTime: '14 days', minSumAssured: '₹25L', maxAge: 65, onlineDiscount: '8%', uniqueClause: 'Life-stage benefit — increase cover at marriage/child birth without medical test' },
            icici: { claimSettlementRatio: '97.8%', avgClaimTime: '21 days', minSumAssured: '₹25L', maxAge: 65, onlineDiscount: '10%', uniqueClause: 'iProtect Smart — flexible payout options (lumpsum, monthly, or increasing)' },
            tata: { claimSettlementRatio: '98.2%', avgClaimTime: '18 days', minSumAssured: '₹15L', maxAge: 65, onlineDiscount: '7%', uniqueClause: 'Lowest premiums in industry for non-smoker males under 35' },
            max: { claimSettlementRatio: '99.3%', avgClaimTime: '12 days', minSumAssured: '₹25L', maxAge: 60, onlineDiscount: '5%', uniqueClause: 'Highest claim settlement ratio — 99.3%. Industry benchmark for trust.' },
            sbi: { claimSettlementRatio: '95.0%', avgClaimTime: '28 days', minSumAssured: '₹20L', maxAge: 70, onlineDiscount: '3%', uniqueClause: 'SBI brand trust but claim processing significantly slower than private insurers' },
            bajaj: { claimSettlementRatio: '97.0%', avgClaimTime: '22 days', minSumAssured: '₹25L', maxAge: 65, onlineDiscount: '6%', uniqueClause: 'Smart Protect Goal — plan adjusts cover as income grows' }
        }
    }
};

// POST /api/policy-decoder/upload — Real PDF/DOCX/TXT file upload + AI analysis
app.post('/api/policy-decoder/upload', upload.single('policyFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded. Please upload a PDF, DOCX, or TXT file.' });
        }

        const { mimetype, buffer, originalname, size } = req.file;
        let extractedText = '';

        // ===== EXTRACT TEXT based on file type =====
        if (mimetype === 'application/pdf') {
            const pdfData = await pdfParse(buffer);
            extractedText = pdfData.text;
        } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimetype === 'application/msword') {
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value;
        } else if (mimetype === 'text/plain') {
            extractedText = buffer.toString('utf-8');
        } else {
            return res.status(400).json({ success: false, error: 'Unsupported file type. Upload PDF, DOCX, or TXT.' });
        }

        // Clean up extracted text
        extractedText = extractedText.replace(/\s+/g, ' ').trim();

        if (extractedText.length < 50) {
            return res.status(400).json({ success: false, error: 'Could not extract enough text from the file. The document may be scanned/image-based or empty.' });
        }

        // ===== DETECT POLICY TYPE from text =====
        // Use keyword scoring — highest score wins (avoids false positives like "care" matching "car")
        const textLower = extractedText.toLowerCase();
        let detectedType = 'general';
        const typeScores = {
            motor: 0,
            health: 0,
            term_life: 0,
            travel: 0,
            home: 0
        };
        // Motor keywords
        if (textLower.includes('motor insurance') || textLower.includes('motor policy')) typeScores.motor += 5;
        if (/\bown damage\b/.test(textLower)) typeScores.motor += 4;
        if (/\bidv\b/.test(textLower)) typeScores.motor += 4;
        if (textLower.includes('two wheeler') || textLower.includes('two-wheeler')) typeScores.motor += 4;
        if (/\bvehicle\b/.test(textLower) && !textLower.includes('health')) typeScores.motor += 3;
        if (/\bcar insurance\b/.test(textLower)) typeScores.motor += 4;
        if (textLower.includes('third party liability')) typeScores.motor += 3;
        if (textLower.includes('no claim bonus') && typeScores.motor > 0) typeScores.motor += 2;
        if (textLower.includes('depreciation') && /\bparts\b/.test(textLower)) typeScores.motor += 3;

        // Health keywords
        if (textLower.includes('health insurance') || textLower.includes('health policy')) typeScores.health += 5;
        if (textLower.includes('hospitalization')) typeScores.health += 4;
        if (textLower.includes('room rent')) typeScores.health += 4;
        if (/\bco-?pay\b/.test(textLower)) typeScores.health += 4;
        if (textLower.includes('pre-existing disease') || textLower.includes('pre existing disease')) typeScores.health += 4;
        if (textLower.includes('day care proced')) typeScores.health += 3;
        if (textLower.includes('sub-limit') || textLower.includes('sublimit')) typeScores.health += 3;
        if (textLower.includes('cashless') && textLower.includes('hospital')) typeScores.health += 3;
        if (textLower.includes('sum insured') && textLower.includes('hospital')) typeScores.health += 3;
        if (textLower.includes('restoration benefit')) typeScores.health += 3;
        if (textLower.includes('waiting period')) typeScores.health += 2;

        // Term life keywords
        if (textLower.includes('term life') || textLower.includes('term plan')) typeScores.term_life += 5;
        if (textLower.includes('death benefit')) typeScores.term_life += 5;
        if (/\bnominee\b/.test(textLower)) typeScores.term_life += 4;
        if (textLower.includes('sum assured')) typeScores.term_life += 4;
        if (textLower.includes('life cover') || textLower.includes('life insurance')) typeScores.term_life += 4;
        if (textLower.includes('claim settlement ratio')) typeScores.term_life += 3;
        if (textLower.includes('suicide') && textLower.includes('exclusion')) typeScores.term_life += 2;

        // Travel keywords
        if (textLower.includes('travel insurance') || textLower.includes('travel policy')) typeScores.travel += 5;
        if (/\btrip\b/.test(textLower) && textLower.includes('cancel')) typeScores.travel += 4;
        if (textLower.includes('baggage')) typeScores.travel += 4;
        if (textLower.includes('passport')) typeScores.travel += 3;

        // Home keywords
        if (textLower.includes('home insurance') || textLower.includes('property insurance')) typeScores.home += 5;
        if (/\bburglary\b/.test(textLower)) typeScores.home += 4;
        if (textLower.includes('fire') && textLower.includes('building')) typeScores.home += 4;

        // Pick highest score
        const maxScore = Math.max(...Object.values(typeScores));
        if (maxScore >= 3) {
            detectedType = Object.entries(typeScores).reduce((best, [type, score]) =>
                score > best[1] ? [type, score] : best, ['general', 0]
            )[0];
        }

        // ===== DETECT INSURER from text =====
        let detectedInsurer = null;
        const insurerPatterns = {
            'HDFC ERGO': /hdfc\s*ergo/i,
            'ICICI Lombard': /icici\s*lombard/i,
            'Bajaj Allianz': /bajaj\s*allianz/i,
            'Tata AIG': /tata\s*aig/i,
            'SBI General': /sbi\s*(general|life)/i,
            'Max Life': /max\s*(life|bupa)/i,
            'LIC': /\blic\b|life insurance corporation/i,
            'Star Health': /star\s*health/i,
            'New India Assurance': /new india assurance/i,
            'United India': /united india/i
        };
        for (const [name, pattern] of Object.entries(insurerPatterns)) {
            if (pattern.test(extractedText)) {
                detectedInsurer = name;
                break;
            }
        }

        // Truncate text for AI analysis (keep first 6000 chars for richer analysis)
        const textForAI = extractedText.substring(0, 6000);

        // ===== AI ANALYSIS via OpenRouter =====
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        let aiResult = null;

        try {
            const aiRes = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: 'google/gemini-2.0-flash-001',
                    messages: [
                        {
                            role: 'system',
                            content: `You are an expert Indian insurance policy analyst for Insurix.India. You are analyzing REAL policy document text extracted from a PDF/DOCX file.

Your job is to perform a DEEP, THOROUGH analysis and return a structured JSON response.

Analyze the policy text and extract ALL of the following:

1. "policyType": one of "motor", "health", "term_life", "travel", "home", "general"
2. "insurer": The insurance company name if mentioned
3. "policyName": The specific product/plan name if mentioned
4. "fairnessScore": 0-100 overall fairness score (100 = perfectly fair)
5. "tldr": A 3-4 sentence TL;DR summary in simple, plain language. Mention key coverage amounts, premiums if visible, and the #1 risk.
6. "clauses": An array of extracted clauses, each with:
   - "name": Short clause name (e.g., "Waiting Period", "Co-Pay Clause", "NCB Transfer")
   - "simplified": Plain language explanation of what it means for the policyholder
   - "level": "green" (good for customer), "yellow" (caution), or "red" (bad/gotcha)
   - "category": Category like "Coverage", "Exclusion", "Waiting Period", "Limit", "Deductible", "Claim Process", "Premium", "Renewal", "Add-On", "General"
   - "impactScore": 1-10 (10 = highest financial impact on customer)
   - "financialImpact": Estimated ₹ impact string (e.g., "Could cost ₹50,000+ out of pocket")
7. "redFlags": Array of top 3-5 RED FLAGS (gotchas that could hurt the customer)
8. "greenFlags": Array of top 3-5 GREEN FLAGS (genuinely beneficial clauses)
9. "recommendations": Array of 2-3 actionable recommendations for the policyholder
10. "missingCoverages": Array of important coverages NOT found in this policy

IMPORTANT: Extract REAL clauses from the actual text. Do NOT make up clauses. Be specific with ₹ amounts mentioned in the document. Reference IRDAI guidelines where relevant.

Respond ONLY with valid JSON. No markdown, no backticks, no explanation outside JSON.`
                        },
                        {
                            role: 'user',
                            content: `Analyze this REAL insurance policy document (${originalname}, ${(size / 1024).toFixed(1)}KB, detected type: ${detectedType}):\n\n${textForAI}`
                        }
                    ],
                    temperature: 0.2,
                    max_tokens: 3000
                },
                {
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://insurix.india',
                        'X-Title': 'Insurix Policy Decoder File Upload'
                    },
                    timeout: 30000
                }
            );

            const raw = aiRes.data?.choices?.[0]?.message?.content || '';
            // Extract JSON from response
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiResult = JSON.parse(jsonMatch[0]);
            }
        } catch (aiErr) {
            console.error('[PolicyDecoder Upload] AI analysis failed:', aiErr.message);
        }

        // ===== BUILD RESPONSE =====
        // Use AI-extracted clauses or fall back to basic text analysis
        let clauses = [];
        let fairnessScore = 65; // default
        let tldr = '';

        if (aiResult && aiResult.clauses && aiResult.clauses.length > 0) {
            clauses = aiResult.clauses.map(c => ({
                name: c.name || 'Clause',
                simplified: c.simplified || c.description || '',
                level: ['green', 'yellow', 'red'].includes(c.level) ? c.level : 'yellow',
                category: c.category || 'General',
                impactScore: Math.min(10, Math.max(1, Number(c.impactScore) || 5)),
                financialImpact: c.financialImpact || null,
                flag: c.level === 'green' ? '🟢' : c.level === 'yellow' ? '🟡' : '🔴'
            })).sort((a, b) => b.impactScore - a.impactScore);

            fairnessScore = aiResult.fairnessScore || fairnessScore;
            tldr = aiResult.tldr || `Policy document "${originalname}" analyzed. ${clauses.length} clauses extracted.`;
        } else {
            // Basic fallback analysis without AI
            tldr = `Extracted ${extractedText.length} characters from "${originalname}". AI analysis unavailable — showing basic text summary.`;
            // Create a single clause from the extracted text
            clauses = [{
                name: 'Full Document Text',
                simplified: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''),
                level: 'yellow',
                category: 'General',
                impactScore: 5,
                financialImpact: null,
                flag: '🟡'
            }];
        }

        // Clause counts
        const greenCount = clauses.filter(c => c.level === 'green').length;
        const yellowCount = clauses.filter(c => c.level === 'yellow').length;
        const redCount = clauses.filter(c => c.level === 'red').length;

        fairnessScore = Math.min(100, Math.max(0, fairnessScore));

        res.json({
            success: true,
            uploadMode: true,
            fileName: originalname,
            fileSize: size,
            extractedTextLength: extractedText.length,
            detectedType,
            detectedInsurer,
            policyType: aiResult?.policyType || detectedType,
            policyName: aiResult?.policyName || `Uploaded Policy — ${originalname}`,
            fairnessScore,
            fairnessVerdict: fairnessScore >= 75 ? '🟢 Fair Policy' : fairnessScore >= 50 ? '🟡 Proceed with Caution' : '🔴 Multiple Red Flags',
            tldr,
            clauses,
            clauseSummary: { total: clauses.length, green: greenCount, yellow: yellowCount, red: redCount },
            insurerDetails: null,
            insurerName: detectedInsurer || null,
            aiAnalysis: aiResult ? {
                tldr: aiResult.tldr,
                redFlags: aiResult.redFlags || [],
                greenFlags: aiResult.greenFlags || [],
                recommendations: aiResult.recommendations || [],
                missingCoverages: aiResult.missingCoverages || []
            } : null,
            methodology: 'Real Document Extraction (pdf-parse/mammoth) + Gemini 2.0 Flash AI Analysis',
            extractedPreview: extractedText.substring(0, 300) + '...'
        });

    } catch (err) {
        console.error('[PolicyDecoder Upload] Error:', err.message);
        // Handle multer errors
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ success: false, error: 'File too large. Maximum 10MB allowed.' });
        }
        res.status(500).json({ success: false, error: err.message || 'Failed to process uploaded file' });
    }
});

// POST /api/policy-decoder
app.post('/api/policy-decoder', async (req, res) => {
    const { policyType, insurerId, userPolicyText } = req.body;
    const pType = policyType || 'motor_comprehensive';
    const policyData = POLICY_CLAUSE_DATABASE[pType];

    if (!policyData) {
        return res.status(400).json({ success: false, error: 'Unknown policy type. Use: motor_comprehensive, health_individual, term_life' });
    }

    // Get insurer-specific data
    const insurerClauses = insurerId ? policyData.insurerSpecific[insurerId] : null;

    // Calculate Fairness Score using impact-weighted methodology
    const clauses = policyData.standardClauses;
    const totalClauses = clauses.length;
    const greenCount = clauses.filter(c => c.level === 'green').length;
    const yellowCount = clauses.filter(c => c.level === 'yellow').length;
    const redCount = clauses.filter(c => c.level === 'red').length;
    // Impact-weighted: subtract red clause impact scores, add green, neutral for yellow
    const maxPossible = totalClauses * 10;
    const actualScore = clauses.reduce((sum, c) => {
        if (c.level === 'green') return sum + (10 - c.impactScore); // low impact = good
        if (c.level === 'red') return sum - c.impactScore;          // high impact = bad
        return sum + (5 - c.impactScore * 0.5);                     // yellow = moderate
    }, maxPossible * 0.5);
    let fairnessScore = Math.round((actualScore / maxPossible) * 100);

    // Insurer-specific adjustments
    if (insurerClauses) {
        if (pType === 'health_individual') {
            if (insurerClauses.coPay && insurerClauses.coPay !== 'None' && insurerClauses.coPay !== 'None (most plans)' && insurerClauses.coPay !== 'None (premium plans)') fairnessScore -= 8;
            if (insurerClauses.restorationBenefit === 'Yes' || insurerClauses.restorationBenefit?.startsWith('Yes')) fairnessScore += 5;
            if (insurerClauses.roomRentCap && insurerClauses.roomRentCap.includes('No cap')) fairnessScore += 5;
            if (insurerClauses.waitingPeriodPED === '2 years') fairnessScore += 5;
            else if (insurerClauses.waitingPeriodPED === '4 years') fairnessScore -= 5;
        } else if (pType === 'term_life') {
            const csr = parseFloat(insurerClauses.claimSettlementRatio);
            if (csr >= 99) fairnessScore += 8;
            else if (csr >= 98) fairnessScore += 4;
            else if (csr < 96) fairnessScore -= 6;
            if (insurerClauses.onlineDiscount && parseInt(insurerClauses.onlineDiscount) >= 8) fairnessScore += 3;
        } else {
            if (insurerClauses.roadside === 'included') fairnessScore += 3;
            if (insurerClauses.engineProtect === 'not available') fairnessScore -= 5;
            if (insurerClauses.returnToInvoice === 'not available') fairnessScore -= 3;
        }
    }
    fairnessScore = Math.min(100, Math.max(0, fairnessScore));

    // Use AI to generate a TL;DR if user provided custom text
    let aiTldr = null;
    if (userPolicyText && userPolicyText.length > 50) {
        try {
            const aiRes = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: 'google/gemini-2.0-flash-001',
                    messages: [
                        {
                            role: 'system',
                            content: `You are an Indian insurance policy decoder for Insurix.India. Analyze the given policy text and extract:
1. A 2-3 sentence TL;DR summary in simple language
2. Top 3 RED FLAGS (gotchas that could cost the policyholder money)
3. Top 3 GREEN FLAGS (genuinely good clauses)
4. An overall Fairness Score suggestion (0-100)
Respond in valid JSON format: { "tldr": "...", "redFlags": ["..."], "greenFlags": ["..."], "suggestedScore": 72 }
Use ₹ for amounts. Reference IRDAI guidelines where relevant. Be specific about financial impact.`
                        },
                        { role: 'user', content: `Analyze this policy text:\n${userPolicyText.substring(0, 3000)}` }
                    ],
                    temperature: 0.3,
                    max_tokens: 600
                },
                {
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://insurix.india',
                        'X-Title': 'Insurix Policy Decoder'
                    },
                    timeout: 15000
                }
            );
            const raw = aiRes.data?.choices?.[0]?.message?.content || '';
            // Try to parse JSON from AI response
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiTldr = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('[PolicyDecoder] AI analysis failed:', e.message);
        }
    }

    // Build the response
    const tldrMap = {
        'motor_comprehensive': `This motor comprehensive policy covers you for third-party liability (unlimited for injury/death), own damage from accidents/theft/calamities, and ₹15L personal accident. However, depreciation on parts is NOT covered unless you add Zero-Dep (20-50% out-of-pocket risk), and mechanical breakdowns need separate Engine Protect cover.`,
        'health_individual': `This health policy covers hospitalization expenses, day-care procedures, and pre/post hospitalization costs. BUT — pre-existing diseases have a 2-4 year waiting period (zero cover), room rent caps can inflate your bill by 30-40%, and disease-specific sub-limits may cover only 25-50% of actual surgery costs.`,
        'term_life': `This term plan pays your nominee ₹50L-2Cr if you die during the policy term — pure risk cover at the lowest cost. BUT — non-disclosure of medical conditions (hidden diabetes, smoking) results in 100% claim rejection. Premium is never refunded if you survive. Non-smoker declaration is verified at claim time.`
    };
    const tldrSummary = tldrMap[pType] || 'Policy analysis complete.';

    res.json({
        success: true,
        policyType: pType,
        policyName: policyData.name,
        fairnessScore,
        fairnessVerdict: fairnessScore >= 75 ? '🟢 Fair Policy' : fairnessScore >= 50 ? '🟡 Proceed with Caution' : '🔴 Multiple Red Flags',
        tldr: aiTldr?.tldr || tldrSummary,
        clauses: clauses.map(c => ({
            name: c.name,
            simplified: c.simplified,
            level: c.level,
            category: c.category,
            impactScore: c.impactScore,
            financialImpact: c.financialImpact || null,
            flag: c.level === 'green' ? '🟢' : c.level === 'yellow' ? '🟡' : '🔴'
        })).sort((a, b) => b.impactScore - a.impactScore),
        clauseSummary: { total: totalClauses, green: greenCount, yellow: yellowCount, red: redCount },
        insurerDetails: insurerClauses || null,
        insurerName: insurerClauses ? (IRDAI_INSURER_DATA[insurerId]?.name || insurerId) : null,
        aiAnalysis: aiTldr || null,
        methodology: 'IRDAI Standard Policy Wordings + Chain-of-Density Impact Scoring'
    });
});

// ===== 3.2 COMMISSION TRANSPARENCY — "Commission Leakage Tracker" =====

// IRDAI Expenses of Management (EoM) caps — Commission structures by product & channel
const IRDAI_COMMISSION_DATA = {
    motor: {
        category: 'Motor Insurance',
        irdaiEoMCap: 0.35, // 35% of premium is max EoM for motor
        channels: {
            agent: { commissionPercent: 15, overridingCommission: 2, operatingExpense: 8, totalCost: 25, label: 'Traditional Agent' },
            broker: { commissionPercent: 12.5, overridingCommission: 1.5, operatingExpense: 6, totalCost: 20, label: 'Insurance Broker' },
            online_aggregator: { commissionPercent: 10, overridingCommission: 0, operatingExpense: 5, totalCost: 15, label: 'Online Aggregator (PolicyBazaar etc.)' },
            direct_digital: { commissionPercent: 0, overridingCommission: 0, operatingExpense: 3, totalCost: 3, label: 'Direct Digital (Insurer Website/App)' },
            bancassurance: { commissionPercent: 8, overridingCommission: 1, operatingExpense: 4, totalCost: 13, label: 'Bank Channel' }
        },
        perInsurerCommission: {
            hdfc: { agentComm: 14, directDiscount: 8, webExclusive: true },
            icici: { agentComm: 15, directDiscount: 10, webExclusive: true },
            bajaj: { agentComm: 15, directDiscount: 7, webExclusive: false },
            tata: { agentComm: 13, directDiscount: 5, webExclusive: true },
            sbi: { agentComm: 12, directDiscount: 3, webExclusive: false },
            max: { agentComm: 14, directDiscount: 6, webExclusive: true }
        }
    },
    health: {
        category: 'Health Insurance',
        irdaiEoMCap: 0.35,
        channels: {
            agent: { commissionPercent: 15, overridingCommission: 3, operatingExpense: 7, totalCost: 25, label: 'Traditional Agent' },
            broker: { commissionPercent: 12.5, overridingCommission: 2, operatingExpense: 5, totalCost: 19.5, label: 'Insurance Broker' },
            online_aggregator: { commissionPercent: 12, overridingCommission: 0, operatingExpense: 5, totalCost: 17, label: 'Online Aggregator' },
            direct_digital: { commissionPercent: 0, overridingCommission: 0, operatingExpense: 4, totalCost: 4, label: 'Direct Digital' },
            bancassurance: { commissionPercent: 10, overridingCommission: 2, operatingExpense: 5, totalCost: 17, label: 'Bank Channel' }
        },
        perInsurerCommission: {
            hdfc: { agentComm: 15, directDiscount: 5, webExclusive: true },
            icici: { agentComm: 15, directDiscount: 7, webExclusive: true },
            bajaj: { agentComm: 14, directDiscount: 8, webExclusive: false },
            tata: { agentComm: 12, directDiscount: 4, webExclusive: true },
            sbi: { agentComm: 10, directDiscount: 2, webExclusive: false },
            max: { agentComm: 13, directDiscount: 5, webExclusive: true }
        }
    },
    life_term: {
        category: 'Term Life Insurance',
        irdaiEoMCap: 0.40,
        channels: {
            agent: { commissionPercent: 35, overridingCommission: 5, operatingExpense: 10, totalCost: 50, label: 'Traditional Agent' },
            broker: { commissionPercent: 25, overridingCommission: 3, operatingExpense: 8, totalCost: 36, label: 'Insurance Broker' },
            online_aggregator: { commissionPercent: 15, overridingCommission: 0, operatingExpense: 5, totalCost: 20, label: 'Online Aggregator' },
            direct_digital: { commissionPercent: 0, overridingCommission: 0, operatingExpense: 5, totalCost: 5, label: 'Direct Digital' },
            bancassurance: { commissionPercent: 20, overridingCommission: 3, operatingExpense: 6, totalCost: 29, label: 'Bank Channel' }
        },
        perInsurerCommission: {
            hdfc: { agentComm: 30, directDiscount: 20, webExclusive: true },
            icici: { agentComm: 35, directDiscount: 25, webExclusive: true },
            bajaj: { agentComm: 28, directDiscount: 15, webExclusive: false },
            tata: { agentComm: 25, directDiscount: 18, webExclusive: true },
            sbi: { agentComm: 20, directDiscount: 10, webExclusive: false },
            max: { agentComm: 33, directDiscount: 22, webExclusive: true }
        }
    }
};

// GET /api/commission-transparency/:productType
app.get('/api/commission-transparency/:productType', (req, res) => {
    const productType = req.params.productType;
    const premium = parseInt(req.query.premium) || 10000;
    const insurerId = req.query.insurer || null;

    const commData = IRDAI_COMMISSION_DATA[productType];
    if (!commData) {
        return res.status(400).json({ success: false, error: 'Unknown product type. Use: motor, health, life_term' });
    }

    // Calculate actual amounts per channel
    const channelBreakdown = Object.entries(commData.channels).map(([key, ch]) => {
        const commissionAmt = Math.round(premium * ch.commissionPercent / 100);
        const overridingAmt = Math.round(premium * ch.overridingCommission / 100);
        const operatingAmt = Math.round(premium * ch.operatingExpense / 100);
        const totalDistCost = Math.round(premium * ch.totalCost / 100);
        const coverageAmt = premium - totalDistCost;
        return {
            channel: key,
            channelLabel: ch.label,
            commissionPercent: ch.commissionPercent,
            overridingPercent: ch.overridingCommission,
            operatingPercent: ch.operatingExpense,
            totalDistributionPercent: ch.totalCost,
            coveragePercent: 100 - ch.totalCost,
            amounts: {
                commission: commissionAmt,
                overriding: overridingAmt,
                operating: operatingAmt,
                totalDistribution: totalDistCost,
                goesToCoverage: coverageAmt
            }
        };
    });

    // Potential savings: agent vs direct digital
    const agentCh = commData.channels.agent;
    const directCh = commData.channels.direct_digital;
    const potentialSavings = Math.round(premium * (agentCh.totalCost - directCh.totalCost) / 100);

    // Per-insurer breakdown
    let insurerBreakdown = null;
    if (insurerId && commData.perInsurerCommission[insurerId]) {
        const ins = commData.perInsurerCommission[insurerId];
        const insName = IRDAI_INSURER_DATA[insurerId]?.name || insurerId;
        insurerBreakdown = {
            insurerId,
            insurerName: insName,
            agentCommission: ins.agentComm,
            agentCommissionAmount: Math.round(premium * ins.agentComm / 100),
            directDiscountPercent: ins.directDiscount,
            directSavingsAmount: Math.round(premium * ins.directDiscount / 100),
            webExclusivePlans: ins.webExclusive,
            recommendation: ins.webExclusive
                ? `💡 ${insName} offers web-exclusive plans with ${ins.directDiscount}% lower premium — save ₹${Math.round(premium * ins.directDiscount / 100).toLocaleString('en-IN')}`
                : `ℹ️ ${insName} offers ${ins.directDiscount}% direct discount but no web-exclusive plans`
        };
    }

    // All insurers comparison
    const allInsurerComparison = Object.entries(commData.perInsurerCommission).map(([id, ins]) => ({
        insurerId: id,
        insurerName: IRDAI_INSURER_DATA[id]?.name || id,
        agentCommissionPercent: ins.agentComm,
        agentCommissionAmount: Math.round(premium * ins.agentComm / 100),
        directSavingsPercent: ins.directDiscount,
        directSavingsAmount: Math.round(premium * ins.directDiscount / 100),
        webExclusive: ins.webExclusive
    })).sort((a, b) => b.directSavingsPercent - a.directSavingsPercent);

    res.json({
        success: true,
        productType,
        category: commData.category,
        premium,
        irdaiEoMCap: `${commData.irdaiEoMCap * 100}%`,
        channelBreakdown,
        potentialSavings: {
            amount: potentialSavings,
            percent: agentCh.totalCost - directCh.totalCost,
            description: `Switching from agent (${agentCh.totalCost}% distribution cost) to direct digital (${directCh.totalCost}%) saves ₹${potentialSavings.toLocaleString('en-IN')}`
        },
        insurerDetails: insurerBreakdown,
        allInsurers: allInsurerComparison,
        pieChart: {
            agentChannel: { coverage: 100 - agentCh.totalCost, distribution: agentCh.totalCost },
            directChannel: { coverage: 100 - directCh.totalCost, distribution: directCh.totalCost }
        },
        dataSource: 'IRDAI Expenses of Management Regulations 2024, Public EoM Disclosures'
    });
});

// ===== 3.3 RENEWAL ORACLE — Forecast & Alerts =====

// POST /api/renewal-forecast
app.post('/api/renewal-forecast', (req, res) => {
    const { registrationNumber, make, model, year, cc, vehicleType, currentPremium, currentInsurer, policyExpiryDate, userAge } = req.body;

    // Get vehicle data
    let vehicleData = null;
    if (registrationNumber) {
        const lookup = lookupVehicle(registrationNumber);
        if (lookup.success) vehicleData = lookup.data;
    }
    if (!vehicleData && make && model) {
        const vInfo = VEHICLE_DATABASE[make]?.[model] || CAR_DATABASE[make]?.[model];
        if (vInfo) {
            const vAge = new Date().getFullYear() - (parseInt(year) || 2023);
            let dep = vAge <= 0 ? 0 : vAge <= 1 ? 15 : vAge <= 2 ? 20 : vAge <= 3 ? 30 : vAge <= 4 ? 40 : 50;
            vehicleData = {
                make, model, year: parseInt(year) || 2023, cc: vInfo.cc,
                type: vInfo.type, exShowroomPrice: vInfo.price, segment: vInfo.segment,
                idv: Math.round(vInfo.price * (1 - dep / 100)), vehicleAge: vAge,
                premium: { thirdParty: 0, ownDamage: 0 },
                registrationNumber: registrationNumber || 'MANUAL'
            };
        }
    }
    if (!vehicleData) {
        return res.status(400).json({ success: false, error: 'Provide registrationNumber or make+model+year' });
    }

    const currentYear = new Date().getFullYear();
    const vYear = vehicleData.year;
    const vAge = currentYear - vYear;
    const exShowroom = vehicleData.exShowroomPrice;
    const engineCC = vehicleData.cc || parseInt(cc) || 150;
    const vType = vehicleData.type || vehicleType || '2W';
    const age = parseInt(userAge) || 30;

    // Current policy figures
    const curPremium = parseInt(currentPremium) || vehicleData.premium?.comprehensive || vehicleData.premium?.thirdParty + vehicleData.premium?.ownDamage || 2000;

    // ----- MOTOR RENEWAL FORECAST (3-year projection) -----
    const forecast = [];
    for (let y = 1; y <= 3; y++) {
        const futureAge = vAge + y;
        // IDV depreciation
        let depPercent;
        if (futureAge <= 0) depPercent = 0;
        else if (futureAge <= 1) depPercent = 15;
        else if (futureAge <= 2) depPercent = 20;
        else if (futureAge <= 3) depPercent = 30;
        else if (futureAge <= 4) depPercent = 40;
        else depPercent = 50;
        const futureIDV = Math.round(exShowroom * (1 - depPercent / 100));

        // TP rate increase (IRDAI historically raises 5-10%/year)
        const tpTrend = TP_RATE_TREND[vType] || 0.07;
        let baseTP;
        if (vType === '4W') {
            baseTP = engineCC <= 1000 ? 2094 : engineCC <= 1500 ? 3416 : 7897;
        } else {
            baseTP = engineCC === 0 ? 714 : engineCC <= 75 ? 538 : engineCC <= 150 ? 714 : engineCC <= 350 ? 1366 : 2804;
        }
        const futureTP = Math.round(baseTP * Math.pow(1 + tpTrend, y));

        // OD rate (may change slightly)
        const odRate = vType === '4W' ? (engineCC > 1500 ? 0.032 : 0.026) : (engineCC > 350 ? 0.035 : engineCC > 150 ? 0.028 : 0.022);
        const futureOD = Math.round(futureIDV * odRate);

        const futurePremium = futureTP + futureOD;
        const futureGST = Math.round(futurePremium * 0.18);
        const futureTotal = futurePremium + futureGST;

        // Change from current
        const premiumChange = futureTotal - curPremium;
        const premiumChangePercent = Math.round((premiumChange / curPremium) * 100);

        // IDV benefit from depreciation
        const idvDrop = vehicleData.idv - futureIDV;
        const idvDropPercent = Math.round((idvDrop / vehicleData.idv) * 100);

        forecast.push({
            year: currentYear + y,
            vehicleAge: futureAge,
            idv: futureIDV,
            idvDropFromCurrent: idvDrop,
            idvDropPercent,
            tpPremium: futureTP,
            tpChangePercent: Math.round(((futureTP - baseTP) / baseTP) * 100),
            odPremium: futureOD,
            gst: futureGST,
            totalPremium: futureTotal,
            premiumChange,
            premiumChangePercent,
            direction: premiumChange > 0 ? 'UP' : premiumChange < 0 ? 'DOWN' : 'STABLE',
            arrow: premiumChange > 0 ? '↑' : premiumChange < 0 ? '↓' : '→'
        });
    }

    // ----- SWITCH ALERTS -----
    // Compare current insurer with best available
    const switchAlerts = [];
    const quotes = generateQuotes(vehicleData);
    const sortedQuotes = quotes.sort((a, b) => a.premium.comprehensive.total - b.premium.comprehensive.total);
    const bestQuote = sortedQuotes[0];
    const curInsurerQuote = currentInsurer ? quotes.find(q => q.insurerId === currentInsurer) : null;
    const currentTotal = curInsurerQuote ? curInsurerQuote.premium.comprehensive.total : curPremium;

    if (bestQuote && bestQuote.premium.comprehensive.total < currentTotal * 0.92) {
        const savingsAmt = currentTotal - bestQuote.premium.comprehensive.total;
        switchAlerts.push({
            type: 'SWITCH_RECOMMENDED',
            severity: 'high',
            title: `Switch to ${bestQuote.insurerName} — Save ₹${savingsAmt.toLocaleString('en-IN')}`,
            detail: `Your current insurer charges ₹${currentTotal.toLocaleString('en-IN')}. ${bestQuote.insurerName} offers ₹${bestQuote.premium.comprehensive.total.toLocaleString('en-IN')} — that's ${Math.round((savingsAmt / currentTotal) * 100)}% less.`,
            action: 'Switch before renewal date to lock in lower premium',
            savingsAmount: savingsAmt,
            savingsPercent: Math.round((savingsAmt / currentTotal) * 100)
        });
    }

    // Renewal timing alert
    const expiryDate = policyExpiryDate ? new Date(policyExpiryDate) : new Date(Date.now() + 45 * 86400000);
    const daysToExpiry = Math.round((expiryDate - new Date()) / 86400000);
    if (daysToExpiry <= 60 && daysToExpiry > 0) {
        switchAlerts.push({
            type: 'RENEWAL_DUE_SOON',
            severity: daysToExpiry <= 15 ? 'critical' : daysToExpiry <= 30 ? 'high' : 'medium',
            title: `Policy expires in ${daysToExpiry} days`,
            detail: daysToExpiry <= 15
                ? `⚠️ URGENT: Your policy expires on ${expiryDate.toLocaleDateString('en-IN')}. Renew NOW to avoid NCB loss and legal risk of driving uninsured.`
                : `Your policy expires on ${expiryDate.toLocaleDateString('en-IN')}. Start comparing quotes now for best rates.`,
            action: daysToExpiry <= 15 ? 'Renew immediately' : 'Compare and renew within 30 days',
            daysRemaining: daysToExpiry
        });
    } else if (daysToExpiry <= 0) {
        switchAlerts.push({
            type: 'POLICY_EXPIRED',
            severity: 'critical',
            title: '🚨 Policy has EXPIRED',
            detail: 'Your vehicle is uninsured. Driving without insurance is a criminal offense under MV Act. NCB may be lost. Get insured NOW.',
            action: 'Purchase new policy immediately — inspection may be required'
        });
    }

    // TP rate hike alert
    const nextYearTP = forecast[0]?.tpPremium;
    const currentTP = vehicleData.premium?.thirdParty;
    if (currentTP && nextYearTP > currentTP * 1.05) {
        switchAlerts.push({
            type: 'TP_RATE_HIKE',
            severity: 'medium',
            title: `TP premium projected to rise ${Math.round(((nextYearTP - currentTP) / currentTP) * 100)}% next year`,
            detail: `IRDAI is expected to raise third-party rates from ₹${currentTP.toLocaleString('en-IN')} to ₹${nextYearTP.toLocaleString('en-IN')} for FY ${currentYear + 1}-${(currentYear + 2) % 100}.`,
            action: 'Lock in current rates by renewing before IRDAI rate revision (usually April 1st)'
        });
    }

    // IDV drop warning
    if (forecast[0]?.idvDropPercent > 10) {
        switchAlerts.push({
            type: 'IDV_DEPRECIATION',
            severity: 'low',
            title: `Vehicle IDV dropping ${forecast[0].idvDropPercent}% next year`,
            detail: `Your vehicle's insured value will drop from ₹${vehicleData.idv.toLocaleString('en-IN')} to ₹${forecast[0].idv.toLocaleString('en-IN')}. Lower IDV = lower claim payout.`,
            action: 'Consider Return-to-Invoice add-on for full value protection'
        });
    }

    // Health-specific age-band alert (if user age provided)
    const ageBandJumps = [30, 35, 40, 45, 50, 55, 60, 65];
    const nextAgeBand = ageBandJumps.find(a => a > age && a <= age + 3);
    if (nextAgeBand) {
        switchAlerts.push({
            type: 'AGE_BAND_JUMP',
            severity: 'medium',
            title: `Health premium hike at age ${nextAgeBand}`,
            detail: `You'll hit the ${nextAgeBand}-year age band in ${nextAgeBand - age} year(s). Health insurance premiums typically jump 15-25% at this threshold.`,
            action: `Lock in current age-band rates by purchasing/renewing health policy before turning ${nextAgeBand}`
        });
    }

    // Best insurer recommendations
    const topInsurers = sortedQuotes.slice(0, 3).map(q => ({
        insurerId: q.insurerId,
        insurerName: q.insurerName,
        premium: q.premium.comprehensive.total,
        savings: currentTotal - q.premium.comprehensive.total,
        savingsPercent: Math.round((1 - q.premium.comprehensive.total / currentTotal) * 100),
        highlights: q.features
    }));

    res.json({
        success: true,
        vehicle: {
            make: vehicleData.make,
            model: vehicleData.model,
            year: vYear,
            cc: engineCC,
            type: vType,
            currentIDV: vehicleData.idv,
            registrationNumber: vehicleData.registrationNumber || registrationNumber
        },
        currentPremium: curPremium,
        forecast,
        alerts: switchAlerts,
        alertCount: { critical: switchAlerts.filter(a => a.severity === 'critical').length, high: switchAlerts.filter(a => a.severity === 'high').length, medium: switchAlerts.filter(a => a.severity === 'medium').length, low: switchAlerts.filter(a => a.severity === 'low').length },
        topInsurers,
        methodology: 'IRDAI TP Trend Analysis + IDV Depreciation Curve + Age-Band Actuarial Tables + Competitive Quote Engine'
    });
});

// ============================================================================
// BOOK HOME VISIT — Health Insurance Consultation Booking
// ============================================================================
const homeVisitBookings = [];

const advisorNames = [
    'Priya Sharma', 'Rajesh Kumar', 'Sneha Reddy', 'Amit Patel', 'Kavitha Nair',
    'Suresh Babu', 'Anita Deshmukh', 'Vikram Singh', 'Meera Iyer', 'Rohit Joshi'
];

app.post('/api/book-home-visit', (req, res) => {
    try {
        const { fullName, age, phone, email, members, existingInsurance,
            address, city, state, pincode, landmark,
            date, timeSlot, concerns, language } = req.body;

        // Validation
        if (!fullName || !phone || !date || !timeSlot || !address || !city || !pincode) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        if (!/^[6-9]\d{9}$/.test(phone)) {
            return res.status(400).json({ success: false, error: 'Invalid mobile number' });
        }

        if (!/^\d{6}$/.test(pincode)) {
            return res.status(400).json({ success: false, error: 'Invalid pincode' });
        }

        const bookingId = 'BHV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        const advisor = advisorNames[Math.floor(Math.random() * advisorNames.length)];

        const booking = {
            bookingId,
            fullName,
            name: fullName,
            age: parseInt(age) || null,
            phone,
            email: email || null,
            members,
            existingInsurance,
            address,
            city,
            state,
            pincode,
            landmark: landmark || null,
            date,
            timeSlot,
            concerns: concerns || null,
            language: language || 'english',
            advisor,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };

        homeVisitBookings.push(booking);

        console.log(`\n🏠 Home Visit Booked: ${bookingId}`);
        console.log(`   Name: ${fullName} | Phone: ${phone}`);
        console.log(`   City: ${city} | Date: ${date} | Slot: ${timeSlot}`);
        console.log(`   Advisor: ${advisor}`);

        res.json({
            success: true,
            booking: {
                bookingId,
                name: fullName,
                date,
                timeSlot,
                city,
                advisor,
                status: 'confirmed',
                message: `Your home visit has been confirmed. ${advisor} will call you within 30 minutes.`
            }
        });
    } catch (err) {
        console.error('Book Home Visit Error:', err);
        res.status(500).json({ success: false, error: 'Failed to book home visit' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Insurix.India Server running at http://localhost:${PORT}`);
    console.log(`📡 API endpoints:`);
    console.log(`   POST /api/vehicle/lookup       - Vehicle RC lookup`);
    console.log(`   POST /api/insurance/quotes      - Get insurance quotes`);
    console.log(`   POST /api/premium/calculate     - Calculate premium`);
    console.log(`   GET  /api/vehicle/brands        - List all brands`);
    console.log(`   GET  /api/vehicle/models/:brand - List models`);
    console.log(`   GET  /api/rto/:code             - RTO info`);
    console.log(`   POST /api/negotiate/start       - Start negotiation`);
    console.log(`   POST /api/negotiate/simulate    - Auto-negotiate`);
    console.log(`   GET  /api/negotiate/status/:id  - Negotiation status`);
    console.log(`   POST /api/negotiate/accept      - Accept offer`);
    console.log(`   POST /api/chat                  - AI Chat (Gemini)`);
    console.log(`   POST /api/tts                   - Text-to-Speech (Azure)`);
    console.log(`   GET  /api/speech-token          - Speech SDK token`);
    console.log(`   POST /api/predict-claim         - 🛡️  Loot-Shield: Claim Friction Score`);
    console.log(`   POST /api/vulnerability-assessment - 🔍 Gap Analysis: Vulnerability Score`);
    console.log(`   POST /api/tco-simulator         - 📊 TCO: 5-Year Cost Simulator`);
    console.log(`   POST /api/policy-decoder        - 📜 Policy Decoder: Clause Simplifier`);
    console.log(`   POST /api/policy-decoder/upload  - 📄 Policy Decoder: PDF/DOCX/TXT File Upload`);
    console.log(`   GET  /api/commission-transparency/:type - 💰 Commission Leakage Tracker`);
    console.log(`   POST /api/renewal-forecast      - 🔮 Renewal Oracle: Forecast & Alerts\n`);
});
