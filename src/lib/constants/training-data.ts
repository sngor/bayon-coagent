// Training data for real estate agent education modules

export const marketingModules = [
  {
    id: 'listing-presentation-mastery',
    title: 'Lesson 1: Listing Presentation Mastery',
    category: 'marketing',
    content: `
      <p>The listing presentation is your opportunity to demonstrate expertise and win the seller's trust. According to NAR's Profile of Home Sellers, <strong>89% of sellers use a real estate agent</strong>, and the agent they choose is often determined by the quality of the listing presentation.</p>
      
      <h3 class="font-semibold mt-6 mb-2 text-lg">Essential Components of a Winning Listing Presentation</h3>
      <ol class="list-decimal list-inside space-y-3 ml-4">
        <li><strong>Market Analysis:</strong> Comprehensive CMA with 6-12 comparable sales, active listings, and expired/withdrawn properties</li>
        <li><strong>Marketing Plan:</strong> Detailed strategy including professional photography, online marketing, open houses, and agent networking</li>
        <li><strong>Pricing Strategy:</strong> Data-driven pricing recommendation with market positioning rationale</li>
        <li><strong>Timeline & Process:</strong> Clear explanation of listing process, typical timeline, and seller responsibilities</li>
        <li><strong>Agent Credentials:</strong> Your experience, designations, recent sales, and client testimonials</li>
        <li><strong>Commission Structure:</strong> Transparent explanation of services provided and commission breakdown</li>
      </ol>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Presentation Best Practices</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Prepare thoroughly:</strong> Research the property, neighborhood, and sellers' situation beforehand</li>
        <li><strong>Use visual aids:</strong> Professional presentation materials, market charts, and property photos</li>
        <li><strong>Listen actively:</strong> Understand the sellers' motivations, timeline, and concerns</li>
        <li><strong>Address objections:</strong> Be prepared to discuss common concerns about pricing, marketing time, and commission</li>
        <li><strong>Close confidently:</strong> Ask for the listing and be prepared to sign agreements on the spot</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Develop a standardized presentation format that can be customized for each property</li>
        <li>Create a professional presentation binder or digital presentation</li>
        <li>Practice your presentation until it flows naturally</li>
        <li>Prepare responses to common objections about price, commission, and marketing strategy</li>
        <li>Follow up within 24 hours with additional information and next steps</li>
      </ul>
    `,
    quiz: [
      {
        question: "According to NAR, what percentage of sellers use a real estate agent?",
        options: ["76%", "82%", "89%", "94%"],
        correctAnswer: "89%"
      },
      {
        question: "How many comparable sales should typically be included in a CMA?",
        options: ["3-5", "6-12", "10-15", "15-20"],
        correctAnswer: "6-12"
      }
    ]
  },
  {
    id: 'buyer-representation-fundamentals',
    title: 'Lesson 2: Buyer Representation Fundamentals',
    category: 'marketing',
    content: `
      <p>Effective buyer representation requires understanding client needs, market conditions, and the purchase process. According to NAR's Home Buyers and Sellers Generational Trends, <strong>87% of buyers purchase through a real estate agent</strong>, making buyer representation a critical skill.</p>
      
      <h3 class="font-semibold mt-6 mb-2 text-lg">The Buyer Consultation Process</h3>
      <ol class="list-decimal list-inside space-y-3 ml-4">
        <li><strong>Needs Assessment:</strong> Determine budget, preferred locations, must-have features, and timeline</li>
        <li><strong>Financial Pre-qualification:</strong> Ensure buyers are pre-approved and understand their purchasing power</li>
        <li><strong>Market Education:</strong> Explain current market conditions, pricing trends, and competition levels</li>
        <li><strong>Search Parameters:</strong> Set realistic expectations based on budget and market conditions</li>
        <li><strong>Showing Strategy:</strong> Plan efficient showing routes and prepare buyers for decision-making</li>
      </ol>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Buyer Agency Agreements</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Exclusive Right to Represent:</strong> Most common form providing exclusive representation</li>
        <li><strong>Duration and Terms:</strong> Typically 3-6 months with clear termination conditions</li>
        <li><strong>Compensation Structure:</strong> Commission rates and payment responsibilities</li>
        <li><strong>Duties and Obligations:</strong> Fiduciary responsibilities and service expectations</li>
        <li><strong>Property Types:</strong> Specify residential, commercial, or investment properties</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Managing Buyer Expectations</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Market Reality:</strong> Help buyers understand what their budget can realistically purchase</li>
        <li><strong>Competition:</strong> Prepare buyers for multiple offer situations and bidding strategies</li>
        <li><strong>Timeline:</strong> Set realistic expectations for search duration and closing timeline</li>
        <li><strong>Compromise:</strong> Help prioritize must-haves versus nice-to-haves</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Always use written buyer representation agreements</li>
        <li>Conduct thorough needs assessments before showing properties</li>
        <li>Educate buyers about market conditions and realistic expectations</li>
        <li>Maintain regular communication throughout the search process</li>
        <li>Prepare buyers for competitive situations and quick decision-making</li>
      </ul>
    `,
    quiz: [
      {
        question: "According to NAR, what percentage of buyers purchase through a real estate agent?",
        options: ["78%", "82%", "87%", "91%"],
        correctAnswer: "87%"
      },
      {
        question: "What is the typical duration for a buyer representation agreement?",
        options: ["1-2 months", "3-6 months", "6-12 months", "12+ months"],
        correctAnswer: "3-6 months"
      }
    ]
  },
  {
    id: 'property-marketing-strategies',
    title: 'Lesson 3: Property Marketing Strategies',
    category: 'marketing',
    content: `
      <p>Effective property marketing is essential for attracting qualified buyers and achieving optimal sale prices. According to NAR's Profile of Home Sellers, <strong>properties with professional photography sell 32% faster</strong> than those without.</p>
      
      <h3 class="font-semibold mt-6 mb-2 text-lg">Professional Photography and Staging</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Professional Photography:</strong> High-quality images are essential - 92% of buyers search online first</li>
        <li><strong>Virtual Tours:</strong> 360-degree tours and video walkthroughs increase engagement by 40%</li>
        <li><strong>Drone Photography:</strong> Aerial shots showcase property boundaries and neighborhood context</li>
        <li><strong>Home Staging:</strong> Staged homes sell 73% faster and for 5-15% more than unstaged homes</li>
        <li><strong>Twilight Photography:</strong> Evening shots create emotional appeal and highlight exterior lighting</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Online Marketing Channels</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>MLS Syndication:</strong> Ensure listing appears on major real estate websites (Zillow, Realtor.com, etc.)</li>
        <li><strong>Social Media Marketing:</strong> Facebook, Instagram, and LinkedIn targeted advertising</li>
        <li><strong>Agent Website:</strong> Feature listings prominently with SEO optimization</li>
        <li><strong>Email Marketing:</strong> Send to agent network and past client database</li>
        <li><strong>Video Marketing:</strong> Property tour videos and neighborhood highlights</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Traditional Marketing Methods</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Open Houses:</strong> Still effective for generating buyer interest and agent leads</li>
        <li><strong>Broker Tours:</strong> Agent-only showings to generate referrals from other agents</li>
        <li><strong>Print Advertising:</strong> Local newspapers and real estate magazines for luxury properties</li>
        <li><strong>Signage:</strong> Professional yard signs with rider signs for features and open houses</li>
        <li><strong>Direct Mail:</strong> Targeted mailings to specific neighborhoods or demographics</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Invest in professional photography for every listing - it's non-negotiable</li>
        <li>Create a comprehensive marketing plan for each property</li>
        <li>Use multiple marketing channels to maximize exposure</li>
        <li>Track which marketing methods generate the most qualified leads</li>
        <li>Adjust marketing strategy based on market feedback and showing activity</li>
      </ul>
    `,
    quiz: [
      {
        question: "According to NAR, how much faster do properties with professional photography sell?",
        options: ["18%", "25%", "32%", "41%"],
        correctAnswer: "32%"
      },
      {
        question: "What percentage of buyers search online first?",
        options: ["85%", "88%", "92%", "96%"],
        correctAnswer: "92%"
      }
    ]
  },
  {
    id: 'lead-generation-conversion',
    title: 'Lesson 4: Lead Generation and Conversion',
    category: 'marketing',
    content: `
      <p>Consistent lead generation is the lifeblood of a successful real estate business. According to NAR, <strong>top-producing agents generate 4-6 new leads per week</strong> and convert 15-20% of leads into clients.</p>
      
      <h3 class="font-semibold mt-6 mb-2 text-lg">Lead Generation Sources</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Sphere of Influence:</strong> Past clients, friends, family - highest conversion rate at 25-30%</li>
        <li><strong>Referrals:</strong> From past clients and other professionals - 20-25% conversion rate</li>
        <li><strong>Online Leads:</strong> Website inquiries, social media, Zillow - 2-5% conversion rate</li>
        <li><strong>Open Houses:</strong> Both listing and buyer leads - 5-10% conversion rate</li>
        <li><strong>Geographic Farming:</strong> Targeted neighborhood marketing - 8-12% conversion rate</li>
        <li><strong>For Sale By Owner (FSBO):</strong> Expired listings and FSBOs - 10-15% conversion rate</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Lead Conversion Process</h3>
      <ol class="list-decimal list-inside space-y-2 ml-4">
        <li><strong>Immediate Response:</strong> Contact leads within 5 minutes for 9x higher conversion</li>
        <li><strong>Qualification:</strong> Determine timeline, motivation, and financial capacity</li>
        <li><strong>Value Demonstration:</strong> Provide market insights and professional expertise</li>
        <li><strong>Relationship Building:</strong> Focus on trust and rapport before pushing for meetings</li>
        <li><strong>Follow-up System:</strong> Consistent contact until ready to buy/sell or definitively not interested</li>
      </ol>

      <h3 class="font-semibold mt-6 mb-2 text-lg">CRM and Lead Management</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Lead Tracking:</strong> Record all interactions, preferences, and timeline information</li>
        <li><strong>Automated Follow-up:</strong> Email drip campaigns and scheduled phone calls</li>
        <li><strong>Lead Scoring:</strong> Prioritize leads based on readiness and qualification</li>
        <li><strong>Pipeline Management:</strong> Track leads through stages from initial contact to closing</li>
        <li><strong>ROI Analysis:</strong> Measure cost per lead and conversion rates by source</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Develop multiple lead generation sources to reduce dependency on any single channel</li>
        <li>Respond to leads immediately - speed is critical for conversion</li>
        <li>Implement a systematic follow-up process using CRM technology</li>
        <li>Focus on building relationships rather than pushing for immediate sales</li>
        <li>Track and analyze lead sources to optimize marketing spend</li>
      </ul>
    `,
    quiz: [
      {
        question: "What is the typical conversion rate for sphere of influence leads?",
        options: ["10-15%", "15-20%", "20-25%", "25-30%"],
        correctAnswer: "25-30%"
      },
      {
        question: "How much higher is conversion when leads are contacted within 5 minutes?",
        options: ["3x", "5x", "7x", "9x"],
        correctAnswer: "9x"
      }
    ]
  },
  {
    id: 'prospecting-cold-calling',
    title: 'Lesson 5: Prospecting and Cold Calling Techniques',
    category: 'marketing',
    content: `
      <p>Prospecting remains one of the most effective ways to generate business in real estate. According to industry studies, <strong>agents who prospect consistently earn 42% more than those who don't</strong>, and cold calling still converts at 2-3% when done professionally.</p>
      
      <h3 class="font-semibold mt-6 mb-2 text-lg">Prospecting Target Markets</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>For Sale By Owner (FSBO):</strong> Homeowners attempting to sell without an agent</li>
        <li><strong>Expired Listings:</strong> Properties that failed to sell during listing period</li>
        <li><strong>Withdrawn Listings:</strong> Properties removed from market before selling</li>
        <li><strong>Geographic Farming:</strong> Specific neighborhoods or subdivisions</li>
        <li><strong>Just Listed/Just Sold:</strong> Neighbors of recent real estate activity</li>
        <li><strong>Absentee Owners:</strong> Investment property owners who may want to sell</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Cold Calling Best Practices</h3>
      <ol class="list-decimal list-inside space-y-2 ml-4">
        <li><strong>Research First:</strong> Know property details, market conditions, and owner situation</li>
        <li><strong>Script Preparation:</strong> Have talking points but sound conversational, not robotic</li>
        <li><strong>Value Proposition:</strong> Lead with what you can do for them, not what you want</li>
        <li><strong>Handle Objections:</strong> Be prepared for common responses and have professional replies</li>
        <li><strong>Follow-up System:</strong> Track contacts and schedule systematic follow-ups</li>
      </ol>

      <h3 class="font-semibold mt-6 mb-2 text-lg">FSBO Approach Strategy</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Offer Assistance:</strong> "I noticed your home for sale. How's it going so far?"</li>
        <li><strong>Provide Market Data:</strong> Share comparable sales and current market conditions</li>
        <li><strong>Buyer Representation:</strong> Offer to bring qualified buyers to their property</li>
        <li><strong>Professional Services:</strong> Explain marketing, negotiation, and transaction management value</li>
        <li><strong>Build Relationship:</strong> Focus on helping, not immediately getting the listing</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Set daily prospecting goals and track your activity metrics</li>
        <li>Develop scripts for different scenarios but practice until they sound natural</li>
        <li>Focus on providing value and building relationships, not just getting listings</li>
        <li>Use CRM to track all contacts and schedule systematic follow-ups</li>
        <li>Combine prospecting with other lead generation methods for best results</li>
      </ul>
    `,
    quiz: [
      {
        question: "How much more do agents who prospect consistently earn?",
        options: ["25%", "32%", "42%", "58%"],
        correctAnswer: "42%"
      },
      {
        question: "What is the typical conversion rate for professional cold calling?",
        options: ["1-2%", "2-3%", "3-4%", "4-5%"],
        correctAnswer: "2-3%"
      }
    ]
  },
  {
    id: 'referral-networking-systems',
    title: 'Lesson 6: Referral and Networking Systems',
    category: 'marketing',
    content: `
      <p>Referrals are the highest-quality leads in real estate. According to NAR, <strong>referrals account for 39% of all real estate business</strong>, and referred clients are 4x more likely to close than other lead sources.</p>
      
      <h3 class="font-semibold mt-6 mb-2 text-lg">Building Your Referral Network</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Past Clients:</strong> Your most valuable referral source - stay in regular contact</li>
        <li><strong>Professional Network:</strong> Lenders, inspectors, contractors, attorneys, CPAs</li>
        <li><strong>Other Agents:</strong> Out-of-area agents who can refer relocating clients</li>
        <li><strong>Personal Network:</strong> Friends, family, neighbors, and social connections</li>
        <li><strong>Business Professionals:</strong> Insurance agents, financial advisors, business owners</li>
        <li><strong>Community Leaders:</strong> Coaches, teachers, religious leaders, club members</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Referral Generation Strategies</h3>
      <ol class="list-decimal list-inside space-y-2 ml-4">
        <li><strong>Ask Directly:</strong> "Who do you know who might be thinking of buying or selling?"</li>
        <li><strong>Provide Value First:</strong> Share market insights, home maintenance tips, local information</li>
        <li><strong>Stay Top-of-Mind:</strong> Regular communication through newsletters, social media, events</li>
        <li><strong>Reciprocate:</strong> Refer business to your network partners when appropriate</li>
        <li><strong>Thank and Reward:</strong> Acknowledge referrals promptly and appropriately</li>
      </ol>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Professional Networking</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Join Organizations:</strong> Chamber of Commerce, Rotary, BNI, industry associations</li>
        <li><strong>Attend Events:</strong> Networking mixers, community events, professional conferences</li>
        <li><strong>Host Events:</strong> Client appreciation parties, educational seminars, market updates</li>
        <li><strong>Strategic Partnerships:</strong> Formal referral agreements with complementary businesses</li>
        <li><strong>Online Networking:</strong> LinkedIn connections, Facebook groups, industry forums</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Client Retention for Referrals</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Post-Closing Follow-up:</strong> Continue relationship after transaction completion</li>
        <li><strong>Annual Check-ins:</strong> Home value updates, market reports, personal touches</li>
        <li><strong>Special Occasions:</strong> Home anniversaries, birthdays, holidays</li>
        <li><strong>Valuable Content:</strong> Home maintenance tips, market updates, local events</li>
        <li><strong>Personal Touch:</strong> Remember family details, interests, and preferences</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Create a systematic approach to staying in touch with past clients</li>
        <li>Build genuine relationships with professional service providers</li>
        <li>Always ask for referrals at appropriate times during and after transactions</li>
        <li>Provide value to your network before asking for referrals</li>
        <li>Track referral sources and thank referrers promptly and appropriately</li>
      </ul>
    `,
    quiz: [
      {
        question: "According to NAR, what percentage of real estate business comes from referrals?",
        options: ["25%", "32%", "39%", "45%"],
        correctAnswer: "39%"
      },
      {
        question: "How much more likely are referred clients to close compared to other leads?",
        options: ["2x", "3x", "4x", "5x"],
        correctAnswer: "4x"
      }
    ]
  }
];

