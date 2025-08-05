-- Demo Data for Ecosystem Matching System Testing
-- Creates sample users, content, and domain metrics to test matching algorithms

-- Create demo users (different niches for cross-matching)
INSERT INTO public.users (id, email, website, niche, api_key, credits, plan, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'demo.plumber@example.com', 'https://bestplumbing.demo', 'plumbing', 'demo_plumber_key_123', 5, 'free', now()),
('22222222-2222-2222-2222-222222222222', 'demo.electrician@example.com', 'https://sparkelectric.demo', 'electrical', 'demo_electric_key_456', 5, 'free', now()),
('33333333-3333-3333-3333-333333333333', 'demo.hvac@example.com', 'https://coolairhvac.demo', 'hvac', 'demo_hvac_key_789', 5, 'free', now()),
('44444444-4444-4444-4444-444444444444', 'demo.roofer@example.com', 'https://topnotchroofing.demo', 'roofing', 'demo_roof_key_101', 5, 'free', now()),
('55555555-5555-5555-5555-555555555555', 'demo.techdev@example.com', 'https://codinggenius.demo', 'technology', 'demo_tech_key_202', 5, 'free', now())
ON CONFLICT (id) DO UPDATE SET
email = EXCLUDED.email,
website = EXCLUDED.website,
niche = EXCLUDED.niche,
api_key = EXCLUDED.api_key;

-- Create domain metrics for demo users (with geographic data)
INSERT INTO public.domain_metrics (id, user_id, domain, domain_authority, page_authority, geographic_location, latitude, longitude, placement_success_rate, wordpress_api_url, created_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'bestplumbing.demo', 45, 38, 'Phoenix, AZ', 33.4484, -112.0740, 0.85, 'https://bestplumbing.demo/wp-json/wp/v2', now()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'sparkelectric.demo', 52, 41, 'Phoenix, AZ', 33.4512, -112.0660, 0.90, 'https://sparkelectric.demo/wp-json/wp/v2', now()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'coolairhvac.demo', 48, 39, 'Scottsdale, AZ', 33.4942, -111.9261, 0.88, 'https://coolairhvac.demo/wp-json/wp/v2', now()),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'topnotchroofing.demo', 41, 35, 'Mesa, AZ', 33.4152, -111.8315, 0.75, 'https://topnotchroofing.demo/wp-json/wp/v2', now()),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '55555555-5555-5555-5555-555555555555', 'codinggenius.demo', 65, 58, 'San Francisco, CA', 37.7749, -122.4194, 0.95, 'https://codinggenius.demo/wp-json/wp/v2', now())
ON CONFLICT (id) DO UPDATE SET
domain_authority = EXCLUDED.domain_authority,
geographic_location = EXCLUDED.geographic_location;

-- Create sample tracked content for each demo user
INSERT INTO public.tracked_content (id, user_id, api_key, url, title, content, keywords, keyword_density, timestamp, created_at) VALUES
-- Plumber content
('p1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'demo_plumber_key_123', 'https://bestplumbing.demo/emergency-drain-cleaning', 'Emergency Drain Cleaning Services in Phoenix', 'When you have a clogged drain emergency in Phoenix, you need fast professional plumbing services. Our experienced plumbers provide 24/7 drain cleaning with advanced equipment. We handle kitchen sinks, bathroom drains, and main sewer lines.', 
'["drain", "cleaning", "plumbing", "emergency", "phoenix", "professional", "sewer", "clogged"]', 
'{"drain": "5.2", "cleaning": "4.1", "plumbing": "3.8", "emergency": "3.2"}', now(), now()),

-- Electrician content  
('e2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'demo_electric_key_456', 'https://sparkelectric.demo/electrical-panel-upgrade', 'Electrical Panel Upgrades for Modern Homes', 'Upgrade your home electrical panel to meet modern electrical demands. Our licensed electricians install new breaker panels, upgrade wiring, and ensure your electrical system meets current safety codes in Phoenix and surrounding areas.',
'["electrical", "panel", "upgrade", "electrician", "breaker", "wiring", "safety", "licensed"]',
'{"electrical": "6.1", "panel": "4.8", "upgrade": "4.2", "electrician": "3.9"}', now(), now()),

-- HVAC content
('h3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'demo_hvac_key_789', 'https://coolairhvac.demo/ac-repair-phoenix', 'Professional AC Repair Services Phoenix', 'Expert air conditioning repair services in Phoenix Arizona. Our HVAC technicians provide fast AC repair, maintenance, and installation. We service all major brands and offer emergency cooling system repairs for residential and commercial properties.',
'["hvac", "repair", "conditioning", "phoenix", "technician", "cooling", "maintenance", "emergency"]',
'{"hvac": "5.5", "repair": "4.9", "conditioning": "4.3", "phoenix": "3.7"}', now(), now()),

-- Roofer content
('r4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'demo_roof_key_101', 'https://topnotchroofing.demo/roof-replacement', 'Complete Roof Replacement Services', 'Professional roof replacement services in Mesa Arizona. We install tile roofs, shingle roofing, and metal roofing systems. Our roofing contractors provide free estimates and warranty coverage for residential roof replacement projects.',
'["roof", "replacement", "roofing", "tile", "shingle", "metal", "contractor", "warranty"]',
'{"roof": "7.2", "replacement": "5.1", "roofing": "4.8", "contractor": "3.4"}', now(), now()),

-- Tech content
('t5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'demo_tech_key_202', 'https://codinggenius.demo/web-development-services', 'Custom Web Development Services', 'Professional web development services for businesses. We build responsive websites, web applications, and e-commerce platforms using modern technologies like React, Node.js, and JavaScript. Our developers create scalable solutions.',
'["web", "development", "javascript", "react", "nodejs", "website", "application", "developer"]',
'{"web": "6.8", "development": "6.2", "javascript": "4.5", "react": "3.9"}', now(), now())

ON CONFLICT (id) DO UPDATE SET
title = EXCLUDED.title,
content = EXCLUDED.content,
keywords = EXCLUDED.keywords;

-- Create some partner relationships to test auto-approval
INSERT INTO public.partner_relationships (id, user_a_id, user_b_id, quality_score, successful_placements, auto_approve_threshold, created_at) VALUES
('pa111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 8.5, 3, 7.0, now()),
('pb222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 7.8, 2, 7.0, now()),
('pc333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 6.9, 1, 7.0, now())
ON CONFLICT (id) DO UPDATE SET
quality_score = EXCLUDED.quality_score,
successful_placements = EXCLUDED.successful_placements;

-- Show what was created
SELECT 'Demo users created:' as info, count(*) as count FROM public.users WHERE email LIKE 'demo.%';
SELECT 'Demo content created:' as info, count(*) as count FROM public.tracked_content WHERE api_key LIKE 'demo_%';
SELECT 'Demo domain metrics:' as info, count(*) as count FROM public.domain_metrics WHERE domain LIKE '%.demo';
SELECT 'Demo partnerships:' as info, count(*) as count FROM public.partner_relationships WHERE user_a_id LIKE '11111111%' OR user_b_id LIKE '11111111%'; 