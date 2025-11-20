import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Section = ({ id, title, children, isDarkMode }) => (
  <section id={id} className={`rounded-2xl p-6 md:p-8 mb-8 transition-colors ${
    isDarkMode
      ? 'bg-gray-800/70 border border-gray-700'
      : 'bg-white border border-gray-200 shadow'
  }`}>
    <h2 className={`text-2xl md:text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
    <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed space-y-4`}>{children}</div>
  </section>
);

const ServicesPage = () => {
  const { isDarkMode } = useTheme();
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : ''}`}>
      <div className="h-16" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex items-center justify-between gap-3">
          <h1 className={`text-3xl md:text-4xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Services & Policies</h1>
          <nav className="hidden md:flex gap-2">
            <a href="#privacy" className={`px-3 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'text-cyan-300 bg-cyan-500/10' : 'text-cyan-700 bg-cyan-100'}`}>Privacy Policy</a>
            <a href="#terms" className={`px-3 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'text-purple-300 bg-purple-500/10' : 'text-purple-700 bg-purple-100'}`}>Terms & Conditions</a>
          </nav>
        </div>

        <Section id="privacy" title="Privacy Policy" isDarkMode={isDarkMode}>
          <p>
            We value your privacy. This policy explains what information we collect, how we use it, and the choices you have.
          </p>
          <ul className="list-disc pl-6">
            <li>Information you provide: account details, addresses, and order data.</li>
            <li>Usage data: pages visited, interactions, device and browser metadata.</li>
            <li>How we use data: to fulfill orders, improve services, and provide support.</li>
            <li>Sharing: only with necessary providers (e.g., payments, shipping) and as required by law.</li>
          </ul>
          <p>
            For data requests or questions, contact our support at <span className="underline">support@example.com</span>.
          </p>
        </Section>

        <Section id="terms" title="Terms & Conditions" isDarkMode={isDarkMode}>
          <p>
            By using our site, you agree to the terms below. Please read them carefully.
          </p>
          <ul className="list-disc pl-6">
            <li>Accounts: Keep your credentials secure and accurate.</li>
            <li>Orders: We may verify or cancel orders per availability or policy.</li>
            <li>Payments & Pricing: Taxes and shipping calculated at checkout; pricing subject to change.</li>
            <li>Returns: Refer to store-specific policies where applicable.</li>
            <li>Prohibited use: No unlawful or abusive activity.</li>
          </ul>
          <p>
            These terms may change over time. Continued use constitutes acceptance of updated terms.
          </p>
        </Section>

        <div className="flex justify-end">
          <Link to="/home" className={`px-5 py-3 rounded-lg font-semibold ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} hover:opacity-90`}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
