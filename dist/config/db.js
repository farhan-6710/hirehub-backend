"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = exports.prisma = void 0;
require("dotenv/config");
const client_1 = __importDefault(require("@prisma/client"));
const adapter_pg_1 = require("@prisma/adapter-pg");
const { PrismaClient } = client_1.default;
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
});
exports.prisma = prisma;
const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log('db connected via prisma');
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Database connection error: ${errorMessage}`);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    await prisma.$disconnect();
};
exports.disconnectDB = disconnectDB;
