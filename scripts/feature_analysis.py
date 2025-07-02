import pandas as pd
import numpy as np
from collections import Counter
import matplotlib.pyplot as plt
import seaborn as sns
from wordcloud import WordCloud
import re

def analyze_product_features(csv_file_path):
    """
    Comprehensive analysis of product features from review data
    """
    print("🔍 Starting Product Feature Analysis...")
    
    # Load the data
    try:
        df = pd.read_csv(csv_file_path)
        print(f"✅ Loaded {len(df)} reviews from {csv_file_path}")
    except Exception as e:
        print(f"❌ Error loading CSV: {e}")
        return
    
    # Find review text column
    review_columns = [col for col in df.columns if any(keyword in col.lower() 
                     for keyword in ['review', 'text', 'comment', 'feedback'])]
    
    if not review_columns:
        print("❌ No review text column found. Expected columns like 'review', 'text', 'comment'")
        return
    
    review_col = review_columns[0]
    print(f"📝 Using column '{review_col}' for review text")
    
    # Find rating column
    rating_columns = [col for col in df.columns if any(keyword in col.lower() 
                     for keyword in ['rating', 'score', 'stars'])]
    rating_col = rating_columns[0] if rating_columns else None
    
    # Extract features using pattern matching
    features = extract_features_from_reviews(df[review_col].dropna())
    
    # Analyze feature frequency and sentiment
    feature_analysis = analyze_feature_sentiment(df, review_col, rating_col, features)
    
    # Generate visualizations
    create_feature_visualizations(feature_analysis)
    
    # Generate summary report
    generate_summary_report(feature_analysis, len(df))
    
    print("✅ Analysis complete! Check the generated plots and summary.")

def extract_features_from_reviews(reviews):
    """
    Extract product features using pattern matching and NLP techniques
    """
    print("🔧 Extracting features from reviews...")
    
    # Define feature patterns for different product categories
    feature_patterns = {
        'battery': r'\b(battery|power|charging|charge)\b',
        'camera': r'\b(camera|photo|picture|image)\b',
        'display': r'\b(screen|display|monitor)\b',
        'audio': r'\b(sound|audio|speaker|music|volume)\b',
        'design': r'\b(design|look|appearance|style|color)\b',
        'performance': r'\b(performance|speed|fast|slow|lag)\b',
        'price': r'\b(price|cost|value|expensive|cheap|affordable)\b',
        'size': r'\b(size|weight|portable|compact|heavy)\b',
        'quality': r'\b(quality|build|material|durability)\b',
        'usability': r'\b(easy|difficult|user.friendly|interface|setup)\b',
        'delivery': r'\b(delivery|shipping|packaging|arrived)\b',
        'service': r'\b(service|support|help|customer)\b'
    }
    
    all_features = []
    
    for review in reviews:
        if pd.isna(review):
            continue
            
        review_lower = str(review).lower()
        review_features = []
        
        # Extract features using patterns
        for feature_name, pattern in feature_patterns.items():
            if re.search(pattern, review_lower):
                review_features.append(feature_name)
        
        # Extract additional noun phrases
        words = review_lower.split()
        for i in range(len(words) - 1):
            bigram = f"{words[i]} {words[i+1]}"
            if any(term in bigram for term in ['good', 'bad', 'great', 'poor']):
                # Extract the feature being described
                feature = re.sub(r'\b(good|bad|great|poor|excellent|terrible)\s*', '', bigram).strip()
                if len(feature) > 2 and feature not in review_features:
                    review_features.append(feature)
        
        all_features.extend(review_features)
    
    # Count feature frequency
    feature_counts = Counter(all_features)
    print(f"📊 Extracted {len(feature_counts)} unique features")
    
    return feature_counts

