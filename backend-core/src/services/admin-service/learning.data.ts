/**
 * FinEra Learning Hub - Financial Terms & Module Definitions
 * Production seed data for interactive term tooltips and learning modules
 */

export interface FinancialTermSeed {
  term: string;
  slug: string;
  simpleDefinition: string;
  advancedDefinition: string;
  example: string;
  relatedTerms: string[];
}

export const FINANCIAL_TERMS: FinancialTermSeed[] = [
  {
    term: "credit score",
    slug: "credit-score",
    simpleDefinition: "A number that shows how likely you are to repay money you borrow.",
    advancedDefinition: "A numerical representation (typically 300–850) of creditworthiness based on payment history, amounts owed, length of credit history, new credit, and types of credit used.",
    example: "If you pay your loan on time, your credit score goes up. Late payments can lower it.",
    relatedTerms: ["interest rate", "default", "credit limit"],
  },
  {
    term: "interest rate",
    slug: "interest-rate",
    simpleDefinition: "The extra cost you pay to borrow money, shown as a percentage.",
    advancedDefinition: "The percentage charged by a lender for the use of assets, expressed as an annual percentage rate (APR). Can be fixed or variable.",
    example: "An 18% interest rate on $100 means you pay $18 per year in interest.",
    relatedTerms: ["credit score", "principal", "compound interest"],
  },
  {
    term: "default",
    slug: "default",
    simpleDefinition: "Failing to repay a loan as agreed. This hurts your credit and can lead to penalties.",
    advancedDefinition: "Failure to meet the legal obligations of a loan contract, typically after missing multiple scheduled payments. Triggers collection actions and credit damage.",
    example: "Missing 3 monthly payments in a row may result in default on your loan.",
    relatedTerms: ["credit score", "repayment", "delinquency"],
  },
  {
    term: "principal",
    slug: "principal",
    simpleDefinition: "The original amount you borrowed, before interest or fees.",
    advancedDefinition: "The initial amount of a loan or investment, excluding interest, fees, or other charges. Used as the base for interest calculations.",
    example: "If you borrow $500, the principal is $500. Interest is added on top.",
    relatedTerms: ["interest rate", "repayment", "loan"],
  },
  {
    term: "credit limit",
    slug: "credit-limit",
    simpleDefinition: "The maximum amount you can borrow at one time.",
    advancedDefinition: "The maximum amount of credit a lender extends to a borrower. Utilization (amount used vs limit) affects credit score.",
    example: "A $200 credit limit means you cannot borrow more than $200.",
    relatedTerms: ["credit score", "utilization", "available credit"],
  },
  {
    term: "repayment",
    slug: "repayment",
    simpleDefinition: "Paying back money you borrowed, usually in regular installments.",
    advancedDefinition: "The act of returning borrowed funds to the lender, typically in scheduled installments covering principal and interest.",
    example: "Monthly repayment of $50 pays down your loan over time.",
    relatedTerms: ["principal", "interest rate", "default"],
  },
  {
    term: "Financial Discipline Score",
    slug: "financial-discipline-score",
    simpleDefinition: "FinEra's measure of how well you manage money—savings, repayments, and spending habits.",
    advancedDefinition: "A proprietary metric combining repayment reliability, savings consistency, transaction health, and account longevity to assess financial behavior.",
    example: "Higher scores unlock better credit limits and premium learning content.",
    relatedTerms: ["credit score", "repayment", "savings"],
  },
  {
    term: "collateral",
    slug: "collateral",
    simpleDefinition: "Something of value you pledge to secure a loan. If you default, the lender can take it.",
    advancedDefinition: "An asset pledged by a borrower to secure a loan. Provides the lender recourse if the borrower fails to repay.",
    example: "A laptop or phone can be collateral for a small loan.",
    relatedTerms: ["default", "secured loan", "buy-back agreement"],
  },
  {
    term: "savings",
    slug: "savings",
    simpleDefinition: "Money you set aside instead of spending. Builds security and unlocks credit.",
    advancedDefinition: "Portion of income not spent on consumption. Key to financial resilience and often linked to credit eligibility.",
    example: "Saving $20/month builds a safety net and improves your discipline score.",
    relatedTerms: ["Financial Discipline Score", "budget", "emergency fund"],
  },
  {
    term: "budget",
    slug: "budget",
    simpleDefinition: "A plan for how you will spend and save your money.",
    advancedDefinition: "A financial plan allocating income to expenses, savings, and debt repayment over a period.",
    example: "A budget helps you avoid overspending and prioritize repayments.",
    relatedTerms: ["savings", "repayment", "spending"],
  },
  {
    term: "compound interest",
    slug: "compound-interest",
    simpleDefinition: "Interest calculated on both the principal and previously earned interest. Grows faster over time.",
    advancedDefinition: "Interest computed on the initial principal and accumulated interest from previous periods. Exponential growth effect.",
    example: "Savings grow faster with compound interest; debt grows faster too if unpaid.",
    relatedTerms: ["interest rate", "principal", "savings"],
  },
  {
    term: "delinquency",
    slug: "delinquency",
    simpleDefinition: "Being late on a payment. Can lead to fees and damage your credit.",
    advancedDefinition: "Failure to make a payment by the due date. Typically reported after 30 days late; escalates to default if unresolved.",
    example: "One late payment = delinquency. Multiple = risk of default.",
    relatedTerms: ["default", "repayment", "credit score"],
  },
  {
    term: "utilization",
    slug: "utilization",
    simpleDefinition: "How much of your credit limit you're using. Lower is better for your score.",
    advancedDefinition: "Credit utilization ratio = (amount owed / credit limit) × 100. Key factor in credit scoring; under 30% is ideal.",
    example: "Using $60 of a $200 limit = 30% utilization.",
    relatedTerms: ["credit limit", "credit score", "available credit"],
  },
  {
    term: "buy-back agreement",
    slug: "buy-back-agreement",
    simpleDefinition: "A contract where you can repurchase collateral if you repay the loan.",
    advancedDefinition: "Agreement allowing the borrower to reclaim pledged collateral upon full repayment of the loan.",
    example: "Repay your loan and get your laptop back per the buy-back agreement.",
    relatedTerms: ["collateral", "repayment", "default"],
  },
  {
    term: "emergency fund",
    slug: "emergency-fund",
    simpleDefinition: "Money saved for unexpected expenses like medical bills or job loss.",
    advancedDefinition: "Reserve of liquid assets (typically 3–6 months of expenses) for unforeseen financial shocks.",
    example: "An emergency fund helps you avoid borrowing when something unexpected happens.",
    relatedTerms: ["savings", "budget", "financial resilience"],
  },
];

