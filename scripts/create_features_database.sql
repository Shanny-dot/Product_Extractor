-- Create database schema for storing extracted product features
-- This script sets up tables for comprehensive feature analysis

-- Create main features table
CREATE TABLE IF NOT EXISTS product_features (
    id SERIAL PRIMARY KEY,
    feature_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(feature_name)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(100),
    review_text TEXT NOT NULL,
    rating DECIMAL(2,1),
    review_date DATE,
    sentiment VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create feature mentions table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS feature_mentions (
    id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES product_reviews(id),
    feature_id INTEGER REFERENCES product_features(id),
    sentiment_score DECIMAL(3,2),
    context_snippet TEXT,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create feature analytics view
CREATE OR REPLACE VIEW feature_analytics AS
SELECT 
    pf.feature_name,
    pf.category,
    COUNT(fm.id) as mention_count,
    AVG(pr.rating) as avg_rating,
    AVG(fm.sentiment_score) as avg_sentiment,
    COUNT(CASE WHEN fm.sentiment_score > 0.5 THEN 1 END) as positive_mentions,
    COUNT(CASE WHEN fm.sentiment_score < -0.5 THEN 1 END) as negative_mentions,
    COUNT(CASE WHEN fm.sentiment_score BETWEEN -0.5 AND 0.5 THEN 1 END) as neutral_mentions
FROM product_features pf
LEFT JOIN feature_mentions fm ON pf.id = fm.feature_id
LEFT JOIN product_reviews pr ON fm.review_id = pr.id
GROUP BY pf.id, pf.feature_name, pf.category
ORDER BY mention_count DESC;

-- Insert common product feature categories
INSERT INTO product_features (feature_name, category) VALUES
('battery life', 'Power'),
('camera quality', 'Photography'),
('display', 'Screen'),
('audio quality', 'Sound'),
('design', 'Aesthetics'),
('performance', 'Speed'),
('price', 'Value'),
('portability', 'Physical'),
('build quality', 'Construction'),
('comfort', 'Ergonomics'),
('delivery', 'Service'),
('customer service', 'Support')
ON CONFLICT (feature_name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_sentiment ON product_reviews(sentiment);
CREATE INDEX IF NOT EXISTS idx_mentions_sentiment ON feature_mentions(sentiment_score);
CREATE INDEX IF NOT EXISTS idx_features_category ON product_features(category);

-- Create stored procedure for feature analysis
CREATE OR REPLACE FUNCTION analyze_product_features(product_filter VARCHAR DEFAULT NULL)
RETURNS TABLE (
    feature_name VARCHAR,
    category VARCHAR,
    total_mentions BIGINT,
    avg_rating NUMERIC,
    sentiment_breakdown JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fa.feature_name,
        fa.category,
        fa.mention_count as total_mentions,
        ROUND(fa.avg_rating, 2) as avg_rating,
        json_build_object(
            'positive', fa.positive_mentions,
            'negative', fa.negative_mentions,
            'neutral', fa.neutral_mentions,
            'positive_ratio', ROUND(fa.positive_mentions::DECIMAL / NULLIF(fa.mention_count, 0), 3)
        ) as sentiment_breakdown
    FROM feature_analytics fa
    WHERE (product_filter IS NULL OR EXISTS (
        SELECT 1 FROM feature_mentions fm2 
        JOIN product_reviews pr2 ON fm2.review_id = pr2.id 
        WHERE fm2.feature_id IN (
            SELECT id FROM product_features WHERE feature_name = fa.feature_name
        ) AND pr2.product_id = product_filter
    ))
    ORDER BY total_mentions DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE product_features IS 'Master table of all identified product features';
COMMENT ON TABLE product_reviews IS 'Customer reviews with ratings and sentiment analysis';
COMMENT ON TABLE feature_mentions IS 'Links reviews to mentioned features with context';
COMMENT ON VIEW feature_analytics IS 'Aggregated analytics for all product features';
