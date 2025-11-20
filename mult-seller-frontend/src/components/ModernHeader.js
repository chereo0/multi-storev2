import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Logo from "./Logo";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Header = () => {
  const { user, logout } = useAuth();
  const { getCartItemsCount } = useCart();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const headerRef = useRef(null);

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    navigate("/home");
  };

  // Theme is managed by ThemeContext now; keep header visuals local only

  // GSAP: Header slide down on load and hide/show on scroll
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { y: -80, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out" }
    );

    let lastScroll = 0;
    const onScroll = () => {
      const current = window.pageYOffset || document.documentElement.scrollTop;
      if (current > lastScroll && current > 100) {
        // scrolling down -> hide
        gsap.to(el, { y: -90, autoAlpha: 0, duration: 0.4, ease: "power2.in" });
      } else {
        // scrolling up -> show
        gsap.to(el, { y: 0, autoAlpha: 1, duration: 0.4, ease: "power2.out" });
      }
      lastScroll = current <= 0 ? 0 : current;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navigationLinks = [
    { name: "Home", href: "/home" },
    { name: "Snoes", href: "/categories" },
    { name: "Hont", href: "/stores" },
    { name: "Aclumt", href: "/about" },
  ];

  return (
    <>
      {/* Fixed Navigation Bar */}
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
          theme === "dark"
            ? "bg-[#071026] border-b border-gray-800 shadow-2xl"
            : "bg-white shadow-sm border-b border-gray-200"
        }`}
      >
        <div className="px-8 lg:px-16 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Logo className="h-10" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-gray-700 font-medium text-base hover:text-cyan-500 transition-colors duration-300"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              🛒 Cart ({getCartItemsCount()})
            </Link>

            {/* Auth Buttons */}
            {user && !user.isGuest ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">
                  Hello, {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-cyan-500 transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-700 hover:text-cyan-500 transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:text-cyan-500 transition-colors duration-200"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Theme toggle removed per request */}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-8 py-4 space-y-4">
              {navigationLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="block text-gray-700 hover:text-cyan-500 font-medium transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Spacer to prevent content from hiding behind fixed header */}
      <div className="h-20"></div>
    </>
  );
};

export default Header;
