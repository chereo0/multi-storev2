import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCategoryBySlug, getStoresByCategory } from '../api/services';
import StoreCard from '../components/StoreCard';

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl shadow overflow-hidden animate-pulse">
    <div className="w-full h-40 bg-gray-200" />
    <div className="p-4">
      <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
    </div>
  </div>
);

const CategoryPage = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    (async () => {
      const catRes = await getCategoryBySlug(slug);
      if (!mounted) return;
      if (!catRes.success || !catRes.data) {
        setError('Category not found');
        setLoading(false);
        return;
      }
      setCategory(catRes.data);
      const storesRes = await getStoresByCategory(slug);
      if (!mounted) return;
      setStores(storesRes.success ? storesRes.data : []);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [slug]);

  const bannerImage = useMemo(() => category?.image, [category]);

  return (
    <div className="min-h-screen bg-background text-text">
      {/* Banner */}
      <div className="relative">
        {bannerImage ? (
          <img src={bannerImage} alt={category?.name || 'Category'} className="w-full h-56 object-cover" />
        ) : (
          <div className="w-full h-56 bg-primary" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow">
            {category?.icon && <span className="mr-2">{category.icon}</span>}
            {category?.name || 'Category'}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <div className="text-sm text-muted mb-6">
          <Link to="/home" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-text">{category?.name || 'Category'}</span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">{error}</div>
        )}

        {/* Stores Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <>
            {stores.length === 0 ? (
              <div className="text-muted">No stores found in this category.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map((s) => (
                  <StoreCard key={s.id} store={s} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;



