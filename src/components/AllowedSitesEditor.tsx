import { useState } from 'react';
import { X } from 'lucide-react';

const SITE_CATEGORIES = ['Research', 'Development', 'Docs', 'Design', 'Data', 'Learning', 'Communication'] as const;

interface AllowedSites {
  categories: string[];
  customSites: string[];
}

interface AllowedSitesEditorProps {
  value: AllowedSites;
  onChange: (value: AllowedSites) => void;
}

export default function AllowedSitesEditor({ value, onChange }: AllowedSitesEditorProps) {
  const [domainInput, setDomainInput] = useState('');

  const toggleCategory = (cat: string) => {
    const next = value.categories.includes(cat)
      ? value.categories.filter(c => c !== cat)
      : [...value.categories, cat];
    onChange({ ...value, categories: next });
  };

  const addCustomSite = () => {
    const domain = domainInput.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (domain && !value.customSites.includes(domain)) {
      onChange({ ...value, customSites: [...value.customSites, domain] });
    }
    setDomainInput('');
  };

  const removeCustomSite = (site: string) => {
    onChange({ ...value, customSites: value.customSites.filter(s => s !== site) });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomSite();
    }
  };

  const totalSites = value.categories.length + value.customSites.length;

  return (
    <div className="space-y-3">
      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {SITE_CATEGORIES.map(cat => {
          const active = value.categories.includes(cat);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent text-muted-foreground border border-border'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Custom domain input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={domainInput}
          onChange={e => setDomainInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add domain (e.g. github.com) and press Enter"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>

      {/* Custom site chips */}
      {value.customSites.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.customSites.map(site => (
            <span
              key={site}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-foreground"
            >
              {site}
              <button
                type="button"
                onClick={() => removeCustomSite(site)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Count line */}
      <p className="text-xs text-muted-foreground font-mono">
        {totalSites} site{totalSites !== 1 ? 's' : ''} from {value.categories.length} categor{value.categories.length !== 1 ? 'ies' : 'y'} + {value.customSites.length} custom
      </p>
    </div>
  );
}
