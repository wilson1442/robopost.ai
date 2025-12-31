-- Migration 003: Seed Industries
-- Populates industries table with common industry categories

INSERT INTO industries (slug, name, description) VALUES
  ('technology', 'Technology', 'Software, hardware, and digital innovation'),
  ('finance', 'Finance', 'Banking, investment, and financial services'),
  ('healthcare', 'Healthcare', 'Medical, pharmaceutical, and health services'),
  ('marketing', 'Marketing', 'Digital marketing, advertising, and brand strategy'),
  ('education', 'Education', 'Learning, training, and educational technology'),
  ('ecommerce', 'E-commerce', 'Online retail and digital commerce'),
  ('media', 'Media & Entertainment', 'News, entertainment, and content creation'),
  ('saas', 'SaaS', 'Software as a Service and cloud applications'),
  ('startups', 'Startups', 'Early-stage companies and entrepreneurship'),
  ('ai-ml', 'AI & Machine Learning', 'Artificial intelligence and machine learning'),
  ('cybersecurity', 'Cybersecurity', 'Information security and data protection'),
  ('real-estate', 'Real Estate', 'Property, construction, and real estate technology')
ON CONFLICT (slug) DO NOTHING;