export const closingModules = [
  {
    id: 'contract-writing-negotiation',
    title: 'Lesson 1: Contract Writing and Negotiation',
    category: 'closing',
    content: `
      <p>Contract writing and negotiation are core competencies for real estate professionals. According to industry data, <strong>skilled negotiators help their clients save an average of $5,000-$15,000 per transaction</strong> through effective contract terms and negotiation strategies.</p>
      
      <h3 class="font-semibold mt-6 mb-2 text-lg">Essential Contract Elements</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Purchase Price and Terms:</strong> Clear pricing structure and payment terms</li>
        <li><strong>Contingencies:</strong> Inspection, financing, appraisal, and sale of buyer's home</li>
        <li><strong>Timeline:</strong> Specific dates for inspections, financing, and closing</li>
        <li><strong>Property Condition:</strong> "As-is" versus repair negotiations</li>
        <li><strong>Inclusions/Exclusions:</strong> What stays and what goes with the property</li>
        <li><strong>Earnest Money:</strong> Amount and handling of good faith deposit</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Negotiation Strategies</h3>
      <ol class="list-decimal list-inside space-y-2 ml-4">
        <li><strong>Prepare Thoroughly:</strong> Know market conditions, comparable sales, and client priorities</li>
        <li><strong>Understand Motivations:</strong> Learn what's most important to each party</li>
        <li><strong>Create Win-Win Solutions:</strong> Look beyond price to terms, timing, and conditions</li>
        <li><strong>Use Escalation Clauses:</strong> Automatic price increases up to a maximum in competitive markets</li>
        <li><strong>Leverage Non-Price Terms:</strong> Closing date, possession, repairs, and contingencies</li>
      </ol>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Common Negotiation Points</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Price Adjustments:</strong> Based on appraisal, inspection findings, or market changes</li>
        <li><strong>Repair Negotiations:</strong> Who pays for what repairs and improvements</li>
        <li><strong>Closing Costs:</strong> Seller concessions and buyer assistance</li>
        <li><strong>Possession Date:</strong> When buyer takes occupancy</li>
        <li><strong>Contingency Periods:</strong> Length of time for inspections and financing</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Always use state-approved contract forms and understand all clauses</li>
        <li>Prepare multiple negotiation scenarios before making or receiving offers</li>
        <li>Focus on your client's priorities while understanding the other party's needs</li>
        <li>Document all agreements and changes in writing immediately</li>
        <li>Know when to walk away if terms don't meet your client's minimum requirements</li>
      </ul>
    `,
    quiz: [
      {
        question: "How much can skilled negotiators help their clients save per transaction?",
        options: ["$2,000-$8,000", "$5,000-$15,000", "$10,000-$20,000", "$15,000-$25,000"],
        correctAnswer: "$5,000-$15,000"
      },
      {
        question: "What should you focus on first in negotiations?",
        options: ["Price only", "Client's priorities", "Closing date", "Repair issues"],
        correctAnswer: "Client's priorities"
      }
    ]
  },
  {
    id: 'inspection-appraisal-management',
    title: 'Lesson 2: Inspection and Appraisal Management',
    category: 'closing',
    content: `
      <p>Property inspections and appraisals are critical milestones that can make or break a transaction. According to industry data, <strong>15% of contracts are terminated due to inspection issues</strong> and <strong>4% fail due to low appraisals</strong>.</p>
      
      <h3 class="font-semibold mt-6 mb-2 text-lg">Home Inspection Process</h3>
      <ol class="list-decimal list-inside space-y-2 ml-4">
        <li><strong>Inspector Selection:</strong> Recommend qualified, licensed inspectors with good reputations</li>
        <li><strong>Scheduling:</strong> Coordinate inspection within contract timeframe (typically 7-10 days)</li>
        <li><strong>Attendance:</strong> Encourage buyers to attend and ask questions</li>
        <li><strong>Report Review:</strong> Help clients understand findings and prioritize issues</li>
        <li><strong>Negotiation Strategy:</strong> Determine which items to request repairs for</li>
      </ol>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Common Inspection Issues</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Major Systems:</strong> HVAC, electrical, plumbing problems requiring professional repair</li>
        <li><strong>Structural Issues:</strong> Foundation, roof, or framing concerns</li>
        <li><strong>Safety Hazards:</strong> Lead paint, asbestos, mold, or other health risks</li>
        <li><strong>Maintenance Items:</strong> Minor repairs that are normal wear and tear</li>
        <li><strong>Code Violations:</strong> Items not up to current building codes</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Appraisal Management</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Preparation:</strong> Provide appraiser with comparable sales and property improvements</li>
        <li><strong>Access:</strong> Ensure easy access and highlight property's best features</li>
        <li><strong>Low Appraisal Response:</strong> Request reconsideration with additional comps if warranted</li>
        <li><strong>Negotiation Options:</strong> Price reduction, buyer additional cash, or seller concessions</li>
        <li><strong>Timeline Management:</strong> Ensure appraisal is completed within contract deadlines</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Educate clients about the inspection process and what to expect</li>
        <li>Help prioritize inspection findings - not everything needs to be repaired</li>
        <li>Prepare for appraisals by providing relevant market data</li>
        <li>Have backup plans ready for common inspection and appraisal issues</li>
        <li>Maintain professional relationships with quality inspectors and appraisers</li>
      </ul>
    `,
    quiz: [
      {
        question: "What percentage of contracts are terminated due to inspection issues?",
        options: ["8%", "12%", "15%", "20%"],
        correctAnswer: "15%"
      },
      {
        question: "What percentage of contracts fail due to low appraisals?",
        options: ["2%", "4%", "6%", "8%"],
        correctAnswer: "4%"
      }
    ]
  },
  {
    id: 'financing-mortgage-process',
    title: 'Lesson 3: Financing and Mortgage Process',
    category: 'closing',
    content: `
      <p>Understanding the financing process is crucial for successful transactions. According to the Mortgage Bankers Association, <strong>financing issues cause 5% of purchase contracts to fail</strong>, making mortgage knowledge essential for agents.</p>
      
      <h3 class="font-semibold mt-6 mb-2 text-lg">Loan Types and Programs</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Conventional Loans:</strong> 3-20% down, PMI if less than 20% down, best rates for good credit</li>
        <li><strong>FHA Loans:</strong> 3.5% down minimum, mortgage insurance required, more flexible credit requirements</li>
        <li><strong>VA Loans:</strong> No down payment for qualified veterans, no PMI, competitive rates</li>
        <li><strong>USDA Loans:</strong> No down payment for rural properties, income restrictions apply</li>
        <li><strong>Jumbo Loans:</strong> Above conforming loan limits, typically require 10-20% down</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Pre-approval vs Pre-qualification</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Pre-qualification:</strong> Informal estimate based on stated income and assets</li>
        <li><strong>Pre-approval:</strong> Formal application with income/asset verification and credit check</li>
        <li><strong>Underwritten Pre-approval:</strong> Full underwriting review, strongest buyer position</li>
        <li><strong>Cash Equivalent:</strong> Proof of funds for cash-like closing timeline</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Mortgage Timeline Management</h3>
      <ol class="list-decimal list-inside space-y-2 ml-4">
        <li><strong>Application (Day 1-3):</strong> Complete loan application with all required documents</li>
        <li><strong>Processing (Day 4-20):</strong> Lender verifies income, assets, and employment</li>
        <li><strong>Underwriting (Day 21-30):</strong> Final loan approval and conditions</li>
        <li><strong>Clear to Close (Day 28-35):</strong> All conditions met, ready for closing</li>
        <li><strong>Closing (Day 30-45):</strong> Final walkthrough and document signing</li>
      </ol>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Common Financing Issues</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Income Documentation:</strong> Self-employed borrowers, commission income, job changes</li>
        <li><strong>Credit Issues:</strong> Late payments, high debt-to-income ratios, credit inquiries</li>
        <li><strong>Asset Verification:</strong> Gift funds, large deposits, retirement account access</li>
        <li><strong>Property Issues:</strong> Appraisal problems, property condition, condo approval</li>
        <li><strong>Rate Lock Expiration:</strong> Delays causing rate lock to expire</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Build relationships with multiple qualified lenders for client referrals</li>
        <li>Understand basic loan programs to help match clients with appropriate financing</li>
        <li>Encourage buyers to get pre-approved before house hunting</li>
        <li>Stay in regular contact with lenders throughout the transaction</li>
        <li>Have backup lender options ready in case of financing issues</li>
      </ul>
    `,
    quiz: [
      {
        question: "What percentage of purchase contracts fail due to financing issues?",
        options: ["3%", "5%", "7%", "9%"],
        correctAnswer: "5%"
      },
      {
        question: "What is the minimum down payment for FHA loans?",
        options: ["3%", "3.5%", "5%", "10%"],
        correctAnswer: "3.5%"
      }
    ]
  },
  {
    id: 'closing-coordination',
    title: 'Lesson 4: Closing Coordination and Settlement',
    category: 'closing',
    content: `
      <p>The closing process requires careful coordination of multiple parties and documents. According to industry data, <strong>proper closing coordination prevents 85% of last-minute transaction failures</strong> and ensures smooth settlement for all parties.</p>
      
      <h3 class="font-semibold mt-6 mb-2 text-lg">Pre-Closing Checklist (1 Week Before)</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Final Loan Approval:</strong> Confirm clear-to-close from lender</li>
        <li><strong>Title Work:</strong> Review title commitment and resolve any issues</li>
        <li><strong>Insurance:</strong> Verify homeowner's insurance is in place</li>
        <li><strong>Utilities:</strong> Coordinate transfer of utilities to buyer</li>
        <li><strong>Final Walkthrough:</strong> Schedule 24-48 hours before closing</li>
        <li><strong>Closing Disclosure:</strong> Review with buyer 3 days before closing</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Closing Day Responsibilities</h3>
      <ol class="list-decimal list-inside space-y-2 ml-4">
        <li><strong>Document Review:</strong> Verify all closing documents are accurate</li>
        <li><strong>Final Numbers:</strong> Confirm closing costs match estimates</li>
        <li><strong>Key Transfer:</strong> Coordinate key handover and garage door openers</li>
        <li><strong>Possession:</strong> Ensure property is vacant and clean (if required)</li>
        <li><strong>Recording:</strong> Confirm deed and mortgage will be recorded properly</li>
      </ol>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Common Closing Issues</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Funding Delays:</strong> Lender wire transfer or document issues</li>
        <li><strong>Title Problems:</strong> Liens, judgments, or ownership disputes</li>
        <li><strong>Final Walkthrough Issues:</strong> Property condition or missing items</li>
        <li><strong>Document Errors:</strong> Names, amounts, or legal descriptions incorrect</li>
        <li><strong>Insurance Problems:</strong> Coverage gaps or carrier issues</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Post-Closing Follow-up</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Immediate:</strong> Congratulate clients and confirm satisfaction</li>
        <li><strong>24-48 Hours:</strong> Check in to ensure smooth transition</li>
        <li><strong>30 Days:</strong> Follow up on any warranty or utility issues</li>
        <li><strong>Annual:</strong> Provide home value updates and market reports</li>
        <li><strong>Referral Request:</strong> Ask for referrals and online reviews</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Create detailed closing checklists and timelines for every transaction</li>
        <li>Communicate proactively with all parties leading up to closing</li>
        <li>Build relationships with reliable title companies and closing attorneys</li>
        <li>Always attend closings to advocate for your clients</li>
        <li>Follow up after closing to ensure client satisfaction and generate referrals</li>
      </ul>
    `,
    quiz: [
      {
        question: "What percentage of last-minute transaction failures can be prevented with proper closing coordination?",
        options: ["75%", "80%", "85%", "90%"],
        correctAnswer: "85%"
      },
      {
        question: "When should the final walkthrough be scheduled?",
        options: ["1 week before", "3 days before", "24-48 hours before", "Day of closing"],
        correctAnswer: "24-48 hours before"
      }
    ]
  },
  {
    id: 'problem-solving-crisis-management',
    title: 'Lesson 5: Problem Solving and Crisis Management',
    category: 'closing',
    content: `
      <p>Real estate transactions rarely go perfectly smooth. According to industry surveys, <strong>78% of transactions encounter at least one significant issue</strong> that requires professional problem-solving skills to resolve successfully.</p>
      
      <h3 class="font-semibold mt-6 mb-2 text-lg">Common Transaction Problems</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Financing Issues:</strong> Loan denial, rate changes, underwriting conditions</li>
        <li><strong>Appraisal Problems:</strong> Low appraisal, property condition issues, comparable disputes</li>
        <li><strong>Inspection Disputes:</strong> Major repair requests, seller refusal, safety concerns</li>
        <li><strong>Title Issues:</strong> Liens, easements, boundary disputes, ownership questions</li>
        <li><strong>Timing Conflicts:</strong> Delayed closings, possession issues, rate lock expirations</li>
        <li><strong>Communication Breakdowns:</strong> Unresponsive parties, misunderstandings, conflicts</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Problem-Solving Framework</h3>
      <ol class="list-decimal list-inside space-y-2 ml-4">
        <li><strong>Assess the Situation:</strong> Gather all facts and understand the real problem</li>
        <li><strong>Communicate Immediately:</strong> Inform all parties about the issue and timeline</li>
        <li><strong>Explore Options:</strong> Brainstorm multiple solutions with pros and cons</li>
        <li><strong>Negotiate Solutions:</strong> Work with all parties to find acceptable compromises</li>
        <li><strong>Document Everything:</strong> Put all agreements and changes in writing</li>
        <li><strong>Follow Through:</strong> Ensure solutions are implemented properly</li>
      </ol>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Crisis Management Strategies</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Stay Calm:</strong> Maintain professional composure under pressure</li>
        <li><strong>Manage Expectations:</strong> Keep clients informed with realistic timelines</li>
        <li><strong>Have Backup Plans:</strong> Always prepare alternative solutions</li>
        <li><strong>Use Your Network:</strong> Leverage relationships with lenders, inspectors, contractors</li>
        <li><strong>Know When to Escalate:</strong> Involve brokers, attorneys, or other professionals when needed</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Preventing Common Problems</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Thorough Pre-qualification:</strong> Verify buyer financing capacity early</li>
        <li><strong>Realistic Pricing:</strong> Use accurate CMAs to avoid appraisal issues</li>
        <li><strong>Clear Communication:</strong> Set expectations and maintain regular contact</li>
        <li><strong>Professional Network:</strong> Work with reliable, responsive service providers</li>
        <li><strong>Contingency Planning:</strong> Discuss potential issues and solutions upfront</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Develop a systematic approach to problem-solving and crisis management</li>
        <li>Build a network of reliable professionals who can help resolve issues quickly</li>
        <li>Communicate proactively with all parties when problems arise</li>
        <li>Always have backup plans and alternative solutions ready</li>
        <li>Learn from each problem to prevent similar issues in future transactions</li>
      </ul>
    `,
    quiz: [
      {
        question: "What percentage of transactions encounter at least one significant issue?",
        options: ["65%", "72%", "78%", "85%"],
        correctAnswer: "78%"
      },
      {
        question: "What should you do first when a transaction problem arises?",
        options: ["Call your broker", "Assess the situation", "Blame the other party", "Cancel the contract"],
        correctAnswer: "Assess the situation"
      }
    ]
  },
  {
    id: 'post-closing-client-care',
    title: 'Lesson 6: Post-Closing Client Care and Relationship Management',
    category: 'closing',
    content: `
      <p>The transaction closing is not the end of the client relationship—it's the beginning of a long-term partnership. According to NAR research, <strong>past clients and referrals generate 41% of business for typical agents and 89% for top producers</strong>.</p>
      
      <h3 class="font-semibold mt-6 mb-2 text-lg">Immediate Post-Closing (First 30 Days)</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Closing Day:</strong> Congratulate clients and provide closing gift</li>
        <li><strong>24-48 Hours:</strong> Follow up to ensure smooth transition and address any issues</li>
        <li><strong>1 Week:</strong> Check in on utilities, services, and neighborhood adjustment</li>
        <li><strong>30 Days:</strong> Send home maintenance checklist and local service provider list</li>
        <li><strong>Review Request:</strong> Ask for online reviews and testimonials</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Long-Term Relationship Building</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Quarterly Newsletters:</strong> Market updates, home maintenance tips, local events</li>
        <li><strong>Annual Home Value Reports:</strong> Automated property value updates</li>
        <li><strong>Special Occasions:</strong> Home anniversaries, birthdays, holidays</li>
        <li><strong>Client Events:</strong> Annual appreciation parties, educational seminars</li>
        <li><strong>Personal Touch:</strong> Remember family details, interests, and life changes</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Referral Generation System</h3>
      <ol class="list-decimal list-inside space-y-2 ml-4">
        <li><strong>Provide Exceptional Service:</strong> Exceed expectations throughout the transaction</li>
        <li><strong>Ask at the Right Time:</strong> When clients are most satisfied and grateful</li>
        <li><strong>Make it Easy:</strong> Provide referral cards and clear instructions</li>
        <li><strong>Stay Top-of-Mind:</strong> Regular communication keeps you memorable</li>
        <li><strong>Thank and Reward:</strong> Acknowledge referrals promptly and appropriately</li>
      </ol>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Client Database Management</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Contact Information:</strong> Keep current addresses, phone numbers, emails</li>
        <li><strong>Personal Details:</strong> Family members, birthdays, interests, preferences</li>
        <li><strong>Transaction History:</strong> Properties bought/sold, dates, satisfaction levels</li>
        <li><strong>Communication Log:</strong> Track all interactions and follow-up needs</li>
        <li><strong>Referral Tracking:</strong> Monitor referrals given and received</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Value-Added Services</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Home Maintenance Reminders:</strong> Seasonal checklists and tips</li>
        <li><strong>Contractor Referrals:</strong> Vetted service provider recommendations</li>
        <li><strong>Market Insights:</strong> Neighborhood trends and investment opportunities</li>
        <li><strong>Life Event Support:</strong> Help with moves, downsizing, or upsizing</li>
        <li><strong>Investment Advice:</strong> Real estate investment opportunities and guidance</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Develop a systematic post-closing follow-up schedule and stick to it</li>
        <li>Use CRM technology to automate communications and track relationships</li>
        <li>Provide ongoing value through market insights and helpful resources</li>
        <li>Ask for referrals consistently but appropriately throughout the relationship</li>
        <li>Invest in client appreciation events and personal touches that build loyalty</li>
      </ul>
    `,
    quiz: [
      {
        question: "What percentage of business do past clients and referrals generate for top producers?",
        options: ["65%", "75%", "89%", "95%"],
        correctAnswer: "89%"
      },
      {
        question: "When is the best time to ask for referrals?",
        options: ["At closing", "When clients are most satisfied", "During the transaction", "Only at events"],
        correctAnswer: "When clients are most satisfied"
      }
    ]
  }
];

