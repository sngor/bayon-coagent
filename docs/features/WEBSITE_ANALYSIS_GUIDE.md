# Website AI Optimization Analysis Guide

## Overview

The Website AI Optimization Analysis feature helps real estate agents ensure their websites are optimized for AI-powered search engines like ChatGPT, Perplexity, Claude, and Gemini. This guide explains what we check, why it matters, and how to improve your score.

## What is AEO (AI Engine Optimization)?

AI Engine Optimization (AEO) is the practice of optimizing web content to be easily discovered, understood, and recommended by AI-powered search engines and assistants. Unlike traditional SEO which focuses on ranking in search results, AEO ensures AI systems can:

- **Discover** your website and understand what you do
- **Extract** accurate information about your business
- **Recommend** your services when users ask relevant questions

## What We Analyze

### 1. Schema Markup (30% of Score)

**What it is:** Structured data that helps AI understand your business information.

**What we check:**

- Presence of schema.org markup (JSON-LD, Microdata)
- Recommended schema types for real estate agents:
  - `Person` or `RealEstateAgent`
  - `LocalBusiness`
  - `Organization`
- Key properties: name, address, telephone, email, image, url

**Why it matters:** AI systems rely heavily on structured data to understand and extract information. Without proper schema markup, AI may miss or misinterpret your business details.

**How to improve:**

- Add JSON-LD schema markup to your website
- Include all recommended schema types
- Ensure all properties are accurate and complete
- Validate your schema using Google's Rich Results Test

### 2. Meta Tags (25% of Score)

**What it is:** HTML elements that provide metadata about your webpage.

**What we check:**

- **Title Tag:** Should be 30-60 characters
- **Meta Description:** Should be 120-160 characters
- **Open Graph Tags:** For social media sharing
- **Twitter Card Tags:** For Twitter sharing

**Why it matters:** Meta tags are often the first thing AI systems read to understand your page content. Well-crafted meta tags improve how AI interprets and presents your information.

**How to improve:**

- Write clear, descriptive title tags with your name and location
- Create compelling meta descriptions that include your specialties
- Add Open Graph and Twitter Card tags for better social sharing
- Include relevant keywords naturally

### 3. Structured Data Quality (25% of Score)

**What it is:** Overall quality and completeness of structured information on your site.

**What we check:**

- Consistency of structured data across pages
- Completeness of business information
- Proper formatting and validation
- Multiple structured data formats (JSON-LD, Microdata, RDFa)

**Why it matters:** High-quality structured data makes it easier for AI to confidently extract and use your information.

**How to improve:**

- Use multiple structured data formats when possible
- Ensure consistency across all pages
- Include rich information (images, reviews, services)
- Keep data up-to-date

### 4. NAP Consistency (20% of Score)

**What it is:** Consistency of your Name, Address, and Phone number across your website and profile.

**What we check:**

- Name matches your profile
- Address matches your profile
- Phone number matches your profile
- Consistency across multiple pages

**Why it matters:** Inconsistent NAP information confuses AI systems and reduces trust. Consistent NAP data improves local search visibility and AI recommendations.

**How to improve:**

- Use the exact same format for NAP across all pages
- Match your NAP with your Brand Profile in Bayon Coagent
- Include NAP in your footer on every page
- Use schema markup for NAP data

## Understanding Your Score

### Score Ranges

- **71-100 (Green - Excellent):** Your website is well-optimized for AI discovery. AI systems can easily find, understand, and recommend your services.

- **41-70 (Yellow - Good):** Your website has basic optimization but could be improved. Some AI systems may have difficulty extracting complete information.

- **0-40 (Red - Needs Improvement):** Your website needs significant optimization work. AI systems may struggle to discover or understand your business.

### Score Breakdown

Your overall score is calculated using weighted components:

- Schema Markup: 30%
- Meta Tags: 25%
- Structured Data: 25%
- NAP Consistency: 20%

## How to Use This Feature

### First-Time Setup

1. **Complete Your Profile**

   - Go to Brand → Profile
   - Fill in your name, address, phone, and website URL
   - Ensure all information is accurate

2. **Run Your First Analysis**

   - Go to Brand → Audit
   - Click "Analyze Website"
   - Wait 30 seconds for results

