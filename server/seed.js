const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
require('dotenv').config();

const User     = require('./models/User');
const Facility = require('./models/Facility');
const Dustbin  = require('./models/Dustbin');
const Review   = require('./models/Review');

// ═══════════════════════════════════════════════════════════════════════════
//  PUNE AREA FACILITIES (15 realistic e-waste recycling centers)
// ═══════════════════════════════════════════════════════════════════════════
const facilities = [
  {
    name: 'GreenTech E-Waste Solutions',
    description: 'ISO 14001 certified facility specializing in large-scale e-waste recycling. We handle everything from smartphones to industrial electronics with zero-landfill commitment.',
    address: { street: 'Survey No. 42, Hinjewadi Phase 1', city: 'Pune', state: 'Maharashtra', pincode: '411057' },
    location: { type: 'Point', coordinates: [73.7379, 18.5912] },
    contact: { phone: '020-67891234', email: 'info@greentechewaste.in', website: 'https://greentechewaste.in' },
    wasteTypes: ['mobile', 'laptop', 'battery', 'printer'],
    certifications: [{ name: 'ISO 14001:2015', issuedBy: 'TÜV SÜD', validUntil: new Date('2027-06-30') }],
    isCertified: true, rating: 4.5, totalReviews: 28,
    operatingHours: { mon: '9:00-18:00', tue: '9:00-18:00', wed: '9:00-18:00', thu: '9:00-18:00', fri: '9:00-18:00', sat: '10:00-14:00', sun: 'Closed' },
    acceptsPickup: true, acceptsDropoff: true,
  },
  {
    name: 'EcoRecycle Pune Pvt. Ltd.',
    description: 'Government-authorized e-waste dismantler and recycler serving the Pune Metropolitan Region since 2015. CPCB registered with state-of-the-art shredding facility.',
    address: { street: 'Plot D-23, Bhosari MIDC', city: 'Pune', state: 'Maharashtra', pincode: '411026' },
    location: { type: 'Point', coordinates: [73.8503, 18.6298] },
    contact: { phone: '020-27121000', email: 'contact@ecorecyclepune.com', website: 'https://ecorecyclepune.com' },
    wasteTypes: ['mobile', 'laptop', 'battery', 'television', 'refrigerator', 'printer', 'other'],
    certifications: [
      { name: 'CPCB Authorization', issuedBy: 'MPCB', validUntil: new Date('2028-03-31') },
      { name: 'ISO 14001:2015', issuedBy: 'Bureau Veritas', validUntil: new Date('2027-12-31') },
    ],
    isCertified: true, rating: 4.7, totalReviews: 45,
    operatingHours: { mon: '8:00-20:00', tue: '8:00-20:00', wed: '8:00-20:00', thu: '8:00-20:00', fri: '8:00-20:00', sat: '9:00-17:00', sun: '10:00-14:00' },
    acceptsPickup: true, acceptsDropoff: true,
  },
  {
    name: 'CleanEarth Recyclers',
    description: 'Specializing in battery and mobile phone recycling with advanced lithium-ion recovery technology. We safely extract cobalt, nickel, and lithium for reuse.',
    address: { street: '15B, Kothrud Industrial Area', city: 'Pune', state: 'Maharashtra', pincode: '411038' },
    location: { type: 'Point', coordinates: [73.8072, 18.5074] },
    contact: { phone: '020-25430987', email: 'hello@cleanearth.co.in' },
    wasteTypes: ['mobile', 'battery', 'laptop'],
    certifications: [{ name: 'R2 Certification', issuedBy: 'SERI', validUntil: new Date('2027-09-30') }],
    isCertified: true, rating: 4.3, totalReviews: 19,
    operatingHours: { mon: '9:30-17:30', tue: '9:30-17:30', wed: '9:30-17:30', thu: '9:30-17:30', fri: '9:30-17:30', sat: '10:00-13:00', sun: 'Closed' },
    acceptsPickup: false, acceptsDropoff: true,
  },
  {
    name: 'TechTrash Collection Hub',
    description: 'Convenient drop-off center for household e-waste in the heart of Pune. We accept all types of electronics — no quantity too small.',
    address: { street: 'Shop 7, Aundh IT Park Road', city: 'Pune', state: 'Maharashtra', pincode: '411007' },
    location: { type: 'Point', coordinates: [73.8077, 18.5583] },
    contact: { phone: '9876543210', email: 'techtrash@gmail.com' },
    wasteTypes: ['mobile', 'laptop', 'battery', 'television', 'printer', 'other'],
    isCertified: false, rating: 3.9, totalReviews: 12,
    operatingHours: { mon: '10:00-20:00', tue: '10:00-20:00', wed: '10:00-20:00', thu: '10:00-20:00', fri: '10:00-20:00', sat: '10:00-20:00', sun: '11:00-16:00' },
    acceptsPickup: false, acceptsDropoff: true,
  },
  {
    name: 'Urban Mine Recyclers',
    description: 'We turn your electronic waste into valuable resources. Our hydrometallurgical process recovers over 95% of precious metals from circuit boards.',
    address: { street: 'Gat No. 189, Chakan MIDC', city: 'Pune', state: 'Maharashtra', pincode: '410501' },
    location: { type: 'Point', coordinates: [73.8630, 18.7606] },
    contact: { phone: '020-45678901', email: 'info@urbanmine.in', website: 'https://urbanmine.in' },
    wasteTypes: ['laptop', 'mobile', 'printer', 'other'],
    certifications: [{ name: 'ISO 45001:2018', issuedBy: 'DNV GL', validUntil: new Date('2028-01-15') }],
    isCertified: true, rating: 4.6, totalReviews: 33,
    operatingHours: { mon: '7:00-19:00', tue: '7:00-19:00', wed: '7:00-19:00', thu: '7:00-19:00', fri: '7:00-19:00', sat: '8:00-14:00', sun: 'Closed' },
    acceptsPickup: true, acceptsDropoff: true,
  },
  {
    name: 'Shree Ganesh E-Waste Center',
    description: 'Family-run collection center providing doorstep pickup across Hadapsar and Magarpatta. Quick response and transparent pricing for all e-waste items.',
    address: { street: '101, Seasons Mall Road, Hadapsar', city: 'Pune', state: 'Maharashtra', pincode: '411028' },
    location: { type: 'Point', coordinates: [73.9304, 18.5089] },
    contact: { phone: '9823456789', email: 'sgecenter@yahoo.in' },
    wasteTypes: ['mobile', 'laptop', 'television', 'refrigerator', 'other'],
    isCertified: false, rating: 4.1, totalReviews: 8,
    operatingHours: { mon: '10:00-19:00', tue: '10:00-19:00', wed: '10:00-19:00', thu: '10:00-19:00', fri: '10:00-19:00', sat: '10:00-19:00', sun: 'Closed' },
    acceptsPickup: true, acceptsDropoff: true,
  },
  {
    name: 'Paryavaran E-Waste Solutions',
    description: 'MPCB-authorized recycler with a dedicated data destruction unit. We provide certificates of destruction for corporate clients handling sensitive equipment.',
    address: { street: 'C-Wing, ICC Trade Tower, SB Road', city: 'Pune', state: 'Maharashtra', pincode: '411016' },
    location: { type: 'Point', coordinates: [73.8333, 18.5362] },
    contact: { phone: '020-30001234', email: 'contact@paryavaran.co.in', website: 'https://paryavaran.co.in' },
    wasteTypes: ['laptop', 'printer', 'mobile', 'other'],
    certifications: [
      { name: 'MPCB Authorization', issuedBy: 'MPCB', validUntil: new Date('2027-03-31') },
      { name: 'NIST Data Destruction', issuedBy: 'Blancco', validUntil: new Date('2026-12-31') },
    ],
    isCertified: true, rating: 4.8, totalReviews: 52,
    operatingHours: { mon: '9:00-18:00', tue: '9:00-18:00', wed: '9:00-18:00', thu: '9:00-18:00', fri: '9:00-18:00', sat: '10:00-15:00', sun: 'Closed' },
    acceptsPickup: true, acceptsDropoff: true,
  },
  {
    name: 'RE-Do Electronics',
    description: 'Refurbishment-first approach — we repair and resell viable electronics, and responsibly recycle the rest. Part of the circular economy initiative by Pune Smart City.',
    address: { street: '24, Baner Road, Near Westend Mall', city: 'Pune', state: 'Maharashtra', pincode: '411045' },
    location: { type: 'Point', coordinates: [73.7871, 18.5596] },
    contact: { phone: '8888234567', email: 'redo@gmail.com' },
    wasteTypes: ['mobile', 'laptop', 'television'],
    isCertified: false, rating: 4.0, totalReviews: 15,
    operatingHours: { mon: '11:00-20:00', tue: '11:00-20:00', wed: '11:00-20:00', thu: '11:00-20:00', fri: '11:00-20:00', sat: '11:00-20:00', sun: '12:00-17:00' },
    acceptsPickup: false, acceptsDropoff: true,
  },
  {
    name: 'Kiran Copper & Metal Recyclers',
    description: 'Industrial-scale metal recovery from large appliances. Specializing in refrigerator degassing and safe CFC extraction before metal shredding.',
    address: { street: 'Plot 78, Ranjangaon MIDC', city: 'Pune', state: 'Maharashtra', pincode: '412210' },
    location: { type: 'Point', coordinates: [74.1277, 18.7283] },
    contact: { phone: '020-67654321', email: 'info@kiranmetals.in', website: 'https://kiranmetals.in' },
    wasteTypes: ['refrigerator', 'television', 'other'],
    certifications: [{ name: 'CPCB Authorization', issuedBy: 'MPCB', validUntil: new Date('2028-06-30') }],
    isCertified: true, rating: 4.4, totalReviews: 21,
    operatingHours: { mon: '8:00-17:00', tue: '8:00-17:00', wed: '8:00-17:00', thu: '8:00-17:00', fri: '8:00-17:00', sat: '8:00-12:00', sun: 'Closed' },
    acceptsPickup: true, acceptsDropoff: true,
  },
  {
    name: 'i-Recycle Pune',
    description: 'App-based e-waste collection service. Schedule a pickup in 2 minutes and earn Green Points redeemable for discounts at partner stores.',
    address: { street: '55, Koregaon Park, Lane 6', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
    location: { type: 'Point', coordinates: [73.8933, 18.5362] },
    contact: { phone: '7020123456', email: 'support@irecyclepune.com', website: 'https://irecyclepune.com' },
    wasteTypes: ['mobile', 'laptop', 'battery', 'printer'],
    isCertified: false, rating: 4.2, totalReviews: 37,
    operatingHours: { mon: '8:00-21:00', tue: '8:00-21:00', wed: '8:00-21:00', thu: '8:00-21:00', fri: '8:00-21:00', sat: '9:00-18:00', sun: '10:00-16:00' },
    acceptsPickup: true, acceptsDropoff: false,
  },
  {
    name: 'Vighnaharta Green Works',
    description: 'Pimpri-Chinchwad authorized e-waste handler. We serve the PCMC industrial belt and offer bulk pickup for IT companies and manufacturing units.',
    address: { street: 'A-Block, PCMC Industrial Estate, Pimpri', city: 'Pune', state: 'Maharashtra', pincode: '411018' },
    location: { type: 'Point', coordinates: [73.8007, 18.6271] },
    contact: { phone: '020-27425678', email: 'vighnagw@gmail.com' },
    wasteTypes: ['laptop', 'printer', 'mobile', 'television', 'other'],
    certifications: [{ name: 'PCMC Authorization', issuedBy: 'PCMC', validUntil: new Date('2027-10-31') }],
    isCertified: true, rating: 4.3, totalReviews: 14,
    operatingHours: { mon: '9:00-18:00', tue: '9:00-18:00', wed: '9:00-18:00', thu: '9:00-18:00', fri: '9:00-18:00', sat: '9:00-13:00', sun: 'Closed' },
    acceptsPickup: true, acceptsDropoff: true,
  },
  {
    name: 'Sahyadri E-Waste Processing',
    description: 'Located near Sinhagad Road, we process over 500 tonnes of e-waste annually. Our advanced separation technology recovers gold, silver, palladium, and copper.',
    address: { street: 'Gate No. 34, Warje Industrial Area', city: 'Pune', state: 'Maharashtra', pincode: '411058' },
    location: { type: 'Point', coordinates: [73.8058, 18.4827] },
    contact: { phone: '020-24520908', email: 'info@sahyadriewaste.com', website: 'https://sahyadriewaste.com' },
    wasteTypes: ['mobile', 'laptop', 'battery', 'television', 'refrigerator', 'printer', 'other'],
    certifications: [
      { name: 'ISO 14001:2015', issuedBy: 'SGS', validUntil: new Date('2027-08-15') },
      { name: 'E-Stewards', issuedBy: 'BAN', validUntil: new Date('2027-04-30') },
    ],
    isCertified: true, rating: 4.9, totalReviews: 67,
    operatingHours: { mon: '7:30-19:30', tue: '7:30-19:30', wed: '7:30-19:30', thu: '7:30-19:30', fri: '7:30-19:30', sat: '8:00-16:00', sun: '9:00-13:00' },
    acceptsPickup: true, acceptsDropoff: true,
  },
  {
    name: 'NovaTech Disposals',
    description: 'Premium corporate e-waste management service. We provide on-site shredding, certified data wiping, and compliance reporting for GDPR and IT Act requirements.',
    address: { street: '3rd Floor, Cerebrum IT Park, Kalyani Nagar', city: 'Pune', state: 'Maharashtra', pincode: '411006' },
    location: { type: 'Point', coordinates: [73.9015, 18.5520] },
    contact: { phone: '020-41234567', email: 'enterprise@novatech.in', website: 'https://novatech.in' },
    wasteTypes: ['laptop', 'printer', 'mobile'],
    certifications: [{ name: 'SOC 2 Type II', issuedBy: 'Deloitte', validUntil: new Date('2027-02-28') }],
    isCertified: true, rating: 4.6, totalReviews: 29,
    operatingHours: { mon: '9:00-18:00', tue: '9:00-18:00', wed: '9:00-18:00', thu: '9:00-18:00', fri: '9:00-18:00', sat: 'By Appointment', sun: 'Closed' },
    acceptsPickup: true, acceptsDropoff: true,
  },
  {
    name: 'Swachh Digital Center',
    description: 'Community-run e-waste collection point supported by the Pune Municipal Corporation under the Swachh Bharat digital initiative. Free drop-off for residents.',
    address: { street: 'Near Sarasbaug Garden, Tilak Road', city: 'Pune', state: 'Maharashtra', pincode: '411030' },
    location: { type: 'Point', coordinates: [73.8567, 18.5013] },
    contact: { phone: '020-24333444', email: 'swachhdigital@pmc.gov.in' },
    wasteTypes: ['mobile', 'battery', 'laptop', 'television', 'other'],
    isCertified: false, rating: 3.8, totalReviews: 9,
    operatingHours: { mon: '10:00-17:00', tue: '10:00-17:00', wed: '10:00-17:00', thu: '10:00-17:00', fri: '10:00-17:00', sat: '10:00-14:00', sun: 'Closed' },
    acceptsPickup: false, acceptsDropoff: true,
  },
  {
    name: 'ByteBack Recyclers',
    description: 'Young startup focused on making e-waste recycling accessible. Doorstep collection with real-time tracking. Certified partner of Dell Reconnect India.',
    address: { street: '12, Viman Nagar Main Road', city: 'Pune', state: 'Maharashtra', pincode: '411014' },
    location: { type: 'Point', coordinates: [73.9146, 18.5679] },
    contact: { phone: '9011223344', email: 'hello@byteback.in', website: 'https://byteback.in' },
    wasteTypes: ['mobile', 'laptop', 'battery', 'printer', 'other'],
    certifications: [{ name: 'Dell Reconnect Partner', issuedBy: 'Dell India', validUntil: new Date('2027-12-31') }],
    isCertified: true, rating: 4.4, totalReviews: 41,
    operatingHours: { mon: '8:00-22:00', tue: '8:00-22:00', wed: '8:00-22:00', thu: '8:00-22:00', fri: '8:00-22:00', sat: '9:00-20:00', sun: '10:00-18:00' },
    acceptsPickup: true, acceptsDropoff: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
//  SMART DUSTBINS across Pune (with GPS coordinates)
// ═══════════════════════════════════════════════════════════════════════════
const dustbins = [
  { dustbinId: 'BIN-001', label: 'Hinjewadi IT Park Gate',      fillLevel: 72,  distance: 7.0,   location: { type: 'Point', coordinates: [73.7379, 18.5912] } },
  { dustbinId: 'BIN-002', label: 'Shivajinagar Bus Stand',      fillLevel: 45,  distance: 13.75, location: { type: 'Point', coordinates: [73.8567, 18.5308] } },
  { dustbinId: 'BIN-003', label: 'Phoenix Mall Viman Nagar',    fillLevel: 91,  distance: 2.25,  location: { type: 'Point', coordinates: [73.9146, 18.5679] } },
  { dustbinId: 'BIN-004', label: 'Koregaon Park Lane 5',        fillLevel: 18,  distance: 20.5,  location: { type: 'Point', coordinates: [73.8933, 18.5362] } },
  { dustbinId: 'BIN-005', label: 'Magarpatta City Entrance',    fillLevel: 63,  distance: 9.25,  location: { type: 'Point', coordinates: [73.9304, 18.5089] } },
  { dustbinId: 'BIN-006', label: 'FC Road College Junction',    fillLevel: 55,  distance: 11.25, location: { type: 'Point', coordinates: [73.8412, 18.5234] } },
  { dustbinId: 'BIN-007', label: 'Baner Balewadi High Street',  fillLevel: 34,  distance: 16.5,  location: { type: 'Point', coordinates: [73.7871, 18.5596] } },
  { dustbinId: 'BIN-008', label: 'PCMC Bhosari MIDC',           fillLevel: 87,  distance: 3.25,  location: { type: 'Point', coordinates: [73.8503, 18.6298] } },
  { dustbinId: 'BIN-009', label: 'Sarasbaug Garden',            fillLevel: 12,  distance: 22.0,  location: { type: 'Point', coordinates: [73.8567, 18.5013] } },
  { dustbinId: 'BIN-010', label: 'Kalyani Nagar IT Hub',        fillLevel: 78,  distance: 5.5,   location: { type: 'Point', coordinates: [73.9015, 18.5520] } },
];

// ═══════════════════════════════════════════════════════════════════════════
//  SEED FUNCTION
// ═══════════════════════════════════════════════════════════════════════════
const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected...\n');

    // ── 1. Admin user ─────────────────────────────────────────────────────
    const adminEmail = 'admin@ecowastefinder.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: 'Admin', email: adminEmail, password: 'Admin@1234',
        role: 'admin', isActive: true,
        location: { type: 'Point', coordinates: [73.8567, 18.5204] },
      });
      console.log('✅ Admin created (admin@ecowastefinder.com / Admin@1234)');
    } else {
      console.log('ℹ️  Admin already exists');
    }

    // ── 2. Sample users ───────────────────────────────────────────────────
    const sampleUsers = [
      { name: 'Rahul Sharma',   email: 'rahul@test.com',   password: 'Test@1234', phone: '9876543210' },
      { name: 'Priya Deshmukh', email: 'priya@test.com',   password: 'Test@1234', phone: '9823456789' },
      { name: 'Amit Kulkarni',  email: 'amit@test.com',    password: 'Test@1234', phone: '7020123456' },
    ];
    for (const u of sampleUsers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await User.create({ ...u, role: 'user', isActive: true, totalPoints: Math.floor(Math.random() * 800), location: { type: 'Point', coordinates: [73.85 + Math.random() * 0.1, 18.50 + Math.random() * 0.1] } });
        console.log(`✅ User created: ${u.email}`);
      }
    }

    // ── 3. Facilities ─────────────────────────────────────────────────────
    const existingCount = await Facility.countDocuments();
    if (existingCount >= 15) {
      console.log(`ℹ️  ${existingCount} facilities already exist — skipping`);
    } else {
      await Facility.deleteMany({});
      for (const f of facilities) {
        await Facility.create({ ...f, addedBy: admin._id });
      }
      console.log(`✅ ${facilities.length} Pune facilities seeded`);
    }

    // ── 4. Dustbins ───────────────────────────────────────────────────────
    for (const d of dustbins) {
      await Dustbin.findOneAndUpdate(
        { dustbinId: d.dustbinId },
        { ...d, status: undefined, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    }
    // Trigger pre-save to set status correctly
    const allBins = await Dustbin.find();
    for (const bin of allBins) { await bin.save(); }
    console.log(`✅ ${dustbins.length} smart dustbins seeded`);

    // ── Done ──────────────────────────────────────────────────────────────
    console.log('\n🎉 Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

seed();