export const professionalExcellenceModules = [
  {
    id: 'fair-housing-compliance',
    title: 'Lesson 1: Fair Housing Laws & Compliance',
    category: 'professional',
    content: `
      <p>Fair housing laws are fundamental to ethical real estate practice. Violations can result in significant fines, license suspension, and legal liability. Understanding and following these laws isn't just legally required—it's the right thing to do to ensure equal housing opportunities for all.</p>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Federal Fair Housing Act Overview</h3>
      <p>The Fair Housing Act prohibits discrimination in housing based on seven protected classes:</p>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Race</strong></li>
        <li><strong>Color</strong></li>
        <li><strong>National Origin</strong></li>
        <li><strong>Religion</strong></li>
        <li><strong>Sex (including sexual harassment)</strong></li>
        <li><strong>Familial Status (families with children under 18)</strong></li>
        <li><strong>Disability</strong></li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Treat all clients equally regardless of protected class membership</li>
        <li>Let clients lead conversations about neighborhood preferences</li>
        <li>Provide factual information, avoid subjective opinions about areas</li>
        <li>Use diverse imagery and inclusive language in all marketing</li>
        <li>Stay updated on state and local fair housing laws in your area</li>
        <li>Document all client interactions and maintain detailed records</li>
      </ul>
    `,
    quiz: [
      {
        question: "How many protected classes are covered under the Federal Fair Housing Act?",
        options: ["5", "7", "9", "12"],
        correctAnswer: "7"
      },
      {
        question: "Which of these statements is appropriate when showing properties?",
        options: ["'This neighborhood has great schools'", "'You'd fit in well here'", "'What features are important to you in a neighborhood?'", "'This area is very safe'"],
        correctAnswer: "'What features are important to you in a neighborhood?'"
      }
    ]
  },
  {
    id: 'market-trends-analysis',
    title: 'Lesson 2: Reading Market Trends & Data',
    category: 'professional',
    content: `
      <p>Understanding market trends is crucial for positioning yourself as the local expert. <strong>87% of buyers and sellers want agents who can provide market insights</strong> beyond just showing properties.</p>
      
      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Market Indicators</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Days on Market (DOM):</strong> Average time properties stay listed</li>
        <li><strong>Price per Square Foot:</strong> Standardized pricing comparison</li>
        <li><strong>Inventory Levels:</strong> Supply and demand balance</li>
        <li><strong>Absorption Rate:</strong> How quickly homes sell in current market</li>
        <li><strong>Price Trends:</strong> Direction and velocity of price changes</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Track key market indicators monthly for your area</li>
        <li>Create visual reports to share insights with clients</li>
        <li>Compare local trends to regional and national data</li>
        <li>Use market data to support pricing recommendations</li>
        <li>Stay informed about economic factors affecting real estate</li>
      </ul>
    `,
    quiz: [
      {
        question: "What percentage of buyers and sellers want agents who can provide market insights?",
        options: ["67%", "75%", "82%", "87%"],
        correctAnswer: "87%"
      },
      {
        question: "What does DOM stand for in real estate market analysis?",
        options: ["Days on Market", "Demand over Market", "Data on Market", "Direct on Market"],
        correctAnswer: "Days on Market"
      }
    ]
  },
  {
    id: 'agency-disclosure',
    title: 'Lesson 3: Agency Relationships & Disclosure',
    category: 'professional',
    content: `
      <p>Understanding agency relationships is crucial for legal compliance and client trust. <strong>Failure to properly disclose agency relationships is one of the top causes of legal disputes</strong> in real estate.</p>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Types of Agency Relationships</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Seller's Agent:</strong> Represents seller's interests exclusively</li>
        <li><strong>Buyer's Agent:</strong> Represents buyer's interests exclusively</li>
        <li><strong>Dual Agent:</strong> Represents both parties (where legally permitted)</li>
        <li><strong>Transaction Broker:</strong> Facilitates transaction without representing either party</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Disclose agency relationships at first substantive contact</li>
        <li>Use written disclosure forms required by your state</li>
        <li>Explain fiduciary duties clearly to clients</li>
        <li>Avoid conflicts of interest</li>
        <li>Document all disclosures and acknowledgments</li>
      </ul>
    `,
    quiz: [
      {
        question: "When should agency relationships be disclosed?",
        options: ["At contract signing", "At first substantive contact", "At closing", "When asked by client"],
        correctAnswer: "At first substantive contact"
      },
      {
        question: "What type of agent represents both buyer and seller?",
        options: ["Seller's Agent", "Buyer's Agent", "Dual Agent", "Transaction Broker"],
        correctAnswer: "Dual Agent"
      }
    ]
  },
  {
    id: 'comparative-market-analysis',
    title: 'Lesson 4: Comparative Market Analysis (CMA)',
    category: 'professional',
    content: `
      <p>A well-prepared CMA is your most powerful tool for winning listings and helping buyers make competitive offers. <strong>Accurate pricing based on solid CMA data sells homes 38% faster</strong>.</p>
      
      <h3 class="font-semibold mt-6 mb-2 text-lg">CMA Components</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Sold Comparables:</strong> Similar properties sold in last 3-6 months</li>
        <li><strong>Active Listings:</strong> Current competition in the market</li>
        <li><strong>Pending Sales:</strong> Properties under contract</li>
        <li><strong>Expired Listings:</strong> Properties that failed to sell</li>
        <li><strong>Price Adjustments:</strong> For differences in features, condition, location</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Use properties within 1 mile and 20% size variance when possible</li>
        <li>Adjust for significant differences in features and condition</li>
        <li>Present data visually with maps and charts</li>
        <li>Explain your methodology to clients</li>
        <li>Update CMAs regularly as market conditions change</li>
      </ul>
    `,
    quiz: [
      {
        question: "How much faster do accurately priced homes sell?",
        options: ["25%", "32%", "38%", "45%"],
        correctAnswer: "38%"
      },
      {
        question: "What time frame should you use for sold comparables?",
        options: ["1-2 months", "3-6 months", "6-12 months", "12+ months"],
        correctAnswer: "3-6 months"
      }
    ]
  },
  {
    id: 'contract-law',
    title: 'Lesson 5: Contract Law Essentials',
    category: 'professional',
    content: `
      <p>Real estate contracts are legally binding documents. <strong>Contract disputes account for 60% of real estate litigation</strong>. Understanding contract basics protects both you and your clients.</p>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Essential Contract Elements</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Offer and Acceptance:</strong> Clear terms agreed upon by all parties</li>
        <li><strong>Consideration:</strong> Something of value exchanged</li>
        <li><strong>Legal Purpose:</strong> Contract must be for lawful activity</li>
        <li><strong>Competent Parties:</strong> All parties must have legal capacity</li>
        <li><strong>Written Form:</strong> Real estate contracts must be in writing</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Use state-approved contract forms</li>
        <li>Fill out all required fields completely</li>
        <li>Explain contract terms to clients in plain language</li>
        <li>Never practice law - refer legal questions to attorneys</li>
        <li>Keep copies of all signed documents</li>
      </ul>
    `,
    quiz: [
      {
        question: "What percentage of real estate litigation involves contract disputes?",
        options: ["40%", "50%", "60%", "70%"],
        correctAnswer: "60%"
      },
      {
        question: "Which is NOT an essential element of a valid contract?",
        options: ["Offer and Acceptance", "Consideration", "Notarization", "Competent Parties"],
        correctAnswer: "Notarization"
      }
    ]
  },
  {
    id: 'investment-analysis',
    title: 'Lesson 6: Investment Property Analysis',
    category: 'professional',
    content: `
      <p>Investment property analysis requires different skills than residential sales. <strong>Real estate investors control 20% of home purchases</strong>, making this a valuable specialization.</p>
      
      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Investment Metrics</h3>
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Cap Rate:</strong> Net operating income ÷ property value</li>
        <li><strong>Cash-on-Cash Return:</strong> Annual cash flow ÷ cash invested</li>
        <li><strong>Gross Rent Multiplier:</strong> Purchase price ÷ annual rent</li>
        <li><strong>1% Rule:</strong> Monthly rent should equal 1% of purchase price</li>
        <li><strong>DSCR:</strong> Debt service coverage ratio</li>
      </ul>

      <h3 class="font-semibold mt-6 mb-2 text-lg">Key Takeaways & Actions</h3>
      <ul class="list-disc list-inside space-y-2 text-sm">
        <li>Learn to calculate and explain investment metrics</li>
        <li>Understand local rental market conditions</li>
        <li>Build relationships with property managers</li>
        <li>Know financing options for investors</li>
        <li>Create investment property analysis templates</li>
      </ul>
    `,
    quiz: [
      {
        question: "What percentage of home purchases are made by real estate investors?",
        options: ["15%", "20%", "25%", "30%"],
        correctAnswer: "20%"
      },
      {
        question: "What does the 1% rule state?",
        options: ["1% annual appreciation", "1% of income for housing", "Monthly rent = 1% of purchase price", "1% commission reduction"],
        correctAnswer: "Monthly rent = 1% of purchase price"
      }
    ]
  }
];

