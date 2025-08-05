-- Complete Niche Ecosystem Mapping for All Industries
-- This creates smart cross-niche relationships for maximum backlink opportunities

-- Clear existing niche proximity data
DELETE FROM public.niche_proximity;

-- TECHNOLOGY & SOFTWARE ECOSYSTEM
INSERT INTO public.niche_proximity (niche_a, niche_b, proximity_score) VALUES
-- Tech core relationships
('technology', 'technology', 1.0),
('technology', 'marketing-advertising', 0.85), -- SaaS ↔ Marketing tools
('technology', 'ecommerce', 0.80), -- E-commerce platforms ↔ Tech
('technology', 'finance-business', 0.75), -- FinTech ↔ Business software
('technology', 'education', 0.70), -- EdTech ↔ Learning platforms
('technology', 'gaming-entertainment', 0.70), -- Gaming ↔ Software dev
('technology', 'self-improvement', 0.65), -- Productivity apps ↔ Self-help

-- CREATIVE SERVICES & ARTS ECOSYSTEM  
('creative-arts', 'creative-arts', 1.0),
('creative-arts', 'marketing-advertising', 0.90), -- Design ↔ Marketing agencies
('creative-arts', 'beauty-fashion', 0.85), -- Fashion design ↔ Beauty brands
('creative-arts', 'gaming-entertainment', 0.80), -- Game design ↔ Entertainment
('creative-arts', 'ecommerce', 0.75), -- Product photography ↔ Online stores
('creative-arts', 'diy-crafts', 0.75), -- Art tutorials ↔ Craft supplies
('creative-arts', 'travel-lifestyle', 0.70), -- Travel photography ↔ Lifestyle blogs

-- HOME SERVICES ECOSYSTEM (Enhanced)
('home-services', 'home-services', 1.0),
('home-services', 'real-estate', 0.90), -- Contractors ↔ Real estate agents
('home-services', 'diy-crafts', 0.80), -- Home improvement ↔ DIY tutorials
('home-services', 'green-sustainability', 0.75), -- Solar installers ↔ Eco-friendly
('home-services', 'automotive', 0.65), -- Garage builders ↔ Auto services

-- HEALTH & WELLNESS ECOSYSTEM
('health-wellness', 'health-wellness', 1.0),
('health-wellness', 'beauty-fashion', 0.85), -- Wellness ↔ Beauty products
('health-wellness', 'sports-outdoors', 0.85), -- Fitness ↔ Outdoor activities
('health-wellness', 'self-improvement', 0.80), -- Mental health ↔ Personal development
('health-wellness', 'food-restaurants', 0.75), -- Nutrition ↔ Healthy eating
('health-wellness', 'pets-animals', 0.70), -- Pet health ↔ Veterinary
('health-wellness', 'parenting-family', 0.70), -- Family health ↔ Parenting advice

-- FINANCE & BUSINESS ECOSYSTEM
('finance-business', 'finance-business', 1.0),
('finance-business', 'real-estate', 0.90), -- Mortgages ↔ Property investment
('finance-business', 'legal-professional', 0.85), -- Business law ↔ Corporate finance
('finance-business', 'ecommerce', 0.80), -- Payment processing ↔ Online business
('finance-business', 'self-improvement', 0.75), -- Financial planning ↔ Success coaching
('finance-business', 'automotive', 0.70), -- Auto loans ↔ Car dealerships

-- TRAVEL & LIFESTYLE ECOSYSTEM
('travel-lifestyle', 'travel-lifestyle', 1.0),
('travel-lifestyle', 'food-restaurants', 0.85), -- Travel dining ↔ Local cuisine
('travel-lifestyle', 'sports-outdoors', 0.80), -- Adventure travel ↔ Outdoor gear
('travel-lifestyle', 'beauty-fashion', 0.75), -- Travel fashion ↔ Lifestyle brands
('travel-lifestyle', 'automotive', 0.70), -- Road trips ↔ Car rentals
('travel-lifestyle', 'local-community', 0.75), -- Local guides ↔ Community events

