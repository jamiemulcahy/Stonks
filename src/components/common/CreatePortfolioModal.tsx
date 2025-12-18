import { useState, useEffect, useRef } from 'react';
import { usePortfolioStore } from '../../stores/portfolio';

interface CreatePortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePortfolioModal({ isOpen, onClose }: CreatePortfolioModalProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { createPortfolio } = usePortfolioStore();

  useEffect(() => {
    if (isOpen) {
      setName('');
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter a portfolio name');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createPortfolio(name.trim());
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-md bg-background-secondary border border-border rounded-xl shadow-2xl">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Create Portfolio</h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="portfolio-name" className="block text-sm text-gray-400 mb-2">
                Portfolio Name
              </label>
              <input
                ref={inputRef}
                id="portfolio-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Retirement, Growth Stocks"
                className="input"
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <p className="text-loss text-sm mb-4">{error}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Portfolio'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
