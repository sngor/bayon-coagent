"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateMarketUpdateOutputSchema = exports.GenerateMarketUpdateInputSchema = void 0;
const zod_1 = require("zod");
exports.GenerateMarketUpdateInputSchema = zod_1.z.object({
    location: zod_1.z.string().describe('The location for the market update'),
    timePeriod: zod_1.z.string().describe('The time period (e.g., "Q1 2024", "January 2024")'),
    audience: zod_1.z.string().describe('The target audience (e.g., "first-time buyers", "investors")'),
});
exports.GenerateMarketUpdateOutputSchema = zod_1.z.object({
    marketUpdate: zod_1.z.string().describe('The generated market update in Markdown format'),
});