// Role-play scenarios for practice sessions
export interface RolePlayScenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  learningObjectives: string[];
  relatedModules: string[];
  persona: {
    name: string;
    gender: 'male' | 'female';
    background: string;
    personality: string;
    goals: string[];
    concerns: string[];
    communicationStyle: string;
  };
}

export const rolePlayScenarios: RolePlayScenario[] = [
  {
    id: 'first-time-buyer-consultation',
    title: 'First-Time Buyer Consultation',
    description: 'Help a nervous first-time buyer understand the home buying process and build confidence.',
    difficulty: 'Beginner',
    learningObjectives: [
      'Explain the buying process clearly',
      'Address first-time buyer concerns',
      'Build trust and rapport',
      'Set realistic expectations'
    ],
    relatedModules: ['client-communication', 'objection-handling'],
    persona: {
      name: 'Sarah Chen',
      gender: 'female',
      background: 'A 28-year-old marketing professional looking to buy her first home. She has been saving for years but feels overwhelmed by the process.',
      personality: 'Cautious, detail-oriented, asks lots of questions, wants to understand everything before making decisions.',
      goals: [
        'Find a safe, affordable home in a good neighborhood',
        'Understand all costs involved',
        'Make sure she\'s making a smart financial decision'
      ],
      concerns: [
        'Making a mistake with such a big purchase',
        'Hidden costs she doesn\'t know about',
        'Whether she can really afford homeownership',
        'The complexity of the buying process'
      ],
      communicationStyle: 'Asks detailed questions, needs reassurance, appreciates step-by-step explanations'
    }
  },
  {
    id: 'luxury-seller-pricing',
    title: 'Luxury Home Seller - Pricing Discussion',
    description: 'Convince a luxury homeowner to price their property realistically based on market data.',
    difficulty: 'Advanced',
    learningObjectives: [
      'Present market data convincingly',
      'Handle pricing objections professionally',
      'Maintain relationship while being direct',
      'Use comparable sales effectively'
    ],
    relatedModules: ['comparative-market-analysis', 'negotiation-strategies'],
    persona: {
      name: 'Robert Wellington',
      gender: 'male',
      background: 'A successful business owner who bought his luxury home 10 years ago for $2.8M. He believes it\'s worth $4.5M but market data suggests $3.6M.',
      personality: 'Confident, successful, used to getting his way, values expertise but can be stubborn about his opinions.',
      goals: [
        'Get the highest possible price for his home',
        'Sell within 6 months to relocate for business',
        'Work with an agent who understands luxury market'
      ],
      concerns: [
        'Leaving money on the table',
        'Working with an agent who doesn\'t understand his market',
        'Taking too long to sell and missing his business opportunity'
      ],
      communicationStyle: 'Direct, business-like, expects data-driven recommendations, challenges assumptions'
    }
  },
  {
    id: 'investor-multi-property',
    title: 'Real Estate Investor - Multi-Property Purchase',
    description: 'Work with an experienced investor looking to purchase multiple rental properties.',
    difficulty: 'Advanced',
    learningObjectives: [
      'Understand investment criteria and metrics',
      'Discuss cash flow and ROI calculations',
      'Handle multiple property negotiations',
      'Build long-term investor relationships'
    ],
    relatedModules: ['investment-analysis', 'negotiation-strategies'],
    persona: {
      name: 'Maria Rodriguez',
      gender: 'female',
      background: 'An experienced real estate investor with 12 rental properties. She\'s looking to add 3-4 more properties to her portfolio this year.',
      personality: 'Analytical, numbers-focused, efficient, values time and expertise, direct communicator.',
      goals: [
        'Find properties with 8%+ cash-on-cash return',
        'Purchase 3-4 properties in the next 6 months',
        'Work with an agent who understands investment criteria'
      ],
      concerns: [
        'Wasting time on properties that don\'t meet her criteria',
        'Market conditions affecting rental yields',
        'Finding an agent who can move quickly on good deals'
      ],
      communicationStyle: 'Gets straight to business, wants numbers and facts, appreciates efficiency and expertise'
    }
  },
  {
    id: 'downsizing-seniors',
    title: 'Senior Couple - Downsizing Consultation',
    description: 'Help a senior couple navigate the emotional and practical aspects of downsizing.',
    difficulty: 'Intermediate',
    learningObjectives: [
      'Handle emotional aspects of selling family home',
      'Discuss timing and logistics of downsizing',
      'Address senior-specific concerns',
      'Provide compassionate guidance'
    ],
    relatedModules: ['client-communication', 'transaction-management'],
    persona: {
      name: 'Frank and Betty Morrison',
      gender: 'male',
      background: 'Married 45 years, lived in their 4-bedroom home for 30 years. Their children have moved away and they want something smaller and easier to maintain.',
      personality: 'Sentimental about their home, practical about their needs, want to make sure they\'re making the right decision.',
      goals: [
        'Find a smaller, low-maintenance home',
        'Stay in the same general area near friends',
        'Get fair value for their current home'
      ],
      concerns: [
        'Leaving behind so many memories',
        'Whether they\'ll be happy in a smaller space',
        'The stress and work involved in moving',
        'Market timing and getting a good price'
      ],
      communicationStyle: 'Thoughtful, asks about process and timeline, appreciates patience and understanding'
    }
  },
  {
    id: 'competitive-market-buyer',
    title: 'Buyer in Competitive Market',
    description: 'Guide a buyer through making competitive offers in a hot market.',
    difficulty: 'Intermediate',
    learningObjectives: [
      'Explain competitive market strategies',
      'Help buyer understand escalation clauses',
      'Manage expectations about multiple offers',
      'Keep buyer motivated despite rejections'
    ],
    relatedModules: ['negotiation-strategies', 'market-trends-analysis'],
    persona: {
      name: 'David Kim',
      gender: 'male',
      background: 'A software engineer who has been looking for 4 months and lost 3 offers. He\'s getting frustrated and considering giving up or expanding his budget significantly.',
      personality: 'Analytical, getting impatient, starting to doubt the process, wants to understand strategy.',
      goals: [
        'Finally get an accepted offer',
        'Stay within his budget if possible',
        'Understand what he needs to do to compete'
      ],
      concerns: [
        'Overpaying in a competitive market',
        'Never finding a home he can afford',
        'Whether he should wait for market to cool down',
        'Making emotional decisions due to frustration'
      ],
      communicationStyle: 'Wants data and strategy, getting more emotional due to frustration, needs encouragement'
    }
  },
  {
    id: 'divorce-sale',
    title: 'Divorce Sale - Sensitive Situation',
    description: 'Navigate the complexities of selling a home during a divorce proceeding.',
    difficulty: 'Advanced',
    learningObjectives: [
      'Handle emotionally charged situations professionally',
      'Work with multiple decision makers',
      'Understand legal constraints in divorce sales',
      'Maintain neutrality while providing service'
    ],
    relatedModules: ['client-communication', 'transaction-management'],
    persona: {
      name: 'Jennifer Walsh',
      gender: 'female',
      background: 'Going through a difficult divorce and needs to sell the family home as part of the settlement. Her ex-husband is being difficult about the process.',
      personality: 'Stressed, emotional, wants to get through this quickly, frustrated with the situation.',
      goals: [
        'Sell the house quickly to finalize divorce',
        'Get fair market value',
        'Minimize stress and conflict during the process'
      ],
      concerns: [
        'Her ex-husband interfering with the sale',
        'Legal complications affecting the transaction',
        'Emotional difficulty of selling family home',
        'Timeline pressure from divorce proceedings'
      ],
      communicationStyle: 'Sometimes emotional, appreciates professionalism and discretion, needs reassurance about process'
    }
  },
  {
    id: 'commission-objection',
    title: 'Commission Negotiation - Objection Handling',
    description: 'Handle a seller who wants to negotiate your commission down significantly.',
    difficulty: 'Intermediate',
    learningObjectives: [
      'Defend your value proposition confidently',
      'Handle price objections without being defensive',
      'Demonstrate ROI of professional services',
      'Know when to walk away from bad deals'
    ],
    relatedModules: ['objection-handling', 'client-communication'],
    persona: {
      name: 'Tom Bradley',
      gender: 'male',
      background: 'A homeowner who has been contacted by several discount brokers. He wants to list his $450K home but thinks 6% commission is too high.',
      personality: 'Price-conscious, skeptical of traditional real estate model, has done research on discount brokers.',
      goals: [
        'Sell his home for top dollar',
        'Minimize selling costs',
        'Understand what he\'s paying for with commission'
      ],
      concerns: [
        'Paying too much in commission',
        'Whether full-service agents are worth the cost',
        'Missing out on savings with discount brokers'
      ],
      communicationStyle: 'Direct, challenges your value, asks "why should I pay you that much?", wants specific examples'
    }
  },
  {
    id: 'price-too-high-objection',
    title: 'Buyer Objection - "The Price is Too High"',
    description: 'Address a buyer who loves a property but thinks it\'s overpriced.',
    difficulty: 'Beginner',
    learningObjectives: [
      'Use market data to justify pricing',
      'Help buyers see value beyond price',
      'Explore creative solutions',
      'Guide buyers to make informed decisions'
    ],
    relatedModules: ['objection-handling', 'negotiation-strategies'],
    persona: {
      name: 'Amanda Foster',
      gender: 'female',
      background: 'A buyer who found her dream home but thinks it\'s priced $30K too high based on what she\'s seen online.',
      personality: 'Emotional about the house but trying to be practical, wants to make a smart financial decision.',
      goals: [
        'Get the house she loves',
        'Not overpay in the market',
        'Make an offer that will be accepted'
      ],
      concerns: [
        'Paying more than the house is worth',
        'Losing the house to another buyer',
        'Regretting the purchase later',
        'What her friends and family will think about the price'
      ],
      communicationStyle: 'Expresses strong opinions, needs validation, wants to understand market comparisons'
    }
  },
  {
    id: 'timing-objection',
    title: 'Seller Objection - "Not the Right Time"',
    description: 'Convince a seller that now is actually a good time to sell despite their hesitation.',
    difficulty: 'Intermediate',
    learningObjectives: [
      'Address timing concerns with market data',
      'Uncover the real objection behind timing',
      'Create urgency without being pushy',
      'Help sellers make confident decisions'
    ],
    relatedModules: ['objection-handling', 'market-trends-analysis'],
    persona: {
      name: 'Linda Patterson',
      gender: 'female',
      background: 'A homeowner who has been thinking about selling for 2 years but keeps finding reasons to wait. She\'s worried about market conditions.',
      personality: 'Indecisive, risk-averse, reads a lot of news about housing market crashes, looks for reasons to delay.',
      goals: [
        'Sell eventually when the time is "perfect"',
        'Not make a mistake by selling at the wrong time',
        'Get maximum value for her home'
      ],
      concerns: [
        'Market might be better next year',
        'Interest rates affecting buyer demand',
        'Economic uncertainty',
        'Regretting selling too soon'
      ],
      communicationStyle: 'Brings up news articles, asks "what if" questions, needs reassurance and data'
    }
  },
  {
    id: 'already-working-with-agent',
    title: 'Buyer Objection - "I\'m Already Working with Someone"',
    description: 'Handle a buyer at an open house who says they\'re already working with another agent.',
    difficulty: 'Advanced',
    learningObjectives: [
      'Respect existing relationships professionally',
      'Plant seeds for future opportunities',
      'Differentiate yourself subtly',
      'Leave door open without being pushy'
    ],
    relatedModules: ['objection-handling', 'client-communication'],
    persona: {
      name: 'Michael Torres',
      gender: 'male',
      background: 'A buyer who has been working with an agent for 2 months but isn\'t completely satisfied. He\'s at your open house and seems interested.',
      personality: 'Loyal but practical, not fully committed to current agent, open to better service.',
      goals: [
        'Find the right home',
        'Work with an agent who is responsive and knowledgeable',
        'Not hurt anyone\'s feelings by switching agents'
      ],
      concerns: [
        'Being disloyal to current agent',
        'Starting over with someone new',
        'Whether you\'d actually be better',
        'Awkwardness of switching'
      ],
      communicationStyle: 'Polite but guarded, mentions current agent to set boundaries, watches how you respond'
    }
  }
];

// Combine all modules
export const allModules = [
  ...marketingModules,
  ...closingModules,
  ...professionalExcellenceModules
];