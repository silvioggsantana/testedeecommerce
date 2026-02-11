"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { rawBody: true });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.enableCors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' });
    app.use((0, helmet_1.default)());
    app.use((0, compression_1.default)());
    await app.listen(process.env.PORT || 3000);
    console.log(`App rodando em ${process.env.NODE_ENV} na porta ${process.env.PORT}`);
}
bootstrap();
//# sourceMappingURL=main.js.map