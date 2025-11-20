import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { cancelOrder, getCustomerOrderById } from '../../api/services';
import toast from 'react-hot-toast';

const OrderDetailPage = () => {
  const { id } = useParams();
  const { isDarkMode } = useTheme();
  const { isGuest } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const previousStatusRef = useRef(null);

  const fetchOrderDetails = async () => {
    const res = await getCustomerOrderById(id);
    if (res.success) {
      const fetchedOrder = res.data;
      const currentStatus = fetchedOrder.status || fetchedOrder.order_status || '';
      
      // Check if status changed
      if (previousStatusRef.current && previousStatusRef.current !== currentStatus) {
        toast.success(`Order status changed to: ${currentStatus}`, {
          duration: 5000,
          icon: '📦',
        });
      }
      
      previousStatusRef.current = currentStatus;
      setOrder(fetchedOrder);
      
      // Check if order is cancelled - redirect to orders page
      const statusLower = currentStatus.toLowerCase();
      if (['cancelled', 'canceled', 'void'].includes(statusLower)) {
        toast.info('This order has been cancelled', {
          duration: 3000,
        });
        setTimeout(() => {
          navigate('/orders');
        }, 2000);
      }
    } else {
      setError(res.error || 'Failed to load order');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isGuest) {
      navigate('/login');
      return;
    }
    
    fetchOrderDetails();
    
    // Poll for order updates every 30 seconds
    const intervalId = setInterval(fetchOrderDetails, 30000);
    
    return () => clearInterval(intervalId);
  }, [id, isGuest, navigate]);

  const onCancel = async () => {
    if (!order) return;
    if (!window.confirm('Cancel this order?')) return;
    setCanceling(true);
    const res = await cancelOrder(order.id || order.order_id || id);
    if (res.success) {
      toast.success('Order cancelled successfully', {
        duration: 3000,
      });
      // Redirect to orders page after cancellation
      setTimeout(() => {
        navigate('/orders');
      }, 1500);
    } else {
      toast.error(res.error || 'Failed to cancel order');
    }
    setCanceling(false);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : ''}`}>
      <div className="h-16" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Order Details</h1>

        <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800/70 border border-gray-700' : 'bg-white border border-gray-200 shadow'} `}>
          {loading ? (
            <div className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Loading...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : !order ? (
            <div className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Order not found</div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-6">
                <div>
                  <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>Order ID</div>
                  <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-semibold`}>{order.id || order.order_id || id}</div>
                </div>
                <div>
                  <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>Status</div>
                  <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-semibold`}>{order.status || order.order_status || '—'}</div>
                </div>
                <div>
                  <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>Total</div>
                  <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-semibold`}>{order.total || order.total_formatted || order.total_price || '—'}</div>
                </div>
              </div>

              <div>
                <h2 className={`${isDarkMode ? 'text-white' : 'text-gray-900'} text-xl font-semibold mb-2`}>Items</h2>
                <div className="space-y-3">
                  {(order.products || order.items || []).map((p, idx) => (
                    <div key={(p.product_id || p.id || idx) + ''} className={`flex justify-between items-center rounded-lg p-3 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div>
                        <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{p.name}</div>
                        <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>Qty: {p.quantity || p.qty}</div>
                      </div>
                      <div className={`${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>{p.total || p.price_total || p.price}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/orders')}
                  className={`px-4 py-3 rounded-lg font-semibold ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}
                >
                  Back to Orders
                </button>
                {(order.cancelable || ['pending','processing'].includes((order.status || '').toLowerCase())) && (
                  <button
                    onClick={onCancel}
                    disabled={canceling}
                    className={`px-4 py-3 rounded-lg font-semibold ${canceling ? 'bg-gray-400' : (isDarkMode ? 'bg-red-600/80 text-white' : 'bg-red-600 text-white')}`}
                  >
                    {canceling ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
