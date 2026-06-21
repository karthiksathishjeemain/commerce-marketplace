import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const categories = [
  {
    name: "Electronics",
    slug: "electronics",
    description: "Smartphones, laptops, headphones, and cutting-edge gadgets",
    imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80",
  },
  {
    name: "Fashion",
    slug: "fashion",
    description: "Clothing, footwear, and accessories for every occasion",
    imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80",
  },
  {
    name: "Home & Kitchen",
    slug: "home-kitchen",
    description: "Appliances, cookware, and home essentials",
    imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80",
  },
  {
    name: "Books",
    slug: "books",
    description: "Bestsellers, classics, and educational titles",
    imageUrl: "https://images.unsplash.com/photo-1512820790801-4159a7379b4?w=800&q=80",
  },
  {
    name: "Sports & Fitness",
    slug: "sports-fitness",
    description: "Equipment and gear for active lifestyles",
    imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
  },
];

const products = [
  {
    name: "Sony WH-1000XM5 Wireless Headphones",
    description:
      "Industry-leading noise cancellation with Auto NC Optimizer. Crystal clear hands-free calling with 4 beamforming microphones. Up to 30-hour battery life with quick charging. Multipoint connection lets you connect two devices simultaneously.",
    price: 29990,
    compareAtPrice: 34990,
    stock: 45,
    sku: "SNY-WH1000XM5-BLK",
    brand: "Sony",
    imageUrl: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1546435770-a10-3782e78510?w=800&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80",
    ],
    categorySlug: "electronics",
    rating: 4.8,
    reviewCount: 2847,
  },
  {
    name: "Apple MacBook Air M3 13-inch",
    description:
      "Supercharged by the M3 chip. Strikingly thin design. Up to 18 hours of battery life. Liquid Retina display with 500 nits brightness. Fanless design for silent operation. Available with 8GB unified memory and 256GB SSD storage.",
    price: 114900,
    compareAtPrice: 119900,
    stock: 22,
    sku: "APL-MBA-M3-13",
    brand: "Apple",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52be?w=800&q=80",
    ],
    categorySlug: "electronics",
    rating: 4.9,
    reviewCount: 1523,
  },
  {
    name: "Samsung Galaxy S24 Ultra 256GB",
    description:
      "Galaxy AI is here. 200MP camera with 100x Space Zoom. Built-in S Pen for precision. Titanium frame with Gorilla Armor. 6.8-inch QHD+ Dynamic AMOLED 2X display. Snapdragon 8 Gen 3 for Galaxy processor.",
    price: 129999,
    compareAtPrice: 134999,
    stock: 38,
    sku: "SAM-GS24U-256",
    brand: "Samsung",
    imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e55182aa?w=800&q=80",
    images: [],
    categorySlug: "electronics",
    rating: 4.7,
    reviewCount: 3102,
  },
  {
    name: "Kindle Paperwhite Signature Edition",
    description:
      "6.8-inch glare-free display with adjustable warm light. 32 GB storage — holds thousands of books. Automatically adjusts front light. IPX8 rated waterproof. Includes wireless charging and auto-adjusting front light.",
    price: 17999,
    compareAtPrice: 19999,
    stock: 67,
    sku: "AMZ-KPW-SIG-32",
    brand: "Amazon",
    imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80",
    images: [],
    categorySlug: "electronics",
    rating: 4.6,
    reviewCount: 8921,
  },
  {
    name: "Bose SoundLink Flex Bluetooth Speaker",
    description:
      "Portable Bluetooth speaker with deep, clear, immersive sound. PositionIQ technology automatically detects orientation. IP67 waterproof and dustproof. Up to 12 hours of battery life. Built-in microphone for calls.",
    price: 14999,
    compareAtPrice: 16999,
    stock: 89,
    sku: "BSE-SLF-BLK",
    brand: "Bose",
    imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80",
    images: [],
    categorySlug: "electronics",
    rating: 4.5,
    reviewCount: 1245,
  },
  {
    name: "Levi's 501 Original Fit Jeans",
    description:
      "The original blue jean since 1873. Straight leg, sits at waist. Button fly with signature arcuate stitching. 100% cotton denim. Available in classic medium stonewash. Timeless style that never goes out of fashion.",
    price: 4499,
    compareAtPrice: 5999,
    stock: 120,
    sku: "LEV-501-ORG-32",
    brand: "Levi's",
    imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1475178626620-a4d074967744?w=800&q=80",
    ],
    categorySlug: "fashion",
    rating: 4.4,
    reviewCount: 5678,
  },
  {
    name: "Nike Air Max 270 Running Shoes",
    description:
      "Nike's biggest heel Air unit yet delivers unrivaled, all-day comfort. Mesh and synthetic upper for breathability. Rubber outsole with waffle-inspired pattern for traction. Heel pull tab for easy on and off.",
    price: 12995,
    compareAtPrice: 14995,
    stock: 75,
    sku: "NIK-AM270-BLK-10",
    brand: "Nike",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    images: [],
    categorySlug: "fashion",
    rating: 4.6,
    reviewCount: 4321,
  },
  {
    name: "Ray-Ban Aviator Classic Sunglasses",
    description:
      "Iconic aviator shape with crystal green G-15 lenses. Lightweight metal frame with adjustable nose pads. 100% UV protection. Includes Ray-Ban branded case and cleaning cloth. Timeless style since 1937.",
    price: 8990,
    compareAtPrice: 10990,
    stock: 55,
    sku: "RB-AVI-CL-G15",
    brand: "Ray-Ban",
    imageUrl: "https://images.unsplash.com/photo-1572635196233-14b4f7fb98f5?w=800&q=80",
    images: [],
    categorySlug: "fashion",
    rating: 4.7,
    reviewCount: 2134,
  },
  {
    name: "Fossil Gen 6 Smartwatch",
    description:
      "Wear OS by Google with Snapdragon Wear 4100+ platform. Heart rate, SpO2, and activity tracking. Fast charging — 80% in 30 minutes. 24mm interchangeable straps. Alexa built-in. 5 ATM water resistance.",
    price: 22995,
    compareAtPrice: 27995,
    stock: 34,
    sku: "FOS-GEN6-44-BRN",
    brand: "Fossil",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
    images: [],
    categorySlug: "fashion",
    rating: 4.3,
    reviewCount: 876,
  },
  {
    name: "Allen Solly Formal Blazer",
    description:
      "Premium poly-viscose blend fabric with a refined finish. Slim fit cut for a modern silhouette. Two-button closure with notch lapel. Functional flap pockets. Fully lined interior. Perfect for office and formal occasions.",
    price: 6999,
    compareAtPrice: 9999,
    stock: 48,
    sku: "AS-BLZ-NVY-40",
    brand: "Allen Solly",
    imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80",
    images: [],
    categorySlug: "fashion",
    rating: 4.2,
    reviewCount: 654,
  },
  {
    name: "Instant Pot Duo 7-in-1 Electric Pressure Cooker",
    description:
      "7 appliances in 1: pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker, and warmer. 6-quart capacity feeds up to 6 people. 13 one-touch smart programs. Stainless steel inner pot. 10+ safety features.",
    price: 8999,
    compareAtPrice: 11999,
    stock: 92,
    sku: "IP-DUO-6QT-SS",
    brand: "Instant Pot",
    imageUrl: "https://images.unsplash.com/photo-1585515328862-0b4b2a4ae0?w=800&q=80",
    images: [],
    categorySlug: "home-kitchen",
    rating: 4.7,
    reviewCount: 12456,
  },
  {
    name: "Dyson V15 Detect Cordless Vacuum",
    description:
      "Laser reveals microscopic dust. Piezo sensor counts and sizes particles. Up to 60 minutes of run time. Advanced whole-machine filtration. De-tangling Hair screw tool. LCD screen shows real-time performance data.",
    price: 62900,
    compareAtPrice: 69900,
    stock: 18,
    sku: "DYS-V15-DET-YLW",
    brand: "Dyson",
    imageUrl: "https://images.unsplash.com/photo-1558317374-067fb5f300?w=800&q=80",
    images: [],
    categorySlug: "home-kitchen",
    rating: 4.8,
    reviewCount: 3421,
  },
  {
    name: "Prestige Iris 750W Mixer Grinder",
    description:
      "750W powerful motor with 3 stainless steel jars. Super efficient blade system for fine grinding. 3-speed control with pulse function. Overload protection. Compact design with anti-skid base. 2-year warranty.",
    price: 3499,
    compareAtPrice: 4499,
    stock: 156,
    sku: "PRS-IRIS-750-3J",
    brand: "Prestige",
    imageUrl: "https://images.unsplash.com/photo-1570222094114-d054474706?w=800&q=80",
    images: [],
    categorySlug: "home-kitchen",
    rating: 4.4,
    reviewCount: 8765,
  },
  {
    name: "Philips Air Fryer HD9252/90",
    description:
      "Rapid Air technology for healthier frying with up to 90% less fat. 4.1L capacity serves 4-5 people. Digital touch screen with 7 presets. Keep warm function up to 30 minutes. Dishwasher-safe removable parts.",
    price: 9990,
    compareAtPrice: 12990,
    stock: 64,
    sku: "PHL-AF-9252-4L",
    brand: "Philips",
    imageUrl: "https://images.unsplash.com/photo-1585515655851-8?w=800&q=80",
    images: [],
    categorySlug: "home-kitchen",
    rating: 4.5,
    reviewCount: 5432,
  },
  {
    name: "Wakefit Orthopedic Memory Foam Mattress",
    description:
      "High-resilience foam with memory foam layer for optimal spinal alignment. Breathable fabric cover with zip-off design. 7-zone support for different body parts. 10-year warranty. Vacuum packed for easy delivery.",
    price: 8999,
    compareAtPrice: 14999,
    stock: 40,
    sku: "WF-ORT-MF-6IN-Q",
    brand: "Wakefit",
    imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
    images: [],
    categorySlug: "home-kitchen",
    rating: 4.6,
    reviewCount: 9876,
  },
  {
    name: "Atomic Habits by James Clear",
    description:
      "The #1 New York Times bestseller. An easy and proven way to build good habits and break bad ones. Tiny changes that deliver remarkable results. Over 15 million copies sold worldwide. Paperback edition, 320 pages.",
    price: 499,
    compareAtPrice: 799,
    stock: 500,
    sku: "BK-AH-JC-PB",
    brand: "Penguin Random House",
    imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80",
    images: [],
    categorySlug: "books",
    rating: 4.9,
    reviewCount: 45678,
  },
  {
    name: "The Psychology of Money by Morgan Housel",
    description:
      "Timeless lessons on wealth, greed, and happiness. 19 short stories exploring the strange ways people think about money. Wall Street Journal bestseller. Paperback, 256 pages. Essential reading for investors.",
    price: 399,
    compareAtPrice: 599,
    stock: 350,
    sku: "BK-POM-MH-PB",
    brand: "Jaico Publishing",
    imageUrl: "https://images.unsplash.com/photo-1512820790801-4159a7379b4?w=800&q=80",
    images: [],
    categorySlug: "books",
    rating: 4.8,
    reviewCount: 23456,
  },
  {
    name: "Sapiens: A Brief History of Humankind",
    description:
      "By Yuval Noah Harari. A groundbreaking narrative of humanity's creation and evolution. Explores how biology and history have defined us. Over 23 million copies sold. Paperback, 512 pages.",
    price: 549,
    compareAtPrice: 799,
    stock: 280,
    sku: "BK-SAP-YNH-PB",
    brand: "Penguin Books",
    imageUrl: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80",
    images: [],
    categorySlug: "books",
    rating: 4.7,
    reviewCount: 34567,
  },
  {
    name: "Ikigai: The Japanese Secret to a Long and Happy Life",
    description:
      "Discover the Japanese concept of ikigai — your reason for being. Based on interviews with the residents of Okinawa. Practical wisdom for finding purpose and joy. Hardcover, 208 pages.",
    price: 449,
    compareAtPrice: 699,
    stock: 420,
    sku: "BK-IKI-GAR-HC",
    brand: "Penguin Books",
    imageUrl: "https://images.unsplash.com/photo-1524995995642-b091487052?w=800&q=80",
    images: [],
    categorySlug: "books",
    rating: 4.5,
    reviewCount: 18923,
  },
  {
    name: "Decathlon Domyos Yoga Mat 8mm",
    description:
      "Comfortable 8mm thick TPE foam mat for yoga and pilates. Non-slip textured surface on both sides. Lightweight at 850g with carry strap included. Free from PVC and latex. Dimensions: 173 x 61 cm.",
    price: 1299,
    compareAtPrice: 1799,
    stock: 200,
    sku: "DEC-YMAT-8MM-GRN",
    brand: "Decathlon",
    imageUrl: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80",
    images: [],
    categorySlug: "sports-fitness",
    rating: 4.6,
    reviewCount: 7654,
  },
  {
    name: "Boldfit Adjustable Dumbbell Set 20kg",
    description:
      "Cast iron dumbbells with neoprene coating for grip and floor protection. Adjustable weight from 2.5kg to 20kg per dumbbell. Quick-change weight selection mechanism. Compact design saves space. Includes storage tray.",
    price: 7999,
    compareAtPrice: 9999,
    stock: 45,
    sku: "BF-DB-20KG-ADJ",
    brand: "Boldfit",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    images: [],
    categorySlug: "sports-fitness",
    rating: 4.4,
    reviewCount: 3210,
  },
  {
    name: "Yonex Nanoray Light 18i Badminton Racket",
    description:
      "Isometric head shape for enlarged sweet spot. Nanometric technology for lightweight power. Built-in T-Joint for stable shuttle control. Pre-strung with BG3 string. Suitable for intermediate to advanced players.",
    price: 2499,
    compareAtPrice: 3299,
    stock: 88,
    sku: "YNX-NRL18I-BLU",
    brand: "Yonex",
    imageUrl: "https://images.unsplash.com/photo-1626224582814-aa1805a1f0?w=800&q=80",
    images: [],
    categorySlug: "sports-fitness",
    rating: 4.5,
    reviewCount: 4567,
  },
  {
    name: "Garmin Forerunner 255 GPS Running Watch",
    description:
      "Advanced GPS running smartwatch with multi-band positioning. Up to 14 days battery life in smartwatch mode. Training readiness, HRV status, and morning report. Built-in sports apps for 30+ activities. Music storage for 500 songs.",
    price: 37990,
    compareAtPrice: 42990,
    stock: 29,
    sku: "GRM-FR255-46-BLK",
    brand: "Garmin",
    imageUrl: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&q=80",
    images: [],
    categorySlug: "sports-fitness",
    rating: 4.7,
    reviewCount: 1876,
  },
  {
    name: "Nike Dri-FIT Training T-Shirt",
    description:
      "Sweat-wicking Dri-FIT technology keeps you dry and comfortable. Standard fit for relaxed, easy movement. Ribbed crew neck. 100% polyester. Available in multiple colors. Machine washable.",
    price: 1895,
    compareAtPrice: 2495,
    stock: 180,
    sku: "NIK-DFT-TEE-L-BLK",
    brand: "Nike",
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
    images: [],
    categorySlug: "sports-fitness",
    rating: 4.3,
    reviewCount: 9876,
  },
];

