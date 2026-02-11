import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: { variants: true },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async create(data: any) {
    const { variants, ...productData } = data;
    return this.prisma.product.create({
      data: {
        ...productData,
        variants: {
          create: variants,
        },
      },
      include: { variants: true },
    });
  }

  async update(id: string, data: any) {
    const { variants, ...productData } = data;
    
    if (variants) {
      // Simplificado: deleta e recria variações ou atualiza uma a uma
      await this.prisma.productVariant.deleteMany({ where: { productId: id } });
      return this.prisma.product.update({
        where: { id },
        data: {
          ...productData,
          variants: {
            create: variants,
          },
        },
        include: { variants: true },
      });
    }

    return this.prisma.product.update({
      where: { id },
      data: productData,
      include: { variants: true },
    });
  }

  async remove(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }
}
