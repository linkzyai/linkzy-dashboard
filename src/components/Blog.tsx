import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, Clock, Tag as TagIcon, Folder } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { createClient } from '@supabase/supabase-js';
import Header from './Header';
import Footer from './Footer';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Article {
    id: string;
    slug: string;
    headline: string;
    meta_description: string | null;
    image: string | null;
    reading_time: number;
    published_at: string;
    categories: { id: string; title: string; slug: string } | null;
    article_tags: Array<{ tags: { id: string; title: string; slug: string } }>;
}

const Blog = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [articles, setArticles] = useState<Article[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const selectedCategory = searchParams.get('category');
    const selectedTag = searchParams.get('tag');

    useEffect(() => {
        loadArticles();
        loadFilters();
    }, [selectedCategory, selectedTag]);

    const loadArticles = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('articles')
                .select(`
          id,
          slug,
          headline,
          meta_description,
          image,
          reading_time,
          published_at,
          categories (id, title, slug),
          article_tags (
            tags (id, title, slug)
          )
        `)
                .eq('published', true)
                .eq('deleted', false)
                .order('published_at', { ascending: false });

            if (selectedCategory) {
                query = query.eq('categories.slug', selectedCategory);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            // Filter by tag if selected
            let filteredData = data || [];
            if (selectedTag) {
                filteredData = filteredData.filter((article) =>
                    article.article_tags.some((at: any) => at.tags.slug === selectedTag)
                );
            }

            setArticles(filteredData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadFilters = async () => {
        try {
            const [categoriesRes, tagsRes] = await Promise.all([
                supabase.from('categories').select('*').order('title'),
                supabase.from('tags').select('*').order('title'),
            ]);

            if (categoriesRes.data) setCategories(categoriesRes.data);
            if (tagsRes.data) setTags(tagsRes.data);
        } catch (err) {
            console.error('Failed to load filters:', err);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleFilterChange = (type: 'category' | 'tag', value: string | null) => {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set(type, value);
        } else {
            params.delete(type);
        }
        setSearchParams(params);
    };

    return (
        <>
            <Helmet>
                <title>Blog - Linkzy | SEO & Backlink Insights</title>
                <meta name="description" content="Read the latest articles about SEO, backlinks, and digital marketing from Linkzy." />
            </Helmet>

            <Header />
            <div className="min-h-screen bg-black">
                {/* Header */}
                <div className="bg-gradient-to-br from-orange-900/20 via-black to-black border-b border-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Linkzy Blog
                        </h1>
                        <p className="text-xl text-gray-300 max-w-2xl">
                            Insights, tips, and strategies for building better backlinks and improving your SEO
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-gray-900 border-b border-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        {/* Categories */}
                        {categories.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Folder className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-400">Categories:</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => handleFilterChange('category', null)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedCategory
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                            }`}
                                    >
                                        All
                                    </button>
                                    {categories.map((category) => (
                                        <button
                                            key={category.id}
                                            onClick={() => handleFilterChange('category', category.slug)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === category.slug
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                }`}
                                        >
                                            {category.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        {tags.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <TagIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-400">Tags:</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => handleFilterChange('tag', null)}
                                        className={`px-3 py-1 rounded-full text-sm transition-colors ${!selectedTag
                                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                            }`}
                                    >
                                        All
                                    </button>
                                    {tags.map((tag) => (
                                        <button
                                            key={tag.id}
                                            onClick={() => handleFilterChange('tag', tag.slug)}
                                            className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedTag === tag.slug
                                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                }`}
                                        >
                                            {tag.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-gray-400">Loading articles...</div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                            Error: {error}
                        </div>
                    ) : articles.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-gray-400 text-lg">No articles found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium">
                                                    <Folder className="w-3 h-3" />
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
                                        <h2 className="text-xl font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">
                                            {article.headline}
                                        </h2>
                                        {article.meta_description && (
                                            <p className="text-gray-400 mb-4 line-clamp-3">
                                                {article.meta_description}
                                            </p>
                                        )}
                                        {article.article_tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {article.article_tags.slice(0, 3).map((at) => (
                                                    <span
                                                        key={at.tags.id}
                                                        className="px-2 py-1 bg-gray-800 text-gray-400 rounded text-xs"
                                                    >
                                                        {at.tags.title}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default Blog;