3. **Review Recommendations**

   - Check your overall score
   - Review findings by category
   - Read prioritized recommendations

4. **Implement Changes**

   - Start with high-priority recommendations
   - Use provided code snippets for schema markup
   - Update your website accordingly

5. **Track Progress**
   - Re-run analysis after making changes
   - Compare scores over time
   - Monitor trend chart

### Best Practices

1. **Run Analysis Regularly**

   - After major website updates
   - Monthly to track progress
   - Before marketing campaigns

2. **Prioritize High-Impact Items**

   - Focus on high-priority recommendations first
   - Schema markup typically has the biggest impact
   - NAP consistency is quick to fix

3. **Use Code Snippets**

   - Copy provided schema markup examples
   - Customize with your specific information
   - Test using validation tools

4. **Monitor Trends**
   - Track your score over time
   - Celebrate improvements
   - Identify areas that need attention

## Common Issues and Solutions

### Issue: Low Schema Markup Score

**Solution:**

- Add JSON-LD schema to your homepage
- Include Person/RealEstateAgent schema
- Add LocalBusiness schema with complete details
- Validate using Google's Rich Results Test

### Issue: Meta Tags Too Short/Long

**Solution:**

- Title: Aim for 50-60 characters
- Description: Aim for 150-160 characters
- Include location and specialty
- Make them compelling and descriptive

### Issue: NAP Inconsistencies

**Solution:**

- Use exact same format everywhere
- Update footer on all pages
- Match your Brand Profile exactly
- Use schema markup for NAP

### Issue: Website Unreachable

**Solution:**

- Check URL spelling in your profile
- Ensure website is online and accessible
- Check for SSL certificate issues
- Verify no robots.txt blocking

## Example Schema Markup

### Real Estate Agent Schema

```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "Jane Smith",
  "image": "https://yourwebsite.com/photo.jpg",
  "telephone": "+1-555-123-4567",
  "email": "jane@example.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main Street",
    "addressLocality": "San Francisco",
    "addressRegion": "CA",
    "postalCode": "94102",
    "addressCountry": "US"
  },
  "url": "https://yourwebsite.com",
  "sameAs": [
    "https://www.facebook.com/janesmith",
    "https://www.linkedin.com/in/janesmith",
    "https://twitter.com/janesmith"
  ],
  "knowsAbout": [
    "Residential Real Estate",
    "Luxury Homes",
    "First-Time Buyers"
  ],
  "areaServed": {
    "@type": "City",
    "name": "San Francisco"
  }
}
```

### Local Business Schema

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Jane Smith Real Estate",
  "image": "https://yourwebsite.com/logo.jpg",
  "telephone": "+1-555-123-4567",
  "email": "jane@example.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main Street",
    "addressLocality": "San Francisco",
    "addressRegion": "CA",
    "postalCode": "94102",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "37.7749",
    "longitude": "-122.4194"
  },
  "url": "https://yourwebsite.com",
  "priceRange": "$$",
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "opens": "09:00",
    "closes": "17:00"
  }
}
```

## Frequently Asked Questions

### How long does analysis take?

Analysis typically takes 30 seconds for websites with fewer than 50 pages. We crawl your homepage and up to 10 additional pages.

### How often should I run analysis?

Run analysis after major website updates, monthly to track progress, or before marketing campaigns.

### Can I analyze a website I don't own?

No, you can only analyze the website URL in your Brand Profile. This ensures accurate NAP comparison.

### What if my website is unreachable?

Check that your URL is correct, your website is online, and there are no access restrictions (robots.txt, password protection).

### Do I need technical skills to implement recommendations?

Basic HTML knowledge helps, but we provide code snippets you can copy and paste. Consider working with your web developer for complex changes.

### Will this improve my Google ranking?

While AEO focuses on AI discovery, many optimizations (schema markup, meta tags) also benefit traditional SEO and can improve Google rankings.

## Additional Resources

- [Schema.org Documentation](https://schema.org/)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)

## Need Help?

If you have questions or need assistance:

- Visit the Training Hub for video tutorials
- Contact support through the chat assistant
- Join our community forum for tips and best practices

---

_Last updated: December 2024_
