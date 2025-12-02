import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { sendContact } from '../api/services';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { isDarkMode } = useTheme();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      };

      const result = await sendContact(payload);
      if (result.success) {
        setIsSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
        toast.success('Message sent! We will contact you soon.');
      } else {
        toast.error(result.error || 'Failed to send message.');
      }
    } catch (err) {
      console.error('Contact submit error:', err);
      toast.error('An error occurred while sending your message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : ''
      }`}
      style={!isDarkMode ? {
        backgroundImage: 'url(/white%20backgroud.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      } : {}}
    >
      {/* Spacer for fixed navbar */}
      <div className="h-16"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className={`text-4xl font-bold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Contact Us
          </h1>
          <div className={`w-24 h-1 mx-auto rounded-full ${
            isDarkMode ? 'bg-gradient-to-r from-cyan-400 to-purple-500' : 'bg-gradient-to-r from-cyan-500 to-purple-600'
          }`}></div>
          <p className={`text-lg mt-6 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Get in touch with our quantum support team
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className={`rounded-2xl p-8 backdrop-blur-md transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gray-800/50 border border-cyan-400/30 shadow-2xl shadow-cyan-400/10' 
              : 'bg-white/80 border border-gray-200 shadow-xl'
          }`}>
            <h2 className={`text-2xl font-bold mb-6 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Get in Touch
            </h2>
            
            <div className="space-y-6">
              {[
                {
                  icon: '📧',
                  title: 'Email',
                  content: 'multistore@gmail.com',
                  description: 'Send us an email and we\'ll respond within 24 hours'
                },
                {
                  icon: '📞',
                  title: 'Phone',
                  content: '+961 81 235 302',
                  description: 'Call us during business hours (9 AM - 6 PM EST)'
                },
                {
                  icon: '💬',
                  title: 'Live Chat',
                  content: 'Available 24/7',
                  description: 'Chat with our quantum support team instantly'
                },
                {
                  icon: '🌍',
                  title: 'Address',
                  content: 'MultiStore Headquarters',
                  description: 'Tripoli, Lebanon'
                }
              ].map((contact, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'
                  }`}>
                    {contact.icon}
                  </div>
                  <div>
                    <h3 className={`font-bold mb-1 transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {contact.title}
                    </h3>
                    <p className={`font-medium mb-1 transition-colors duration-300 ${
                      isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
                    }`}>
                      {contact.content}
                    </p>
                    <p className={`text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {contact.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div className={`rounded-2xl p-8 backdrop-blur-md transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gray-800/50 border border-cyan-400/30 shadow-2xl shadow-cyan-400/10' 
              : 'bg-white/80 border border-gray-200 shadow-xl'
          }`}>
            <h2 className={`text-2xl font-bold mb-6 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Send us a Message
            </h2>

            {isSubmitted ? (
              <div className="text-center py-8">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-green-500/20 border border-green-400' : 'bg-green-100'
                }`}>
                  <svg className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Message Sent!
                </h3>
                <p className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Thank you for contacting us. We'll get back to you soon.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className={`mt-4 px-6 py-2 rounded-full font-medium transition-all duration-300 hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' 
                      : 'bg-cyan-100 text-cyan-600 hover:bg-cyan-200'
                  }`}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20' 
                        : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20'
                    } focus:outline-none focus:ring-2`}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20' 
                        : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20'
                    } focus:outline-none focus:ring-2`}
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20' 
                        : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20'
                    } focus:outline-none focus:ring-2`}
                    placeholder="What's this about?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg transition-all duration-300 resize-none ${
                      isDarkMode 
                        ? 'bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20' 
                        : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20'
                    } focus:outline-none focus:ring-2`}
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white shadow-lg shadow-cyan-400/25' 
                      : 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg'
                  }`}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;