export interface LearningModuleSeed {
  moduleCode: string;
  title: string;
  slug: string;
  description: string;
  durationMinutes: number;
  difficultyLevel?: number;
  category?: string;
  tier: "FREE" | "PREMIUM";
  orderIndex: number;
  icon: string;
  color: string;
  termsIncluded: string[];
  prerequisites?: string[];
  content?: { sections: Array<{ title: string; text: string; quiz?: unknown }> };
}

export const LEARNING_MODULES: LearningModuleSeed[] = [
  {
    moduleCode: "BUDGET-101",
    title: "Budgeting Basics",
    slug: "budgeting-basics",
    description: "Build strong financial discipline before accessing advanced financial tools.",
    durationMinutes: 15,
    tier: "FREE",
    orderIndex: 0,
    icon: "Target",
    color: "emerald",
    termsIncluded: ["budget", "savings", "spending"],
    difficultyLevel: 1,
    category: "basics",
    content: {
      sections: [
        { title: "What is a budget?", text: "A budget is a plan for how you will spend and save your money. Understanding your budget helps you avoid overspending and prioritize repayments." },
        { title: "Creating your first budget", text: "Start by tracking your income and expenses. Allocate funds to savings, essential costs, and discretionary spending." },
      ],
    },
  },
  {
    moduleCode: "SAVE-101",
    title: "Building Saving Habits",
    slug: "building-saving-habits",
    description: "Learn how to save consistently and grow your emergency fund.",
    durationMinutes: 20,
    tier: "FREE",
    orderIndex: 1,
    icon: "PiggyBank",
    color: "green",
    termsIncluded: ["savings", "emergency fund", "compound interest"],
    difficultyLevel: 1,
    category: "basics",
  },
  {
    moduleCode: "DEBT-101",
    title: "Understanding Debt Responsibility",
    slug: "understanding-debt-responsibility",
    description: "Know what happens when you borrow and how to stay on track.",
    durationMinutes: 25,
    tier: "FREE",
    orderIndex: 2,
    icon: "ShieldCheck",
    color: "red",
    termsIncluded: ["repayment", "default", "delinquency", "interest rate"],
    difficultyLevel: 2,
    category: "debt",
  },
  {
    moduleCode: "SPEND-101",
    title: "Smart Spending Behavior",
    slug: "smart-spending-behavior",
    description: "Make informed spending choices that support your financial goals.",
    durationMinutes: 18,
    tier: "FREE",
    orderIndex: 3,
    icon: "Wallet",
    color: "purple",
    termsIncluded: ["budget", "utilization", "credit limit"],
    difficultyLevel: 1,
    category: "spending",
  },
  {
    moduleCode: "GOAL-101",
    title: "Financial Goal Setting",
    slug: "financial-goal-setting",
    description: "Set and achieve short- and long-term financial goals.",
    durationMinutes: 22,
    tier: "FREE",
    orderIndex: 4,
    icon: "Trophy",
    color: "amber",
    termsIncluded: ["savings", "budget", "Financial Discipline Score"],
    difficultyLevel: 2,
    category: "goals",
  },
  {
    moduleCode: "DISC-201",
    title: "Advanced Financial Discipline Programs",
    slug: "advanced-financial-discipline",
    description: "Deep dive into discipline scoring and credit optimization.",
    durationMinutes: 45,
    tier: "PREMIUM",
    orderIndex: 5,
    icon: "Crown",
    color: "emerald",
    termsIncluded: ["Financial Discipline Score", "credit score", "utilization"],
    difficultyLevel: 4,
    category: "advanced",
  },
  {
    moduleCode: "INVEST-201",
    title: "Investment Fundamentals",
    slug: "investment-fundamentals",
    description: "Introduction to growing wealth through informed investment.",
    durationMinutes: 60,
    tier: "PREMIUM",
    orderIndex: 6,
    icon: "TrendingUp",
    color: "green",
    termsIncluded: ["compound interest", "savings", "principal"],
    difficultyLevel: 4,
    category: "investment",
  },
  {
    moduleCode: "CREDIT-201",
    title: "Credit Power Strategy",
    slug: "credit-power-strategy",
    description: "Maximize your credit potential while minimizing cost.",
    durationMinutes: 50,
    tier: "PREMIUM",
    orderIndex: 7,
    icon: "CreditCard",
    color: "emerald",
    termsIncluded: ["credit score", "credit limit", "utilization", "interest rate"],
    difficultyLevel: 3,
    category: "credit",
  },
  {
    moduleCode: "DIGITAL-201",
    title: "Digital Financial Systems",
    slug: "digital-financial-systems",
    description: "Navigate digital wallets, payments, and security.",
    durationMinutes: 40,
    tier: "PREMIUM",
    orderIndex: 8,
    icon: "Lightbulb",
    color: "yellow",
    termsIncluded: ["savings", "repayment", "budget"],
    difficultyLevel: 3,
    category: "digital",
  },
  {
    moduleCode: "EBOOKS-201",
    title: "Curated Financial eBooks & Resources",
    slug: "financial-ebooks-resources",
    description: "Self-paced reading and resources for continuous learning.",
    durationMinutes: 0,
    tier: "PREMIUM",
    orderIndex: 9,
    icon: "BookMarked",
    color: "pink",
    termsIncluded: [],
    difficultyLevel: 2,
    category: "resources",
  },
];
