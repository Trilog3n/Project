import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const CATEGORIES = [
  { name: 'Plumbing', icon: 'wrench' },
  { name: 'Electrical', icon: 'zap' },
  { name: 'Cleaning', icon: 'sparkles' },
  { name: 'Carpentry', icon: 'hammer' },
  { name: 'Painting', icon: 'paintbrush' },
  { name: 'Appliance Repair', icon: 'tool' },
];

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Categories
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name, icon: cat.icon },
    });
  }

  // Admin user
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@diggu.in' },
    update: {},
    create: {
      name: 'Platform Admin',
      email: 'admin@diggu.in',
      phone: '+919876543210',
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  // Demo customer
  const customerPassword = await bcrypt.hash('Customer@123', 12);
  await prisma.user.upsert({
    where: { email: 'customer@demo.in' },
    update: {},
    create: {
      name: 'Demo Customer',
      email: 'customer@demo.in',
      phone: '+919876543211',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  const extraCustomers = [
    {
      name: 'Anita Joseph',
      email: 'anita.customer@demo.in',
      phone: '+919876543215',
    },
    {
      name: 'Rahul Das',
      email: 'rahul.customer@demo.in',
      phone: '+919876543216',
    },
  ];

  for (const c of extraCustomers) {
    await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        passwordHash: customerPassword,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        emailVerified: true,
      },
    });
  }

  // Demo vendors
  const vendorPassword = await bcrypt.hash('Vendor@123', 12);
  const categories = await prisma.category.findMany();

  const vendors = [
    {
      name: 'Rajesh Kumar',
      email: 'rajesh.plumber@demo.in',
      phone: '+919876543212',
      bio: 'Licensed plumber with 12 years of experience in Kochi. Specializing in pipe repairs, bathroom fittings, and water heater installation.',
      experience: 12,
      category: 'Plumbing',
      city: 'Kochi',
      address: 'MG Road, Kochi',
      services: [
        { name: 'Pipe Leak Repair', price: 500, duration: 60, description: 'Fix leaking pipes and joints' },
        { name: 'Bathroom Fitting', price: 1500, duration: 120, description: 'Install taps, showers, and fixtures' },
        { name: 'Water Heater Install', price: 800, duration: 90, description: 'Geyser installation and repair' },
      ],
    },
    {
      name: 'Suresh Nair',
      email: 'suresh.electric@demo.in',
      phone: '+919876543213',
      bio: 'Certified electrician serving Ernakulam district. Expert in wiring, switchboard repairs, and home automation.',
      experience: 8,
      category: 'Electrical',
      city: 'Kochi',
      address: 'Edapally, Kochi',
      services: [
        { name: 'Wiring & Rewiring', price: 2000, duration: 180, description: 'Complete home wiring solutions' },
        { name: 'Switchboard Repair', price: 400, duration: 45, description: 'Fix faulty switches and boards' },
        { name: 'Fan Installation', price: 300, duration: 30, description: 'Ceiling fan installation' },
      ],
    },
    {
      name: 'Priya Menon',
      email: 'priya.clean@demo.in',
      phone: '+919876543214',
      bio: 'Professional home cleaning service with eco-friendly products. Deep cleaning specialist for apartments and villas.',
      experience: 5,
      category: 'Cleaning',
      city: 'Kochi',
      address: 'Kakkanad, Kochi',
      services: [
        { name: 'Deep Home Cleaning', price: 2500, duration: 240, description: 'Full home deep cleaning' },
        { name: 'Kitchen Cleaning', price: 800, duration: 90, description: 'Thorough kitchen sanitization' },
        { name: 'Bathroom Cleaning', price: 600, duration: 60, description: 'Bathroom deep clean and disinfection' },
      ],
    },
    {
      name: 'Binu Mathew',
      email: 'binu.carpenter@demo.in',
      phone: '+919876543217',
      bio: 'Skilled carpenter for furniture repair, custom shelves, and modular installations.',
      experience: 9,
      category: 'Carpentry',
      city: 'Kochi',
      address: 'Palarivattom, Kochi',
      services: [
        { name: 'Furniture Repair', price: 1200, duration: 120, description: 'Repair chairs, tables, and cabinets' },
        { name: 'Custom Shelf Installation', price: 1800, duration: 150, description: 'Wall-mounted and modular shelves' },
        { name: 'Door Alignment', price: 700, duration: 60, description: 'Fix door closing and hinge issues' },
      ],
    },
    {
      name: 'Nisha Varghese',
      email: 'nisha.paint@demo.in',
      phone: '+919876543218',
      bio: 'Interior and exterior painting specialist with premium finish and quick turnaround.',
      experience: 7,
      category: 'Painting',
      city: 'Kochi',
      address: 'Kaloor, Kochi',
      services: [
        { name: 'Interior Wall Painting', price: 3500, duration: 300, description: 'Premium interior paint service' },
        { name: 'Exterior Painting', price: 5000, duration: 420, description: 'Weather-resistant exterior coats' },
        { name: 'Texture Finish', price: 2400, duration: 240, description: 'Designer texture wall finishes' },
      ],
    },
    {
      name: 'Akhil Antony',
      email: 'akhil.appliance@demo.in',
      phone: '+919876543219',
      bio: 'Experienced technician for AC, washing machine, and refrigerator service.',
      experience: 10,
      category: 'Appliance Repair',
      city: 'Kochi',
      address: 'Vyttila, Kochi',
      services: [
        { name: 'AC Service', price: 1000, duration: 90, description: 'Cleaning and gas pressure check' },
        { name: 'Washing Machine Repair', price: 1200, duration: 100, description: 'Diagnosis and part replacement' },
        { name: 'Refrigerator Repair', price: 1300, duration: 120, description: 'Cooling issue diagnosis and fix' },
      ],
    },
  ];

  for (const v of vendors) {
    const category = categories.find((c) => c.name === v.category);
    if (!category) continue;

    const user = await prisma.user.upsert({
      where: { email: v.email },
      update: {},
      create: {
        name: v.name,
        email: v.email,
        phone: v.phone,
        passwordHash: vendorPassword,
        role: 'VENDOR',
        status: 'ACTIVE',
        emailVerified: true,
      },
    });

    const profile = await prisma.vendorProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        bio: v.bio,
        experience: v.experience,
        rating: 4.5 + Math.random() * 0.5,
        verified: true,
        workingRadius: 15,
        address: v.address,
        city: v.city,
        completedJobs: Math.floor(Math.random() * 100) + 20,
      },
    });

    for (const s of v.services) {
      await prisma.service.create({
        data: {
          vendorId: profile.id,
          categoryId: category.id,
          name: s.name,
          price: s.price,
          duration: s.duration,
          description: s.description,
        },
      });
    }

    // Working hours Mon-Sat 9-6
    for (let day = 1; day <= 6; day++) {
      await prisma.workingHours.upsert({
        where: { vendorId_dayOfWeek: { vendorId: profile.id, dayOfWeek: day } },
        update: {},
        create: {
          vendorId: profile.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '18:00',
          isActive: true,
        },
      });
    }
  }

  console.log('Seed completed!');
  console.log('Admin: admin@diggu.in / Admin@123');
  console.log('Customer: customer@demo.in / Customer@123');
  console.log('Customers: anita.customer@demo.in / Customer@123, rahul.customer@demo.in / Customer@123');
  console.log('Vendors:');
  console.log('- rajesh.plumber@demo.in / Vendor@123');
  console.log('- suresh.electric@demo.in / Vendor@123');
  console.log('- priya.clean@demo.in / Vendor@123');
  console.log('- binu.carpenter@demo.in / Vendor@123');
  console.log('- nisha.paint@demo.in / Vendor@123');
  console.log('- akhil.appliance@demo.in / Vendor@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
