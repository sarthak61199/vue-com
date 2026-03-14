import 'dotenv/config'
import { PrismaClient, PromoScope, DiscountType } from './generated/client.js'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding...')

  await prisma.productVariantValue.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.promoUsage.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.variantOption.deleteMany()
  await prisma.variantType.deleteMany()
  await prisma.wishlistItem.deleteMany()
  await prisma.review.deleteMany()
  await prisma.order.deleteMany()
  await prisma.address.deleteMany()
  await prisma.promo.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()

  const [tropicals, succulents, statement, trailing] = await Promise.all([
    prisma.category.create({ data: { name: 'Tropicals' } }),
    prisma.category.create({ data: { name: 'Succulents & Cacti' } }),
    prisma.category.create({ data: { name: 'Statement Plants' } }),
    prisma.category.create({ data: { name: 'Trailing & Hanging' } }),
  ])

  // Helper to create a default (single) variant for a simple product
  async function createDefaultVariant(productId: string, price: number, stock = 20) {
    await prisma.productVariant.create({
      data: { productId, price, stock, isDefault: true },
    })
  }

  // --- Products with variants ---

  // Monstera Deliciosa — Pot Size + Pot Color variants
  const monstera = await prisma.product.create({
    data: {
      name: 'Monstera Deliciosa',
      price: 29.99, // base/display price (lowest variant)
      description:
        'The iconic split-leaf philodendron. Low maintenance and thrives in indirect light. A statement piece for any room.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=Monstera',
      categoryId: tropicals.id,
    },
  })
  const monsteraPotSize = await prisma.variantType.create({
    data: { productId: monstera.id, name: 'Pot Size', position: 0 },
  })
  const monsteraPotColor = await prisma.variantType.create({
    data: { productId: monstera.id, name: 'Pot Color', position: 1 },
  })
  const [mSmall, mMedium, mLarge] = await Promise.all([
    prisma.variantOption.create({ data: { variantTypeId: monsteraPotSize.id, value: 'Small (4")', position: 0 } }),
    prisma.variantOption.create({ data: { variantTypeId: monsteraPotSize.id, value: 'Medium (6")', position: 1 } }),
    prisma.variantOption.create({ data: { variantTypeId: monsteraPotSize.id, value: 'Large (8")', position: 2 } }),
  ])
  const [mTerracotta, mWhite, mBlack] = await Promise.all([
    prisma.variantOption.create({ data: { variantTypeId: monsteraPotColor.id, value: 'Terracotta', position: 0 } }),
    prisma.variantOption.create({ data: { variantTypeId: monsteraPotColor.id, value: 'White Ceramic', position: 1 } }),
    prisma.variantOption.create({ data: { variantTypeId: monsteraPotColor.id, value: 'Black Ceramic', position: 2 } }),
  ])
  // Sparse combinations: Small×Terracotta (default), Small×White, Medium×Terracotta, Medium×White, Large×White, Large×Black
  await Promise.all([
    prisma.productVariant.create({
      data: {
        productId: monstera.id, price: 29.99, stock: 20, isDefault: true,
        values: { create: [{ optionId: mSmall.id }, { optionId: mTerracotta.id }] },
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: monstera.id, price: 29.99, stock: 3,
        values: { create: [{ optionId: mSmall.id }, { optionId: mWhite.id }] },
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: monstera.id, price: 39.99, stock: 15,
        values: { create: [{ optionId: mMedium.id }, { optionId: mTerracotta.id }] },
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: monstera.id, price: 39.99, stock: 0,
        values: { create: [{ optionId: mMedium.id }, { optionId: mWhite.id }] },
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: monstera.id, price: 54.99, stock: 5,
        values: { create: [{ optionId: mLarge.id }, { optionId: mWhite.id }] },
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: monstera.id, price: 54.99, stock: 25,
        values: { create: [{ optionId: mLarge.id }, { optionId: mBlack.id }] },
      },
    }),
  ])

  // Bird of Paradise — Pot Size variants only
  const bop = await prisma.product.create({
    data: {
      name: 'Bird of Paradise',
      price: 59.99,
      description:
        'Dramatic, oversized leaves that bring a tropical feel indoors. Grows large and loves a bright sunny spot.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=Bird+of+Paradise',
      categoryId: tropicals.id,
    },
  })
  const bopPotSize = await prisma.variantType.create({
    data: { productId: bop.id, name: 'Pot Size', position: 0 },
  })
  const [bSmall, bMedium, bLarge] = await Promise.all([
    prisma.variantOption.create({ data: { variantTypeId: bopPotSize.id, value: 'Small (4")', position: 0 } }),
    prisma.variantOption.create({ data: { variantTypeId: bopPotSize.id, value: 'Medium (6")', position: 1 } }),
    prisma.variantOption.create({ data: { variantTypeId: bopPotSize.id, value: 'Large (10")', position: 2 } }),
  ])
  await Promise.all([
    prisma.productVariant.create({
      data: { productId: bop.id, price: 59.99, stock: 18, isDefault: true, values: { create: [{ optionId: bSmall.id }] } },
    }),
    prisma.productVariant.create({
      data: { productId: bop.id, price: 79.99, stock: 4, values: { create: [{ optionId: bMedium.id }] } },
    }),
    prisma.productVariant.create({
      data: { productId: bop.id, price: 109.99, stock: 0, values: { create: [{ optionId: bLarge.id }] } },
    }),
  ])

  // Rubber Plant — Pot Size + Pot Color variants
  const rubber = await prisma.product.create({
    data: {
      name: 'Rubber Plant',
      price: 34.99,
      description:
        'Deep burgundy leaves with a waxy sheen. Grows tall and bold, making it a striking focal point in any room.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=Rubber+Plant',
      categoryId: statement.id,
    },
  })
  const rubberPotSize = await prisma.variantType.create({
    data: { productId: rubber.id, name: 'Pot Size', position: 0 },
  })
  const rubberPotColor = await prisma.variantType.create({
    data: { productId: rubber.id, name: 'Pot Color', position: 1 },
  })
  const [rSmall, rMedium] = await Promise.all([
    prisma.variantOption.create({ data: { variantTypeId: rubberPotSize.id, value: 'Small (4")', position: 0 } }),
    prisma.variantOption.create({ data: { variantTypeId: rubberPotSize.id, value: 'Medium (6")', position: 1 } }),
  ])
  const [rTerracotta, rBlack] = await Promise.all([
    prisma.variantOption.create({ data: { variantTypeId: rubberPotColor.id, value: 'Terracotta', position: 0 } }),
    prisma.variantOption.create({ data: { variantTypeId: rubberPotColor.id, value: 'Black Ceramic', position: 1 } }),
  ])
  await Promise.all([
    prisma.productVariant.create({
      data: {
        productId: rubber.id, price: 34.99, stock: 22, isDefault: true,
        values: { create: [{ optionId: rSmall.id }, { optionId: rTerracotta.id }] },
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: rubber.id, price: 34.99, stock: 0,
        values: { create: [{ optionId: rSmall.id }, { optionId: rBlack.id }] },
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: rubber.id, price: 49.99, stock: 5,
        values: { create: [{ optionId: rMedium.id }, { optionId: rTerracotta.id }] },
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: rubber.id, price: 49.99, stock: 12,
        values: { create: [{ optionId: rMedium.id }, { optionId: rBlack.id }] },
      },
    }),
  ])

  // --- Simple products (single default variant) ---

  const simpleProducts: Array<Parameters<typeof prisma.product.create>[0]['data'] & { stock: number }> = [
    {
      name: 'Fiddle Leaf Fig',
      price: 54.99,
      stock: 17,
      description: 'Bold, architectural leaves that instantly elevate any space. Prefers bright, indirect light and consistent watering.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=Fiddle+Leaf',
      categoryId: statement.id,
    },
    {
      name: 'Pothos Golden',
      price: 14.99,
      stock: 30,
      description: 'Nearly indestructible and incredibly versatile. Trails beautifully from shelves and tolerates low light like a champ.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=Pothos',
      categoryId: trailing.id,
    },
    {
      name: 'Snake Plant',
      price: 24.99,
      stock: 0,
      description: 'Thrives on neglect. Tolerates low light and infrequent watering, making it perfect for beginners and busy people.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=Snake+Plant',
      categoryId: statement.id,
    },
    {
      name: 'Peace Lily',
      price: 19.99,
      stock: 4,
      description: 'Elegant white blooms and glossy leaves. One of the few flowering plants that does well in low light conditions.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=Peace+Lily',
      categoryId: tropicals.id,
    },
    {
      name: 'ZZ Plant',
      price: 29.99,
      stock: 22,
      description: 'Waxy, dark green leaves that stay looking perfect with minimal care. Drought-tolerant and virtually indestructible.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=ZZ+Plant',
      categoryId: statement.id,
    },
    {
      name: 'String of Pearls',
      price: 18.99,
      stock: 2,
      description: 'Cascading strings of round, bead-like leaves. A stunning hanging plant that loves bright light and fast-draining soil.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=String+of+Pearls',
      categoryId: trailing.id,
    },
    {
      name: 'Calathea Orbifolia',
      price: 32.99,
      stock: 15,
      description: 'Stunning silver-striped leaves that move throughout the day. Loves humidity and indirect light.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=Calathea',
      categoryId: tropicals.id,
    },
    {
      name: 'Aloe Vera',
      price: 16.99,
      stock: 25,
      description: 'A practical and beautiful succulent. Keep it on a sunny windowsill and it will reward you with natural soothing gel.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=Aloe+Vera',
      categoryId: succulents.id,
    },
    {
      name: 'Alocasia Polly',
      price: 44.99,
      stock: 8,
      description: 'Arrow-shaped leaves with striking white veins. A bold, exotic plant that makes an immediate visual impact.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=Alocasia',
      categoryId: tropicals.id,
    },
  ]

  for (const { stock, ...data } of simpleProducts) {
    const product = await prisma.product.create({ data })
    await createDefaultVariant(product.id, data.price as number, stock)
  }

  // --- Promos ---
  const oneYearFromNow = new Date()
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

  await Promise.all([
    prisma.promo.create({
      data: {
        code: 'SAVE10',
        description: '10% off your entire order',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        scope: PromoScope.ORDER,
        maxUses: 100,
        expiresAt: oneYearFromNow,
        isActive: true,
        isAutomatic: false,
      },
    }),
    prisma.promo.create({
      data: {
        code: 'FLAT5',
        description: '$5 off orders over $25',
        discountType: DiscountType.FIXED,
        discountValue: 5,
        scope: PromoScope.ORDER,
        minOrderAmount: 25,
        isActive: true,
        isAutomatic: false,
      },
    }),
    prisma.promo.create({
      data: {
        code: 'FREESHIP',
        description: 'Free shipping on orders over $50',
        discountType: DiscountType.FREE_SHIPPING,
        discountValue: 0,
        scope: PromoScope.ORDER,
        minOrderAmount: 50,
        isActive: true,
        isAutomatic: false,
      },
    }),
    prisma.promo.create({
      data: {
        code: 'SUCCULENTS20',
        description: '20% off Succulents & Cacti',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 20,
        scope: PromoScope.CATEGORY,
        categoryId: succulents.id,
        isActive: true,
        isAutomatic: false,
      },
    }),
    prisma.promo.create({
      data: {
        description: 'Automatic 5% off orders over $75',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 5,
        scope: PromoScope.ORDER,
        minOrderAmount: 75,
        isActive: true,
        isAutomatic: true,
      },
    }),
  ])

  console.log(`Seeded products across 4 categories with variants, stock, and promos.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
