import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

const BlogSection = () => {
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLatestArticles();
    }, []);

    const loadLatestArticles = async () => {
        try {
            const { data, error } = await supabase
                .from('articles')
                .select(`
          id,
          slug,
          headline,
          meta_description,
          image,
          reading_time,
          published_at,
          categories (id, title, slug)
        `)
                .eq('published', true)
                .eq('deleted', false)
                .order('published_at', { ascending: false })
                .limit(3);

            if (error) throw error;
            setArticles(data || []);
        } catch (err) {
            console.error('Failed to load articles:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading || articles.length === 0) {
        return null;
    }

    return (
        <section className="py-20 bg-gradient-to-b from-black to-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Latest from Our Blog
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Insights, tips, and strategies for building better backlinks and improving your SEO
                    </p>
                </div>

                {/* Articles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {articles.map((article) => (
                        <Link
                            key={article.id}
                            to={`/blog/${article.slug}`}
                            className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-orange-500 transition-all group"
                        >
                            {article.image && (
                                <div className="aspect-video overflow-hidden">
                                    <img
                                        src={article.image}
                                        alt={article.headline}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            )}
                            <div className="p-6">
                                {article.categories && (
                                    <div className="mb-3">
                                        <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium">
                                            {article.categories.title}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(article.published_at)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {article.reading_time} min
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-500 transition-colors line-clamp-2">
                                    {article.headline}
                                </h3>
                                {article.meta_description && (
                                    <p className="text-gray-400 line-clamp-3 mb-4">
                                        {article.meta_description}
                                    </p>
                                )}
                                <div className="flex items-center text-orange-500 font-medium">
                                    Read more
                                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* View All Button */}
                <div className="text-center">
                    <Link
                        to="/blog"
                        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                    >
                        View All Articles
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default BlogSection;
