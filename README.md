# T-Shirt E-commerce Backend

Backend completo para uma plataforma de venda de camisetas, desenvolvido com NestJS, Prisma e SQLite.

## Stack
- **Node.js** (v22)
- **NestJS** (Arquitetura modular)
- **Prisma ORM**
- **SQLite** (Banco de dados local para facilidade de teste)
- **JWT** (Autenticação)
- **Stripe** (Integração de pagamentos)

## Estrutura do Projeto
- `src/auth`: Autenticação JWT e Roles (Admin)
- `src/products`: Gestão de produtos e variações (tamanhos/estoque)
- `src/orders`: Sistema de pedidos, checkout Stripe e webhooks
- `src/prisma`: Integração com o banco de dados
- `src/stripe`: Serviço de comunicação com o Stripe

## Como Rodar
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure o arquivo `.env` (use o `.env.example` como base).
3. Rode as migrações do banco:
   ```bash
   npx prisma migrate dev
   ```
4. Popule o banco com dados iniciais (Admin e Produtos):
   ```bash
   npx prisma db seed
   ```
5. Inicie a aplicação:
   ```bash
   npm run start:dev
   ```

## Credenciais do Admin (Seed)
- **Email:** admin@tshirt.com
- **Senha:** admin123

## Endpoints Principais

### Loja (Público)
- `GET /products`: Lista todos os produtos ativos.
- `GET /products/:id`: Detalhes de um produto.
- `POST /checkout`: Cria uma sessão de pagamento no Stripe.
  - Body: `{ "items": [{ "productId": "id", "size": "M", "quantity": 1 }] }`

### Admin (Protegido por JWT e Role ADMIN)
- `POST /admin/login`: Autenticação do admin.
- `GET /admin/orders`: Lista todos os pedidos e status.
- `POST /admin/products`: Cria novo produto.
- `PUT /admin/products/:id`: Atualiza produto/estoque.

### Webhook
- `POST /webhook`: Recebe notificações do Stripe (Pagamento Aprovado/Falho).

## Fluxo de Pagamento
1. Usuário envia o carrinho para `/checkout`.
2. O sistema valida o estoque e cria um pedido `PENDING`.
3. O sistema retorna uma `checkoutUrl` do Stripe.
4. Após o pagamento, o Stripe chama o `/webhook`.
5. O sistema atualiza o pedido para `PAID` e debita o estoque.

