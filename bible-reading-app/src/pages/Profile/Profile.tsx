import { User as UserIcon, LogOut } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { loginWithGoogle, logout } from '../../firebase';
import './Profile.css';

const Profile = () => {
    const { t } = useLanguage();
    const { user, loading } = useAuth();

    // Safely extract display name
    let finalDisplayName = t('guestUser');
    if (user) {
        const googleProvider = user.providerData?.find(p => p.providerId === 'google.com');
        finalDisplayName = user.displayName || googleProvider?.displayName || 'Google User';
    }

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
            // page will redirect to Google; result handled in AuthContext on return
        } catch (error: any) {
            console.error("Failed to initiate Google login:", error);
            alert(`Google 登入失敗 / Google Login Failed: ${error.message || error}`);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error: any) {
            console.error("Failed to logout:", error);
            alert(`登出失敗 / Logout Failed: ${error.message || error}`);
        }
    };

    return (
        <div className="profile-container animate-fade-in-up">
            <header className="page-header">
                <h2>{t('yourProfile')}</h2>
            </header>

            <section className="profile-card glass-card">
                <div className="profile-avatar">
                    <UserIcon size={48} className="text-muted" />
                </div>
                <div className="profile-info">
                    <h3>{loading ? 'Loading...' : finalDisplayName}</h3>
                    <p className="text-muted">{user ? t('linkedGoogleAccount') : t('anonymousAccount')}</p>
                </div>
                {!user ? (
                    <button className="btn w-full flex justify-center items-center gap-2 mt-4" onClick={handleGoogleLogin} style={{ backgroundColor: 'white', color: '#757575', border: '1px solid #ddd' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25C22.56 11.47 22.49 10.73 22.36 10.03H12V14.23H17.93C17.67 15.58 16.92 16.74 15.78 17.51V20.24H19.34C21.43 18.32 22.56 15.54 22.56 12.25Z" fill="#4285F4" />
                            <path d="M12 23C14.97 23 17.46 22.02 19.34 20.24L15.78 17.51C14.77 18.19 13.49 18.6 12 18.6C9.1 18.6 6.64 16.64 5.76 14.02H2.07v2.86A10.975 10.975 0 0 0 12 23Z" fill="#34A853" />
                            <path d="M5.76 14.02C5.53 13.34 5.4 12.63 5.4 11.9C5.4 11.17 5.53 10.46 5.76 9.78V6.92H2.07a10.97 10.97 0 0 0 0 9.96l3.69-2.86Z" fill="#FBBC05" />
                            <path d="M12 5.2C13.62 5.2 15.06 5.76 16.2 6.84L19.42 3.62C17.46 1.8 14.97 0.8 12 0.8C7.14 0.8 2.94 3.68 0.84 7.92L4.53 10.78C5.41 8.16 7.87 6.2 10.76 6.2H12Z" fill="#EA4335" />
                        </svg>
                        <span className="font-medium">{t('signInGoogle')}</span>
                    </button>
                ) : (
                    <button className="btn w-full flex justify-center items-center gap-2 mt-4" onClick={handleLogout} style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5' }}>
                        <LogOut size={18} />
                        <span className="font-medium">登出 / Logout</span>
                    </button>
                )}
            </section>
        </div>
    );
};

export default Profile;
