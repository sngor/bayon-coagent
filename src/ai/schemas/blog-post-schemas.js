"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateBlogPostOutputSchema = exports.GenerateBlogPostInputSchema = void 0;
const zod_1 = require("zod");
exports.GenerateBlogPostInputSchema = zod_1.z.object({
    topic: zod_1.z.string().describe('The topic for the blog post'),
});
exports.GenerateBlogPostOutputSchema = zod_1.z.object({
    blogPost: zod_1.z.string().describe('The generated blog post in Markdown format'),
    headerImage: zod_1.z.string().describe('URL for the header image'),
});
