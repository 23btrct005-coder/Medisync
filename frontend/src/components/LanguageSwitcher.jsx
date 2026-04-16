import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const nextLang = i18n.language === 'en' ? 'es' : 'en';
        i18n.changeLanguage(nextLang);
    };

    return (
        <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white/50 hover:bg-slate-100 text-slate-500 hover:text-primary-600 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:text-primary-400 font-bold uppercase text-[10px]"
            title="Toggle Language (EN/ES)"
        >
            <Globe size={20} />
            <span className="hidden sm:inline">{i18n.language}</span>
        </button>
    );
};

export default LanguageSwitcher;
