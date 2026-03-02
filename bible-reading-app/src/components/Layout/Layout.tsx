import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, User, Settings, Languages, Book } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import './Layout.css';

const Layout = () => {
    const { t, toggleLanguage, language } = useLanguage();
    const navigate = useNavigate();

    const navItems = [
        { path: '/', label: t('home'), icon: <Home size={24} /> },
        { path: '/books', label: t('bible'), icon: <BookOpen size={24} /> },
        { path: '/profile', label: t('profile'), icon: <User size={24} /> },
    ];

    return (
        <div className="app-container">
            {/* Desktop Sidebar Navigation */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="brand-group cursor-pointer" onClick={() => navigate('/')}>
                        <Book className="brand-icon" size={32} />
                        <h1 className="brand-title">Bible Study</h1>
                    </div>
                    <button className="lang-toggle-btn" onClick={toggleLanguage} title="Switch Language">
                        <Languages size={20} />
                        <span className="lang-text">{language === 'zh_TW' ? 'EN' : '中'}</span>
                    </button>
                </div>

                <nav className="desktop-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="btn btn-secondary w-full" onClick={() => {/* Open Settings Mode */ }}>
                        <Settings size={20} />
                        <span>{t('aiSettings')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Context Area */}
            <main className="main-content">
                <div className="mobile-brand">
                    <h2>Bible Study</h2>
                </div>
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="mobile-nav">
                <button className="mobile-lang-btn" onClick={toggleLanguage}>
                    <Languages size={24} />
                    <span>{language === 'zh_TW' ? 'EN' : '中'}</span>
                </button>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                    >
                        {React.cloneElement(item.icon, { size: 28 })}
                        <span className="mobile-nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

export default Layout;
