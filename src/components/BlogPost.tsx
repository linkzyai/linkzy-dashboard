import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Tag as TagIcon, Folder, Share2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { createClient } from '@supabase/supabase-js';
import { IArticle } from '../types/blog';
import Header from './Header';
import Footer from './Footer';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

const BlogPost = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [article, setArticle] = useState<any>(null);
    const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (slug) {
            loadArticle();
        }
    }, [slug]);

    const loadArticle = async () => {
        try {
            setLoading(true);

            // Fetch article with all relationships
            const { data, error: fetchError } = await supabase
                .from('articles')
                .select(`
          *,
          categories (id, title, slug),
          article_tags (
            tags (id, title, slug)
          ),
          article_related_posts!article_related_posts_article_id_fkey (
            related_article:articles!article_related_posts_related_article_id_fkey (
              id,
              headline,
              slug,
              image,
              reading_time,
              published_at
            )
          )
        `)
                .eq('slug', slug)
                .eq('published', true)
                .eq('deleted', false)
                .single();

            if (fetchError) throw fetchError;

            setArticle(data);

            // Extract related articles
            if (data.article_related_posts) {
                const related = data.article_related_posts
                    .map((rp: any) => rp.related_article)
                    .filter((ra: any) => ra !== null);
                setRelatedArticles(related);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const shareArticle = () => {
        if (navigator.share) {
            navigator.share({
                title: article?.headline,
                text: article?.meta_description || '',
                url: window.location.href,
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-gray-400">Loading article...</div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="max-w-2xl mx-auto px-4 text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Article Not Found</h1>
                    <p className="text-gray-400 mb-6">{error || 'The article you are looking for does not exist.'}</p>
                    <Link
                        to="/blog"
                        className="inline-flex items-center text-orange-500 hover:text-orange-400 font-medium"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Blog
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>{article.meta_title || article.headline} - Linkzy Blog</title>
                <meta name="description" content={article.meta_description || article.headline} />
                <meta name="keywords" content={article.meta_keywords || ''} />

                {/* Open Graph */}
                <meta property="og:title" content={article.headline} />
                <meta property="og:description" content={article.meta_description || ''} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={window.location.href} />
                {article.image && <meta property="og:image" content={article.image} />}

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={article.headline} />
                <meta name="twitter:description" content={article.meta_description || ''} />
                {article.image && <meta name="twitter:image" content={article.image} />}
            </Helmet>

            <Header />
            <div className="min-h-screen bg-black">
                {/* Back Button */}
                <div className="bg-gray-900 border-b border-gray-800">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <Link
                            to="/blog"
                            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Blog
                        </Link>
                    </div>
                </div>

                {/* Article */}
                <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Featured Image */}
                    {article.image && (
                        <div className="aspect-video rounded-xl overflow-hidden mb-8">
                            <img
                                src={article.image}
                                alt={article.headline}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Header */}
                    <header className="mb-8">
                        {/* Category */}
                        {article.categories && (
                            <div className="mb-4">
                                <Link
                                    to={`/blog?category=${article.categories.slug}`}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium hover:bg-orange-500/30 transition-colors"
                                >
                                    <Folder className="w-3 h-3" />
                                    {article.categories.title}
                                </Link>
                            </div>
                        )}

                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            {article.headline}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-6">
                            <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {formatDate(article.published_at)}
                            </span>
                            <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {article.reading_time} min read
                            </span>
                            <button
                                onClick={shareArticle}
                                className="flex items-center gap-2 hover:text-white transition-colors"
                            >
                                <Share2 className="w-4 h-4" />
                                Share
                            </button>
                        </div>

                        {/* Tags */}
                        {article.article_tags && article.article_tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                {article.article_tags.map((at: any) => (
                                    <Link
                                        key={at.tags.id}
                                        to={`/blog?tag=${at.tags.slug}`}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm hover:bg-gray-700 transition-colors"
                                    >
                                        <TagIcon className="w-3 h-3" />
                                        {at.tags.title}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </header>

                    {/* Content */}
                    <div
                        className="prose prose-invert prose-orange max-w-none
              prose-headings:text-white prose-headings:font-bold
              prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4
              prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-orange-500 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white prose-strong:font-semibold
              prose-ul:text-gray-300 prose-ol:text-gray-300
              prose-li:mb-2
              prose-code:text-orange-400 prose-code:bg-gray-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800
              prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-400
              prose-img:rounded-lg prose-img:my-8"
                        dangerouslySetInnerHTML={{ __html: article.html || article.markdown || '' }}
                    />
                </article>

                {/* Related Posts */}
                {relatedArticles.length > 0 && (
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-800">
                        <h2 className="text-2xl font-bold text-white mb-6">Related Articles</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {relatedArticles.map((related) => (
                                <Link
                                    key={related.id}
                                    to={`/blog/${related.slug}`}
                                    className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-orange-500 transition-all group"
                                >
                                    {related.image && (
                                        <div className="aspect-video overflow-hidden">
                                            <img
                                                src={related.image}
                                                alt={related.headline}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    )}
                                    <div className="p-4">
                                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">
                                            {related.headline}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(related.published_at)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {related.reading_time} min
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
};

export default BlogPost;
