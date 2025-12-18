import { useState } from 'react';
import { useSettingsStore, PROVIDERS } from '../stores/settings';

export default function SettingsPage() {
  const { apiKeys, activeProvider, setApiKey, setActiveProvider, removeApiKey } = useSettingsStore();

  return (
    <div className="max-w-2xl space-y-8">
      <section>
        <h3 className="text-lg font-semibold text-white mb-4">API Configuration</h3>
        <p className="text-gray-400 text-sm mb-6">
          Configure your API keys for stock data providers. Your keys are stored locally in your browser
          and are never sent to our servers.
        </p>

        <div className="space-y-4">
          {PROVIDERS.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              apiKey={apiKeys[provider.id]}
              isActive={activeProvider === provider.id}
              onSetApiKey={(key) => setApiKey(provider.id, key)}
              onSetActive={() => setActiveProvider(provider.id)}
              onRemove={() => removeApiKey(provider.id)}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-4">Storage</h3>
        <StorageStatus />
      </section>
    </div>
  );
}

interface ProviderCardProps {
  provider: (typeof PROVIDERS)[number];
  apiKey?: string;
  isActive: boolean;
  onSetApiKey: (key: string) => void;
  onSetActive: () => void;
  onRemove: () => void;
}

function ProviderCard({ provider, apiKey, isActive, onSetApiKey, onSetActive, onRemove }: ProviderCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(apiKey || '');
  const hasKey = Boolean(apiKey);

  const handleSave = () => {
    if (inputValue.trim()) {
      onSetApiKey(inputValue.trim());
      setIsEditing(false);
    }
  };

  return (
    <div className={`card ${isActive ? 'ring-2 ring-accent' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-white flex items-center gap-2">
            {provider.name}
            {isActive && (
              <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded">Active</span>
            )}
          </h4>
          <p className="text-sm text-gray-400">{provider.description}</p>
          <p className="text-xs text-gray-500 mt-1">Rate limit: {provider.rateLimit}</p>
        </div>
        <a
          href={provider.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-accent hover:text-accent-hover"
        >
          Get API Key
        </a>
      </div>

      {isEditing ? (
        <div className="flex gap-2">
          <input
            type="password"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter your API key"
            className="input flex-1"
            autoFocus
          />
          <button onClick={handleSave} className="btn-primary">
            Save
          </button>
          <button onClick={() => setIsEditing(false)} className="btn-secondary">
            Cancel
          </button>
        </div>
      ) : hasKey ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-green-500">
              <CheckIcon className="w-4 h-4" />
            </span>
            <span className="text-sm text-gray-300">API key configured</span>
            <span className="text-xs text-gray-500 font-mono">
              ••••••••{apiKey?.slice(-4)}
            </span>
          </div>
          <div className="flex gap-2">
            {!isActive && (
              <button onClick={onSetActive} className="btn-secondary text-sm py-1">
                Set Active
              </button>
            )}
            <button onClick={() => setIsEditing(true)} className="btn-secondary text-sm py-1">
              Edit
            </button>
            <button onClick={onRemove} className="btn-secondary text-sm py-1 text-loss hover:text-loss-light">
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsEditing(true)} className="btn-secondary w-full">
          Add API Key
        </button>
      )}
    </div>
  );
}

function StorageStatus() {
  const [status, setStatus] = useState<{
    persisted: boolean;
    usedMB: string;
    quotaMB: string;
    percentUsed: string;
  } | null>(null);

  const checkStorage = async () => {
    if (navigator.storage && navigator.storage.estimate) {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      const persisted = await navigator.storage.persisted?.() ?? false;
      setStatus({
        persisted,
        usedMB: (usage / 1024 / 1024).toFixed(2),
        quotaMB: (quota / 1024 / 1024).toFixed(2),
        percentUsed: ((usage / quota) * 100).toFixed(1),
      });
    }
  };

  const requestPersistence = async () => {
    if (navigator.storage && navigator.storage.persist) {
      const granted = await navigator.storage.persist();
      if (granted) {
        await checkStorage();
      }
    }
  };

  return (
    <div className="card">
      {status === null ? (
        <button onClick={checkStorage} className="btn-secondary">
          Check Storage Status
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Storage Used</span>
            <span className="text-white">{status.usedMB} MB / {status.quotaMB} MB ({status.percentUsed}%)</span>
          </div>
          <div className="w-full bg-surface rounded-full h-2">
            <div
              className="bg-accent rounded-full h-2 transition-all"
              style={{ width: `${Math.min(parseFloat(status.percentUsed), 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${status.persisted ? 'text-gain' : 'text-yellow-500'}`}>
              {status.persisted ? 'Storage is persistent' : 'Storage may be cleared by browser'}
            </span>
            {!status.persisted && (
              <button onClick={requestPersistence} className="btn-secondary text-sm py-1">
                Request Persistence
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
