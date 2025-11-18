
export const trainingModules = [
  {
    id: 'local-seo',
    title: 'Lesson 1: Mastering Local SEO for Agents',
    content: `
      <p>Local Search Engine Optimization (SEO) is the process of optimizing your online presence to attract more business from relevant local searches. For a real estate agent, this is the single most important marketing activity to generate leads in your specific service area.</p>
      
      <h3 class="font-semibold mt-6 mb-2 text-lg">Core Components of Local SEO</h3>
      <ul class="list-disc list-inside space-y-3">
        <li>
          <strong>Google Business Profile (GBP):</strong> This is the foundation of your local SEO. A complete and active GBP listing is critical for appearing in Google Maps and the "Local Pack" search results.
        </li>
        <li>
          <strong>NAP Consistency:</strong> Your business <strong>N</strong>ame, <strong>A</strong>ddress, and <strong>P</strong>hone number must be identical across every online platform. Inconsistencies confuse search engines and hurt your ranking.
        </li>
        <li>
          <strong>Client Reviews:</strong> A steady stream of positive reviews is a powerful signal to Google that your business is active, trusted, and provides value.
        </li>
        <li>
          <strong>On-Page SEO Signals:</strong> This involves optimizing your own website with local keywords. This includes creating content about the neighborhoods you serve.
        </li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Claim and fully complete your Google Business Profile. <a href="/integrations" class="text-primary hover:underline font-semibold">Connect it now</a>.</li>
        <li>Use the <a href="/brand-audit" class="text-primary hover:underline font-semibold">Brand Audit tool</a> to find and fix NAP inconsistencies.</li>
        <li>Develop a process to consistently ask satisfied clients for reviews on Google.</li>
        <li>Create hyper-local content on your website using the <a href="/content-engine" class="text-primary hover:underline font-semibold">Co-Marketing Studio</a>.</li>
      </ul>
    `,
    quiz: [
        {
            question: "What does 'NAP' stand for in the context of local SEO?",
            options: ["Name, Area, Profile", "Name, Address, Phone", "New Agent Program", "National Association Profile"],
            correctAnswer: "Name, Address, Phone"
        },
        {
            question: "What is the most important platform for a real estate agent's local SEO?",
            options: ["Facebook", "Zillow", "Google Business Profile", "LinkedIn"],
            correctAnswer: "Google Business Profile"
        }
    ]
  },
  {
    id: 'social-media',
    title: 'Lesson 2: Building an Authoritative Social Media Brand',
    content: `
      <p>Social media for real estate is about building community and demonstrating expertise, not just broadcasting listings. The goal is to become the go-to resource for real estate information in your area.</p>
      
      <h3 class="font-semibold mt-6 mb-2 text-lg">Platform-Specific Strategies</h3>
      <ul class="list-disc list-inside space-y-3">
        <li>
          <strong>Facebook:</strong> Focus on community. Share client success stories (with permission), highlight local businesses, and post about community events. This builds trust and shows you're invested in the area.
        </li>
        <li>
          <strong>Instagram:</strong> This is your visual portfolio. Use high-quality photos and videos (Reels) for property tours, behind-the-scenes looks at your day, and quick-tip graphics about the market.
        </li>
        <li>
          <strong>LinkedIn:</strong> Position yourself as the market expert. Share insightful analysis from the <a href="/content-engine?tab=market-update" class="text-primary hover:underline font-semibold">Market Update Generator</a>, connect with lenders and builders, and write articles on industry trends.
        </li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Don't try to be on every platform. Master one or two where your target clients are active.</li>
        <li>Follow the 80/20 rule: 80% of your content should be valuable and informative, 20% can be promotional (like listings).</li>
        <li>Use the <a href="/content-engine?tab=social" class="text-primary hover:underline font-semibold">Social Media Post Generator</a> to create platform-specific content from a single idea.</li>
      </ul>
    `,
     quiz: [
        {
            question: "What is the 80/20 rule in social media content?",
            options: ["80% listings, 20% value", "80% personal, 20% business", "80% value/information, 20% promotion", "80% video, 20% images"],
            correctAnswer: "80% value/information, 20% promotion"
        },
        {
            question: "Which platform is best for positioning yourself as a B2B market expert?",
            options: ["Instagram", "LinkedIn", "Facebook", "TikTok"],
            correctAnswer: "LinkedIn"
        }
    ]
  },
  {
    id: 'content-marketing',
    title: 'Lesson 3: High-Impact Content Marketing',
    content: `
      <p>Content marketing is the art of creating valuable content that attracts, engages, and retains a clearly defined audience — and, ultimately, drives profitable customer action. For agents, it establishes you as a trustworthy authority.</p>
      
      <h3 class="font-semibold mt-6 mb-2 text-lg">The Pillar Page Strategy</h3>
       <p>Instead of scattered blog posts, focus on creating "Pillar Pages" — comprehensive guides on a broad topic. Then, create smaller pieces of content (blog posts, social posts, videos) that link back to that main page. This is excellent for SEO.</p>
      <ul class="list-disc list-inside space-y-3 mt-2">
        <li><strong>Pillar Page Example:</strong> "The Ultimate Guide to Moving to Austin, TX". This can be created with the <a href="/content-engine?tab=guide" class="text-primary hover:underline font-semibold">Neighborhood Guide generator</a>.</li>
        <li><strong>Supporting Content:</strong> Blog posts like "Top 5 Family-Friendly Neighborhoods in Austin" or videos on "Understanding Austin's Property Taxes".</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Think "topics" not just "keywords". What broad areas of expertise can you own?</li>
        <li>Answer the questions your clients are already asking.</li>
        <li>Use the <a href="/content-engine" class="text-primary hover:underline font-semibold">Co-Marketing Studio</a> to generate pillar pages, blog posts, and video scripts efficiently.</li>
        <li>Save your best research in the <a href="/research-agent" class="text-primary hover:underline font-semibold">Knowledge Base</a> to reference for future content.</li>
      </ul>
    `,
     quiz: [
        {
            question: "What is a 'Pillar Page' in content marketing?",
            options: ["Your website's home page", "A page with agent testimonials", "A long, comprehensive guide on a single topic", "A short blog post with lots of keywords"],
            correctAnswer: "A long, comprehensive guide on a single topic"
        }
    ]
  },
  {
    id: 'reviews',
    title: 'Lesson 4: Building Authority with Client Reviews',
    content: `
      <p>Online reviews are the modern-day word-of-mouth. A proactive review management strategy builds social proof, which is a powerful psychological trigger that makes potential clients trust you before they even contact you.</p>

      <h3 class="font-semibold mt-6 mb-2 text-lg">An Effective Review Strategy</h3>
      <ul class="list-disc list-inside space-y-3">
        <li><strong>Automate the "Ask":</strong> At the successful close of a transaction, have a system (even a simple email template) to ask your happy client for a review. Provide a direct link to your Google Business Profile review form.</li>
        <li><strong>Respond to All Reviews:</strong> Thank every positive reviewer personally. For negative reviews, respond professionally, acknowledge their concern (without admitting fault), and offer to resolve the issue offline. This shows you are responsive and care.</li>
        <li><strong>Leverage Reviews for Schema:</strong> The <a href="/brand-audit" class="text-primary hover:underline font-semibold">Brand Audit</a> page automatically generates 'Review' schema markup for every review it finds. Adding this structured data to your website can help Google show star ratings directly in search results for your name.</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>The best time to ask for a review is right after a successful closing.</li>
        <li>Responding to all reviews shows you're engaged and professional.</li>
        <li>Use the schema generated in the <a href="/brand-audit" class="text-primary hover:underline font-semibold">Brand Audit</a> to enhance your website's SEO.</li>
      </ul>
    `,
     quiz: [
        {
            question: "When is the best time to ask a client for a review?",
            options: ["During the initial consultation", "Right after a successful closing", "Six months after closing", "Never, it's unprofessional"],
            correctAnswer: "Right after a successful closing"
        },
        {
            question: "How should you handle a negative online review?",
            options: ["Ignore it", "Delete it immediately", "Respond professionally and offer to take the conversation offline", "Argue with the reviewer publicly"],
            correctAnswer: "Respond professionally and offer to take the conversation offline"
        }
    ]
  },
  {
    id: 'ai-workflow',
    title: 'Lesson 5: Supercharging Your Workflow with AI',
    content: `
      <p>Artificial Intelligence (AI) is your new marketing assistant. It's designed to automate repetitive tasks, break through writer's block, and serve as a starting point for high-quality, personalized content.</p>

      <h3 class="font-semibold mt-6 mb-2 text-lg">The "AI as a First Draft" Mentality</h3>
      <p>The most effective way to use AI is to treat its output as a well-researched first draft. It provides the structure, key points, and initial copy, which you can then infuse with your unique voice, local expertise, and personal anecdotes. This combination of AI efficiency and human touch is unbeatable.</p>
      
      <h3 class="font-semibold mt-6 mb-2 text-lg">Practical AI Workflows</h3>
      <ul class="list-disc list-inside space-y-3">
        <li>
          <strong>The Listing Optimizer:</strong> Have a new listing? Don't start from scratch. Use the <a href="/content-engine?tab=listing" class="text-primary hover:underline font-semibold">Listing Optimizer</a> to generate a compelling, persona-driven description and an FAQ section in seconds. Then, spend a few minutes editing it to match your style.
        </li>
        <li>
          <strong>The One-to-Many Content Machine:</strong> Start with a single idea (e.g., "The benefits of assumable mortgages"). Use the <a href="/content-engine" class="text-primary hover:underline font-semibold">Co-Marketing Studio</a> to turn that idea into a blog post, a social media campaign, and a video script. You create a week's worth of content in minutes.
        </li>
        <li>
          <strong>The Research Assistant:</strong> Need to become an expert on a new subdivision or a complex zoning law? Delegate the initial research to the <a href="/research-agent" class="text-primary hover:underline font-semibold">AI Research Agent</a>. It will give you a comprehensive report with sources, saving you hours of searching.
        </li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Let AI handle the initial 80% of content creation, so you can focus on the final 20% of personalization.</li>
        <li>Always review and edit AI-generated content to ensure it's accurate and reflects your brand.</li>
        <li>Use AI to consistently produce content across multiple channels, which is key to building online authority.</li>
      </ul>
    `,
     quiz: [
        {
            question: "What is the most effective way to use AI-generated content?",
            options: ["Copy and paste it directly without changes", "As a final, polished piece of content", "As a well-researched first draft to be edited and personalized", "Only for brainstorming ideas"],
            correctAnswer: "As a well-researched first draft to be edited and personalized"
        }
    ]
  },
  {
    id: 'competitive-analysis',
    title: 'Lesson 6: Actionable Insights from Competitive Analysis',
    content: `
      <p>You don't operate in a vacuum. Understanding your competitors' strengths and weaknesses is fundamental to carving out your unique space in the market and winning more clients.</p>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Why Competitive Analysis Matters</h3>
      <ul class="list-disc list-inside space-y-3">
        <li>
          <strong>Identify Opportunities:</strong> If your top competitor has very few social media followers, it's a huge opportunity for you to dominate social channels. If they rank #1 for a keyword, you know what to target.
        </li>
        <li>
          <strong>Benchmark Your Performance:</strong> Are you lagging behind in review volume? Is your website's domain authority lower? Benchmarking helps you set realistic goals for your marketing efforts.
        </li>
        <li>
          <strong>Understand Your Market:</strong> Knowing who the top players are helps you understand the dominant marketing strategies in your area and how you can differentiate yourself.
        </li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Using the Tools</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Use the <a href="/competitive-analysis" class="text-primary hover:underline font-semibold">AI Competitor Discovery tool</a> to automatically find top agents in your area. Add them to your tracker.</li>
        <li>Regularly use the <a href="/competitive-analysis" class="text-primary hover:underline font-semibold">Local Keyword Rankings tool</a>. Track your position for terms like "best real estate agent in [Your City]" or "homes for sale in [Your Neighborhood]".</li>
        <li>Pay attention to the metrics in the Market Snapshot. A competitor with high "Domain Authority" has a powerful website, meaning you should focus on creating better blog content. A competitor with high "Review Volume" has great social proof, so you should focus on your review generation strategy.</li>
      </ul>
    `,
     quiz: [
        {
            question: "What does a high 'Domain Authority' score for a competitor suggest?",
            options: ["They are very active on social media", "They have a strong, SEO-friendly website", "They have many positive reviews", "They are a new agent"],
            correctAnswer: "They have a strong, SEO-friendly website"
        },
        {
            question: "What is the primary benefit of tracking local keyword rankings?",
            options: ["To see how many followers you have", "To understand your visibility on Google for important search terms", "To count how many listings you have", "To check your email"],
            correctAnswer: "To understand your visibility on Google for important search terms"
        }
    ]
  }
];
