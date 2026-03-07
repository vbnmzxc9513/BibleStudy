import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, Save, Cpu, X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import './AISettingsModal.css';

interface AISettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AISettingsModal: React.FC<AISettingsModalProps> = ({ isOpen, onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [aiModel, setAiModel] = useState('gemini-2.5-flash');
    const [isSaved, setIsSaved] = useState(false);
    const [fetchedModels, setFetchedModels] = useState<{ id: string, name: string }[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [fetchStatus, setFetchStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const { t } = useLanguage();

    useEffect(() => {
        if (isOpen) {
            const savedKey = localStorage.getItem('ai_api_key');
            if (savedKey) setApiKey(savedKey);

            const savedModel = localStorage.getItem('ai_model');
            if (savedModel) setAiModel(savedModel);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSaveKey = () => {
        localStorage.setItem('ai_api_key', apiKey);
        localStorage.setItem('ai_model', aiModel);
        setIsSaved(true);
        setTimeout(() => {
            setIsSaved(false);
            onClose(); // Auto close on save success
        }, 1000);
    };

    const handleFetchModels = async () => {
        if (!apiKey.trim()) return;
        setIsFetching(true);
        setFetchStatus('idle');
        try {
            let models: { id: string, name: string }[] = [];
            if (apiKey.startsWith('sk-')) {
                // OpenAI API
                const res = await fetch('https://api.openai.com/v1/models', {
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                });
                if (!res.ok) throw new Error('Invalid OpenAI Key');
                const data = await res.json();
                models = data.data
                    .filter((m: any) => m.id.startsWith('gpt-'))
                    .map((m: any) => ({ id: m.id, name: m.id }))
                    .sort((a: any, b: any) => a.name.localeCompare(b.name));
            } else {
                // Gemini API
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                if (!res.ok) throw new Error('Invalid Gemini Key');
                const data = await res.json();
                models = data.models
                    .filter((m: any) => m.name.includes('gemini') && m.supportedGenerationMethods.includes('generateContent'))
                    .map((m: any) => ({ id: m.name.replace('models/', ''), name: m.displayName || m.name }))
                    .sort((a: any, b: any) => a.name.localeCompare(b.name));
            }

            setFetchedModels(models);
            setFetchStatus('success');
            if (models.length > 0 && !models.find(m => m.id === aiModel)) {
                setAiModel(models[0].id);
            }
        } catch (error) {
            console.error(error);
            setFetchStatus('error');
            setFetchedModels([]);
        } finally {
            setIsFetching(false);
        }
    };

    const defaultModels = [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'gpt-4o', name: 'GPT-4o' }
    ];

    const displayModels = fetchedModels.length > 0 ? fetchedModels : defaultModels;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose} aria-label="Close">
                    <X size={24} />
                </button>

                <div className="section-title">
                    <ShieldCheck size={24} className="icon-success" />
                    <h3>{t('aiSettingsTitle')}</h3>
                </div>

                <p className="settings-desc">
                    {t('settingsDesc')}
                </p>

                <div className="flex gap-2 mb-4">
                    <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary text-center flex items-center justify-center p-2 flex-1"
                        style={{ fontSize: '0.85rem' }}
                    >
                        <span>{t('getApiKey')}</span>
                    </a>
                    <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary text-center flex items-center justify-center p-2 flex-1"
                        style={{ fontSize: '0.85rem' }}
                    >
                        <span>{t('getGeminiApiKey')}</span>
                    </a>
                </div>

                <div className="input-group">
                    <label htmlFor="modalApiKey">{t('openAiKey')}</label>
                    <div className="flex gap-2">
                        <div className="input-wrapper flex-1">
                            <Key size={18} className="input-icon" />
                            <input
                                type="password"
                                id="modalApiKey"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-..."
                                className="text-input"
                            />
                        </div>
                        <button
                            className="btn btn-secondary flex items-center justify-center p-2"
                            style={{ padding: '0 1rem', flexShrink: 0 }}
                            onClick={handleFetchModels}
                            disabled={isFetching || !apiKey.trim()}
                            title={t('fetchModelsBtn')}
                        >
                            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
                            <span className="hidden sm:inline-block ml-2 text-sm whitespace-nowrap">{t('fetchModelsBtn')}</span>
                        </button>
                    </div>
                    {fetchStatus === 'success' && <p className="text-sm mt-2 flex items-center gap-1" style={{ color: '#10b981' }}><CheckCircle size={14} /> {t('fetchModelsSuccess')}</p>}
                    {fetchStatus === 'error' && <p className="text-sm mt-2 flex items-center gap-1" style={{ color: '#ef4444' }}><AlertCircle size={14} /> {t('fetchModelsError')}</p>}
                </div>

                <div className="input-group mt-4">
                    <label htmlFor="modalAiModel">{t('aiModel')}</label>
                    <div className="input-wrapper">
                        <Cpu size={18} className="input-icon" />
                        <select
                            id="modalAiModel"
                            value={aiModel}
                            onChange={(e) => setAiModel(e.target.value)}
                            className="text-input"
                            style={{ appearance: 'none' }}
                        >
                            {displayModels.map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    className="btn btn-primary w-full mt-6"
                    onClick={handleSaveKey}
                    disabled={!apiKey.trim()}
                >
                    <Save size={18} />
                    <span>{isSaved ? t('savedLocally') : t('saveKey')}</span>
                </button>
            </div>
        </div>
    );
};

export default AISettingsModal;
