"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateSocialMediaPostOutputSchema = exports.GenerateSocialMediaPostInputSchema = void 0;
const zod_1 = require("zod");
exports.GenerateSocialMediaPostInputSchema = zod_1.z.object({
    topic: zod_1.z.string().describe('The topic for the social media posts'),
    tone: zod_1.z.string().describe('The tone of the posts (e.g., professional, casual, enthusiastic)'),
});
exports.GenerateSocialMediaPostOutputSchema = zod_1.z.object({
    linkedin: zod_1.z.string().describe('The LinkedIn post content'),
    twitter: zod_1.z.string().max(280).describe('The Twitter/X post content (max 280 characters)'),
    facebook: zod_1.z.string().describe('The Facebook post content'),
    googleBusiness: zod_1.z.string().describe('The Google Business Profile post content'),
});
