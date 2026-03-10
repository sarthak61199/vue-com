import 'dotenv/config'
import { PrismaClient } from './generated/client.js'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding...')

  await prisma.wishlistItem.deleteMany()
  await prisma.review.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.address.deleteMany()
  await prisma.order.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()

  const [tropicals, succulents, statement, trailing] = await Promise.all([
    prisma.category.create({ data: { name: 'Tropicals' } }),
    prisma.category.create({ data: { name: 'Succulents & Cacti' } }),
    prisma.category.create({ data: { name: 'Statement Plants' } }),
    prisma.category.create({ data: { name: 'Trailing & Hanging' } }),
  ])

  const products = [
    {
      name: 'Monstera Deliciosa',
      price: 34.99,
      description: 'The iconic split-leaf philodendron. Low maintenance and thrives in indirect light. A statement piece for any room.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=Monstera',
      categoryId: tropicals.id,
    },
    {
      name: 'Fiddle Leaf Fig',
      price: 54.99,
      description: 'Bold, architectural leaves that instantly elevate any space. Prefers bright, indirect light and consistent watering.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=Fiddle+Leaf',
      categoryId: statement.id,
    },
    {
      name: 'Pothos Golden',
      price: 14.99,
      description: 'Nearly indestructible and incredibly versatile. Trails beautifully from shelves and tolerates low light like a champ.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=Pothos',
      categoryId: trailing.id,
    },
    {
      name: 'Snake Plant',
      price: 24.99,
      description: 'Thrives on neglect. Tolerates low light and infrequent watering, making it perfect for beginners and busy people.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=Snake+Plant',
      categoryId: statement.id,
    },
    {
      name: 'Peace Lily',
      price: 19.99,
      description: 'Elegant white blooms and glossy leaves. One of the few flowering plants that does well in low light conditions.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=Peace+Lily',
      categoryId: tropicals.id,
    },
    {
      name: 'ZZ Plant',
      price: 29.99,
      description: 'Waxy, dark green leaves that stay looking perfect with minimal care. Drought-tolerant and virtually indestructible.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=ZZ+Plant',
      categoryId: statement.id,
    },
    {
      name: 'Bird of Paradise',
      price: 74.99,
      description: 'Dramatic, oversized leaves that bring a tropical feel indoors. Grows large and loves a bright sunny spot.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=Bird+of+Paradise',
      categoryId: tropicals.id,
    },
    {
      name: 'String of Pearls',
      price: 18.99,
      description: 'Cascading strings of round, bead-like leaves. A stunning hanging plant that loves bright light and fast-draining soil.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=String+of+Pearls',
      categoryId: trailing.id,
    },
    {
      name: 'Rubber Plant',
      price: 39.99,
      description: 'Deep burgundy leaves with a waxy sheen. Grows tall and bold, making it a striking focal point in any room.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=Rubber+Plant',
      categoryId: statement.id,
    },
    {
      name: 'Calathea Orbifolia',
      price: 32.99,
      description: 'Stunning silver-striped leaves that move throughout the day. Loves humidity and indirect light.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=Calathea',
      categoryId: tropicals.id,
    },
    {
      name: 'Aloe Vera',
      price: 16.99,
      description: 'A practical and beautiful succulent. Keep it on a sunny windowsill and it will reward you with natural soothing gel.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=Aloe+Vera',
      categoryId: succulents.id,
    },
    {
      name: 'Alocasia Polly',
      price: 44.99,
      description: 'Arrow-shaped leaves with striking white veins. A bold, exotic plant that makes an immediate visual impact.',
      image: 'https://placehold.co/800x600/d4edda/2d6a4f/webp?text=Alocasia',
      categoryId: tropicals.id,
    },
  ]

  for (const product of products) {
    await prisma.product.create({ data: product })
  }

  console.log(`Seeded ${products.length} products across 4 categories.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