-- E-COMMERCE & RETAIL ECOSYSTEM
('ecommerce', 'ecommerce', 1.0),
('ecommerce', 'marketing-advertising', 0.90), -- Online stores ↔ Digital marketing
('ecommerce', 'beauty-fashion', 0.85), -- Fashion e-commerce ↔ Beauty products
('ecommerce', 'parenting-family', 0.80), -- Kids products ↔ Family lifestyle
('ecommerce', 'pets-animals', 0.80), -- Pet supplies ↔ Animal care
('ecommerce', 'sports-outdoors', 0.75), -- Sporting goods ↔ Outdoor activities

-- FOOD & RESTAURANTS ECOSYSTEM
('food-restaurants', 'food-restaurants', 1.0),
('food-restaurants', 'local-community', 0.85), -- Local dining ↔ Community events
('food-restaurants', 'parenting-family', 0.75), -- Family dining ↔ Kids nutrition
('food-restaurants', 'green-sustainability', 0.75), -- Organic food ↔ Eco-friendly

-- AUTOMOTIVE & TRANSPORTATION ECOSYSTEM
('automotive', 'automotive', 1.0),
('automotive', 'sports-outdoors', 0.75), -- Racing ↔ Outdoor adventures
('automotive', 'diy-crafts', 0.70), -- Car maintenance ↔ DIY tutorials

-- REAL ESTATE & PROPERTY ECOSYSTEM
('real-estate', 'real-estate', 1.0),
('real-estate', 'local-community', 0.80), -- Local market ↔ Neighborhood info

-- BEAUTY & FASHION ECOSYSTEM
('beauty-fashion', 'beauty-fashion', 1.0),
('beauty-fashion', 'parenting-family', 0.70), -- Mom fashion ↔ Family lifestyle

-- GAMING & ENTERTAINMENT ECOSYSTEM
('gaming-entertainment', 'gaming-entertainment', 1.0),
('gaming-entertainment', 'sports-outdoors', 0.65), -- Esports ↔ Traditional sports

-- EDUCATION & LEARNING ECOSYSTEM
('education', 'education', 1.0),
('education', 'parenting-family', 0.80), -- Child education ↔ Parenting advice

-- SPORTS & OUTDOORS ECOSYSTEM
('sports-outdoors', 'sports-outdoors', 1.0),

-- PETS & ANIMALS ECOSYSTEM
('pets-animals', 'pets-animals', 1.0),

-- PARENTING & FAMILY ECOSYSTEM
('parenting-family', 'parenting-family', 1.0),

-- DIY & CRAFTS ECOSYSTEM
('diy-crafts', 'diy-crafts', 1.0),

-- LEGAL & PROFESSIONAL ECOSYSTEM
('legal-professional', 'legal-professional', 1.0),

-- MARKETING & ADVERTISING ECOSYSTEM
('marketing-advertising', 'marketing-advertising', 1.0),

-- NEWS & MEDIA ECOSYSTEM
('news-media', 'news-media', 1.0),
('news-media', 'politics-advocacy', 0.80), -- Political news ↔ Advocacy groups
('news-media', 'local-community', 0.75), -- Local news ↔ Community events

-- SPIRITUALITY & RELIGION ECOSYSTEM
('spirituality-religion', 'spirituality-religion', 1.0),

-- GREEN & SUSTAINABILITY ECOSYSTEM  
('green-sustainability', 'green-sustainability', 1.0),

-- SELF-IMPROVEMENT & PRODUCTIVITY ECOSYSTEM
('self-improvement', 'self-improvement', 1.0),

-- POLITICS & ADVOCACY ECOSYSTEM
('politics-advocacy', 'politics-advocacy', 1.0),

-- LOCAL & COMMUNITY ECOSYSTEM
('local-community', 'local-community', 1.0)

-- Add reverse relationships (B ↔ A) for all above relationships
ON CONFLICT (niche_a, niche_b) DO UPDATE SET proximity_score = EXCLUDED.proximity_score;

-- Insert reverse relationships
INSERT INTO public.niche_proximity (niche_a, niche_b, proximity_score)
SELECT niche_b, niche_a, proximity_score 
FROM public.niche_proximity 
WHERE niche_a != niche_b
ON CONFLICT (niche_a, niche_b) DO UPDATE SET proximity_score = EXCLUDED.proximity_score;

-- Verification query
SELECT 'Complete niche ecosystem created! ✅' as status, count(*) as total_relationships 
FROM public.niche_proximity; 