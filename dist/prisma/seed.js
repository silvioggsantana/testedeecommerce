"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
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
//# sourceMappingURL=seed.js.map