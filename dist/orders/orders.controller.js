"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const orders_service_1 = require("./orders.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const products_controller_1 = require("../products/products.controller");
let OrdersController = class OrdersController {
    ordersService;
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    async checkout(body) {
        return this.ordersService.createCheckout(body.items);
    }
    async webhook(body, headers, res) {
        console.log('WEBHOOK MERCADO PAGO RECEBIDO');
        console.log('Body recebido:', JSON.stringify(body, null, 2));
        console.log('Headers:', headers);
        const event = body.type || body.action || headers['x-type'];
        let paymentId = body?.data?.id || body?.id || body?.resource?.id;
        if (!paymentId && headers['x-resource-id']) {
            paymentId = headers['x-resource-id'];
        }
        if (!paymentId) {
            console.warn('Webhook sem payment ID válido');
            return res.status(common_1.HttpStatus.OK).json({ status: 'ok', message: 'No payment ID, ignored' });
        }
        try {
            await this.ordersService.handleWebhook(paymentId.toString(), headers);
            return res.status(common_1.HttpStatus.OK).json({ status: 'ok' });
        }
        catch (error) {
            console.error('Erro ao processar webhook:', error);
            return res.status(common_1.HttpStatus.OK).json({
                status: 'error',
                message: 'Internal processing error, but acknowledged'
            });
        }
    }
    async getOrders() {
        return this.ordersService.findAll();
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Post)('checkout'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "checkout", null);
__decorate([
    (0, common_1.Post)('webhook/mercadopago'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "webhook", null);
__decorate([
    (0, common_1.Get)('admin/orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, products_controller_1.Roles)('ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getOrders", null);
exports.OrdersController = OrdersController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map