def analyze_feature_sentiment(df, review_col, rating_col, features):
    """
    Analyze sentiment for each feature based on ratings and context
    """
    print("💭 Analyzing feature sentiment...")
    
    feature_analysis = {}
    
    for feature, count in features.most_common(20):  # Top 20 features
        feature_ratings = []
        feature_sentiments = []
        
        for idx, review in df[review_col].dropna().items():
            if pd.isna(review):
                continue
                
            review_lower = str(review).lower()
            
            if feature in review_lower:
                # Get rating if available
                if rating_col and idx in df.index:
                    rating = df.loc[idx, rating_col]
                    if pd.notna(rating):
                        feature_ratings.append(float(rating))
                
                # Analyze sentiment context
                sentiment = analyze_context_sentiment(review_lower, feature)
                feature_sentiments.append(sentiment)
        
        # Calculate metrics
        avg_rating = np.mean(feature_ratings) if feature_ratings else 0
        positive_ratio = feature_sentiments.count('positive') / len(feature_sentiments) if feature_sentiments else 0
        negative_ratio = feature_sentiments.count('negative') / len(feature_sentiments) if feature_sentiments else 0
        
        feature_analysis[feature] = {
            'count': count,
            'avg_rating': avg_rating,
            'positive_ratio': positive_ratio,
            'negative_ratio': negative_ratio,
            'neutral_ratio': 1 - positive_ratio - negative_ratio,
            'total_mentions': len(feature_ratings)
        }
    
    return feature_analysis

def analyze_context_sentiment(text, feature):
    """
    Analyze sentiment of feature mentions in context
    """
    positive_words = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'awesome', 'fantastic', 'best']
    negative_words = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing', 'poor', 'worst']
    
    # Look for sentiment words near the feature
    feature_index = text.find(feature)
    if feature_index == -1:
        return 'neutral'
    
    # Check words around the feature (±50 characters)
    context_start = max(0, feature_index - 50)
    context_end = min(len(text), feature_index + len(feature) + 50)
    context = text[context_start:context_end]
    
    positive_count = sum(1 for word in positive_words if word in context)
    negative_count = sum(1 for word in negative_words if word in context)
    
    if positive_count > negative_count:
        return 'positive'
    elif negative_count > positive_count:
        return 'negative'
    else:
        return 'neutral'

