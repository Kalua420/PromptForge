/**
 * Seed credit-based templates
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEMPLATES = [
  // FREE TIER TEMPLATES (0 credits required)
  {
    title: 'Simple Blog Post',
    description: 'Create a basic blog post outline for any topic',
    category: 'writing',
    content: 'Create a blog post outline with:\n1. Introduction\n2. Main points (3-5)\n3. Conclusion\n4. Call to action',
    tier: 'free',
    featured: true,
    recommendedFor: 'starter',
    providers: ['groq', 'opencode'],
    useCase: 'writing',
  },
  {
    title: 'Basic Code Function',
    description: 'Generate a simple function in your preferred language',
    category: 'coding',
    content: 'Write a clean, well-documented function that:\n1. Has clear input/output\n2. Includes error handling\n3. Has inline comments',
    tier: 'free',
    featured: true,
    recommendedFor: 'starter',
    providers: ['groq', 'opencode'],
    useCase: 'coding',
  },
  {
    title: 'Customer Support Response',
    description: 'Draft professional customer support responses',
    category: 'chatbot',
    content: 'Write a professional customer support response that:\n1. Acknowledges the issue\n2. Provides a solution\n3. Offers follow-up support',
    tier: 'free',
    featured: false,
    recommendedFor: 'starter',
    providers: ['groq', 'opencode'],
    useCase: 'chatbot',
  },
  {
    title: 'Product Description',
    description: 'Write compelling product descriptions for e-commerce',
    category: 'writing',
    content: 'Create a product description that:\n1. Highlights key features\n2. Emphasizes benefits\n3. Includes call to action\n4. Uses persuasive language',
    tier: 'free',
    featured: false,
    recommendedFor: 'starter',
    providers: ['groq', 'opencode'],
    useCase: 'writing',
  },

  // STARTER TIER TEMPLATES (50 credits required)
  {
    title: 'Professional Email Template',
    description: 'Create professional business emails for various scenarios',
    category: 'writing',
    content: 'Write a professional email that:\n1. Has clear subject line\n2. Proper greeting and closing\n3. Concise body with action items\n4. Professional tone throughout',
    tier: 'starter',
    featured: true,
    recommendedFor: 'starter',
    providers: ['groq', 'sambanova', 'opencode'],
    useCase: 'writing',
  },
  {
    title: 'API Documentation',
    description: 'Generate API endpoint documentation',
    category: 'coding',
    content: 'Create API documentation including:\n1. Endpoint description\n2. Request/response examples\n3. Error codes\n4. Authentication requirements',
    tier: 'starter',
    featured: true,
    recommendedFor: 'starter',
    providers: ['groq', 'sambanova', 'opencode'],
    useCase: 'coding',
  },
  {
    title: 'Social Media Post',
    description: 'Create engaging social media content',
    category: 'writing',
    content: 'Write a social media post that:\n1. Grabs attention in first line\n2. Includes relevant hashtags\n3. Has clear call to action\n4. Matches platform tone',
    tier: 'starter',
    featured: false,
    recommendedFor: 'starter',
    providers: ['groq', 'sambanova', 'opencode'],
    useCase: 'writing',
  },

  // STANDARD TIER TEMPLATES (200 credits required)
  {
    title: 'Comprehensive Research Report',
    description: 'Generate in-depth research reports with analysis',
    category: 'research',
    content: 'Create a research report with:\n1. Executive summary\n2. Background and context\n3. Detailed analysis\n4. Key findings\n5. Recommendations\n6. References',
    tier: 'standard',
    featured: true,
    recommendedFor: 'standard',
    providers: ['sambanova', 'anthropic', 'gemini'],
    useCase: 'research',
  },
  {
    title: 'Advanced Algorithm Implementation',
    description: 'Implement complex algorithms with optimization',
    category: 'coding',
    content: 'Implement an algorithm that:\n1. Solves the problem efficiently\n2. Includes time/space complexity analysis\n3. Has comprehensive test cases\n4. Includes performance optimizations\n5. Well-documented code',
    tier: 'standard',
    featured: true,
    recommendedFor: 'standard',
    providers: ['sambanova', 'anthropic', 'gemini'],
    useCase: 'coding',
  },
  {
    title: 'Long-form Article',
    description: 'Write comprehensive long-form articles (1500+ words)',
    category: 'writing',
    content: 'Write a long-form article with:\n1. Compelling introduction\n2. Multiple sections with subheadings\n3. In-depth analysis\n4. Real-world examples\n5. Strong conclusion\n6. SEO optimization',
    tier: 'standard',
    featured: false,
    recommendedFor: 'standard',
    providers: ['sambanova', 'anthropic', 'gemini'],
    useCase: 'writing',
  },
  {
    title: 'Market Analysis',
    description: 'Analyze market trends and competitive landscape',
    category: 'research',
    content: 'Create a market analysis including:\n1. Market size and growth\n2. Competitive landscape\n3. Key players analysis\n4. Market trends\n5. Opportunities and threats\n6. Strategic recommendations',
    tier: 'standard',
    featured: false,
    recommendedFor: 'standard',
    providers: ['sambanova', 'anthropic', 'gemini'],
    useCase: 'research',
  },

  // PREMIUM TIER TEMPLATES (500 credits required)
  {
    title: 'Complete Business Plan',
    description: 'Generate comprehensive business plans',
    category: 'research',
    content: 'Create a complete business plan with:\n1. Executive summary\n2. Company description\n3. Market analysis\n4. Organization structure\n5. Marketing strategy\n6. Financial projections\n7. Risk analysis',
    tier: 'premium',
    featured: true,
    recommendedFor: 'premium',
    providers: ['sambanova', 'anthropic', 'gemini'],
    useCase: 'research',
  },
  {
    title: 'Full-Stack Application Architecture',
    description: 'Design complete application architectures',
    category: 'coding',
    content: 'Design a full-stack application with:\n1. System architecture diagram\n2. Database schema\n3. API design\n4. Frontend structure\n5. Deployment strategy\n6. Security considerations\n7. Scalability plan',
    tier: 'premium',
    featured: true,
    recommendedFor: 'premium',
    providers: ['sambanova', 'anthropic', 'gemini'],
    useCase: 'coding',
  },
  {
    title: 'Video Script with Storyboard',
    description: 'Create complete video scripts with visual descriptions',
    category: 'video',
    content: 'Create a video script with:\n1. Scene descriptions\n2. Dialogue and narration\n3. Visual cues\n4. Timing notes\n5. Audio requirements\n6. Transitions\n7. Call to action',
    tier: 'premium',
    featured: false,
    recommendedFor: 'premium',
    providers: ['sambanova', 'anthropic', 'gemini'],
    useCase: 'video',
  },
  {
    title: 'Advanced Chatbot Conversation Flow',
    description: 'Design complex chatbot conversation flows',
    category: 'chatbot',
    content: 'Design a chatbot flow with:\n1. Intent mapping\n2. Entity recognition\n3. Conversation paths\n4. Error handling\n5. Escalation procedures\n6. Personalization rules',
    tier: 'premium',
    featured: false,
    recommendedFor: 'premium',
    providers: ['sambanova', 'anthropic', 'gemini'],
    useCase: 'chatbot',
  },

  // ENTERPRISE TIER TEMPLATES (1000 credits required)
  {
    title: 'Enterprise System Design',
    description: 'Design enterprise-scale systems',
    category: 'coding',
    content: 'Design an enterprise system with:\n1. Microservices architecture\n2. Load balancing strategy\n3. Database replication\n4. Disaster recovery plan\n5. Security framework\n6. Monitoring and logging\n7. Performance optimization',
    tier: 'enterprise',
    featured: true,
    recommendedFor: 'enterprise',
    providers: ['sambanova', 'anthropic', 'gemini'],
    useCase: 'coding',
  },
  {
    title: 'Strategic Business Transformation',
    description: 'Plan comprehensive business transformations',
    category: 'research',
    content: 'Create a transformation plan with:\n1. Current state analysis\n2. Vision and goals\n3. Change management strategy\n4. Implementation roadmap\n5. Resource requirements\n6. Risk mitigation\n7. Success metrics\n8. Timeline and milestones',
    tier: 'enterprise',
    featured: true,
    recommendedFor: 'enterprise',
    providers: ['sambanova', 'anthropic', 'gemini'],
    useCase: 'research',
  },
  {
    title: 'AI/ML Model Development Pipeline',
    description: 'Design complete ML development pipelines',
    category: 'coding',
    content: 'Design an ML pipeline with:\n1. Data collection strategy\n2. Feature engineering\n3. Model selection\n4. Training pipeline\n5. Validation framework\n6. Deployment strategy\n7. Monitoring and retraining',
    tier: 'enterprise',
    featured: false,
    recommendedFor: 'enterprise',
    providers: ['sambanova', 'anthropic', 'gemini'],
    useCase: 'coding',
  },
  {
    title: 'Global Marketing Campaign',
    description: 'Plan multi-channel global marketing campaigns',
    category: 'writing',
    content: 'Create a global campaign with:\n1. Market segmentation\n2. Channel strategy\n3. Content calendar\n4. Localization approach\n5. Budget allocation\n6. KPIs and metrics\n7. Risk management',
    tier: 'enterprise',
    featured: false,
    recommendedFor: 'enterprise',
    providers: ['sambanova', 'anthropic', 'gemini'],
    useCase: 'writing',
  },
];

async function main() {
  console.log('🌱 Seeding credit-based templates...');
  
  // Clear existing templates
  await prisma.template.deleteMany({});
  console.log('✓ Cleared existing templates');
  
  // Create templates
  for (const template of TEMPLATES) {
    const minCreditsRequired = {
      free: 0,
      starter: 50,
      standard: 200,
      premium: 500,
      enterprise: 1000,
    }[template.tier] || 0;
    
    await prisma.template.create({
      data: {
        ...template,
        minCreditsRequired,
        providers: template.providers.join(', '),
      },
    });
  }
  
  console.log(`✓ Created ${TEMPLATES.length} templates`);
  console.log('✓ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