async function main() {
  console.log("Seeding database...");

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash("Admin@123456", 12);
  const userPassword = await bcrypt.hash("User@123456", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@marketplace.com",
      passwordHash: adminPassword,
      firstName: "Admin",
      lastName: "User",
      role: Role.ADMIN,
      cart: { create: {} },
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      email: "demo@marketplace.com",
      passwordHash: userPassword,
      firstName: "Demo",
      lastName: "Shopper",
      role: Role.USER,
      cart: { create: {} },
      addresses: {
        create: {
          label: "Home",
          line1: "42 MG Road",
          line2: "Koramangala 5th Block",
          city: "Bangalore",
          state: "Karnataka",
          postalCode: "560034",
          country: "IN",
          isDefault: true,
        },
      },
    },
  });

  const categoryMap = new Map<string, string>();

  for (const cat of categories) {
    const created = await prisma.category.create({ data: cat });
    categoryMap.set(cat.slug, created.id);
  }

  for (const product of products) {
    const categoryId = categoryMap.get(product.categorySlug);
    if (!categoryId) continue;

    await prisma.product.create({
      data: {
        name: product.name,
        slug: slugify(product.name),
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stock: product.stock,
        sku: product.sku,
        brand: product.brand,
        imageUrl: product.imageUrl,
        images: product.images,
        categoryId,
        rating: product.rating,
        reviewCount: product.reviewCount,
      },
    });
  }

  console.log(`Seeded ${categories.length} categories and ${products.length} products`);
  console.log(`Admin: admin@marketplace.com / Admin@123456`);
  console.log(`Demo user: demo@marketplace.com / User@123456`);
  console.log(`Admin ID: ${admin.id}`);
  console.log(`Demo User ID: ${demoUser.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