def create_feature_visualizations(feature_analysis):
    """
    Create visualizations for feature analysis
    """
    print("📈 Creating visualizations...")
    
    # Prepare data for plotting
    features = list(feature_analysis.keys())
    counts = [data['count'] for data in feature_analysis.values()]
    ratings = [data['avg_rating'] for data in feature_analysis.values()]
    positive_ratios = [data['positive_ratio'] for data in feature_analysis.values()]
    
    # Create subplots
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    fig.suptitle('Product Feature Analysis Dashboard', fontsize=16, fontweight='bold')
    
    # 1. Feature Frequency
    axes[0, 0].barh(features[:10], counts[:10], color='skyblue')
    axes[0, 0].set_title('Top 10 Most Mentioned Features')
    axes[0, 0].set_xlabel('Number of Mentions')
    
    # 2. Average Ratings by Feature
    colors = ['green' if r >= 4 else 'orange' if r >= 3 else 'red' for r in ratings[:10]]
    axes[0, 1].barh(features[:10], ratings[:10], color=colors)
    axes[0, 1].set_title('Average Rating by Feature')
    axes[0, 1].set_xlabel('Average Rating')
    axes[0, 1].set_xlim(0, 5)
    
    # 3. Sentiment Distribution
    sentiment_data = []
    for feature, data in list(feature_analysis.items())[:10]:
        sentiment_data.append([data['positive_ratio'], data['neutral_ratio'], data['negative_ratio']])
    
    sentiment_df = pd.DataFrame(sentiment_data, 
                               columns=['Positive', 'Neutral', 'Negative'],
                               index=features[:10])
    
    sentiment_df.plot(kind='barh', stacked=True, ax=axes[1, 0], 
                     color=['green', 'gray', 'red'], alpha=0.7)
    axes[1, 0].set_title('Sentiment Distribution by Feature')
    axes[1, 0].set_xlabel('Sentiment Ratio')
    
    # 4. Feature Rating vs Frequency Scatter
    axes[1, 1].scatter(counts, ratings, alpha=0.6, s=100)
    axes[1, 1].set_xlabel('Mention Frequency')
    axes[1, 1].set_ylabel('Average Rating')
    axes[1, 1].set_title('Feature Frequency vs Rating')
    
    # Add feature labels to scatter plot
    for i, feature in enumerate(features):
        if i < 10:  # Only label top 10 to avoid clutter
            axes[1, 1].annotate(feature, (counts[i], ratings[i]), 
                               xytext=(5, 5), textcoords='offset points', fontsize=8)
    
    plt.tight_layout()
    plt.savefig('feature_analysis_dashboard.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    # Create word cloud of features
    feature_text = ' '.join([f"{feature} " * count for feature, count in 
                            [(f, feature_analysis[f]['count']) for f in features]])
    
    if feature_text.strip():
        plt.figure(figsize=(12, 8))
        wordcloud = WordCloud(width=800, height=400, background_color='white').generate(feature_text)
        plt.imshow(wordcloud, interpolation='bilinear')
        plt.axis('off')
        plt.title('Product Features Word Cloud', fontsize=16, fontweight='bold')
        plt.savefig('features_wordcloud.png', dpi=300, bbox_inches='tight')
        plt.show()

def generate_summary_report(feature_analysis, total_reviews):
    """
    Generate a comprehensive summary report
    """
    print("📋 Generating summary report...")
    
    # Sort features by different metrics
    by_frequency = sorted(feature_analysis.items(), key=lambda x: x[1]['count'], reverse=True)
    by_rating = sorted(feature_analysis.items(), key=lambda x: x[1]['avg_rating'], reverse=True)
    by_positive_sentiment = sorted(feature_analysis.items(), key=lambda x: x[1]['positive_ratio'], reverse=True)
    
    report = f"""
PRODUCT FEATURE ANALYSIS SUMMARY REPORT
======================================
Generated: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}

OVERVIEW
--------
• Total Reviews Analyzed: {total_reviews}
• Unique Features Identified: {len(feature_analysis)}
• Total Feature Mentions: {sum(data['count'] for data in feature_analysis.values())}

TOP FEATURES BY FREQUENCY
------------------------
{chr(10).join([f"{i+1}. {feature}: {data['count']} mentions" 
               for i, (feature, data) in enumerate(by_frequency[:10])])}

HIGHEST RATED FEATURES
---------------------
{chr(10).join([f"{i+1}. {feature}: {data['avg_rating']:.2f}/5.0 (from {data['total_mentions']} ratings)" 
               for i, (feature, data) in enumerate(by_rating[:10]) if data['avg_rating'] > 0])}

MOST POSITIVELY PERCEIVED FEATURES
---------------------------------
{chr(10).join([f"{i+1}. {feature}: {data['positive_ratio']:.1%} positive sentiment" 
               for i, (feature, data) in enumerate(by_positive_sentiment[:10])])}

AREAS FOR IMPROVEMENT
--------------------
{chr(10).join([f"• {feature}: {data['avg_rating']:.2f}/5.0 rating, {data['negative_ratio']:.1%} negative sentiment" 
               for feature, data in by_rating[-5:] if data['avg_rating']% negative sentiment" 
               for feature, data in by_rating[-5:] if data['avg_rating'] > 0 and data['negative_ratio'] > 0.3])}

RECOMMENDATIONS
--------------
1. Leverage strengths in highly-rated features for marketing
2. Address concerns in low-rated, frequently mentioned features
3. Monitor sentiment trends for key product aspects
4. Focus development on features with mixed sentiment

METHODOLOGY
-----------
• Feature extraction using pattern matching and NLP
• Sentiment analysis based on contextual word analysis
• Rating correlation with feature mentions
• Statistical aggregation across all reviews
"""
    
    # Save report to file
    with open('feature_analysis_report.txt', 'w') as f:
        f.write(report)
    
    print("📄 Report saved as 'feature_analysis_report.txt'")
    print("\n" + "="*50)
    print(report)

# Example usage
if __name__ == "__main__":
    # Example with sample data
    print("🚀 Product Feature Extractor - Python Analysis Module")
    print("This script provides advanced feature analysis capabilities.")
    print("\nTo use this script:")
    print("1. Save your review data as a CSV file")
    print("2. Ensure it has columns like 'review', 'text', or 'comment' for review text")
    print("3. Optionally include 'rating' or 'score' columns")
    print("4. Run: analyze_product_features('your_file.csv')")
    
    # Create sample data for demonstration
    sample_data = {
        'review': [
            "Great camera quality and excellent battery life. Love the design!",
            "Poor audio quality but good screen display. Price is reasonable.",
            "Amazing performance and fast charging. Camera could be better.",
            "Terrible battery life and slow performance. Good build quality though.",
            "Perfect size and weight. Great value for money. Audio is fantastic!"
        ],
        'rating': [5, 3, 4, 2, 5]
    }
    
    sample_df = pd.DataFrame(sample_data)
    sample_df.to_csv('sample_reviews.csv', index=False)
    
    print("\n📝 Created sample data file: 'sample_reviews.csv'")
    print("Run the analysis with: analyze_product_features('sample_reviews.csv')")
