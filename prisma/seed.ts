import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@tshirt.com' },
    update: {},
    create: {
      email: 'admin@tshirt.com',
      name: 'Admin Master',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const products = [
    {
      name: 'Camiseta Minimalist Black',
      description: 'Camiseta 100% algodão premium cor preta.',
      price: 89.90,
      image: 'https://example.com/black-tshirt.jpg',
      variants: {
        create: [
          { size: 'P', stock: 10 },
          { size: 'M', stock: 15 },
          { size: 'G', stock: 20 },
          { size: 'GG', stock: 5 },
        ],
      },
    },
    {
      name: 'Camiseta Classic White',
      description: 'Camiseta básica branca essencial.',
      price: 79.90,
      image: 'https://example.com/white-tshirt.jpg',
      variants: {
        create: [
          { size: 'P', stock: 5 },
          { size: 'M', stock: 10 },
          { size: 'G', stock: 10 },
        ],
      },
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
