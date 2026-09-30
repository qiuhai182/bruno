import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconChevronDown, IconChevronRight } from '@tabler/icons';

const toEntries = (headers) => {
  if (!headers) return [];
  if (Array.isArray(headers)) {
    return headers.map((h) => ({ name: h?.name, value: h?.value }));
  }
  return Object.entries(headers).map(([name, value]) => ({ name, value }));
};

const Headers = ({ headers, variant }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const entries = toEntries(headers);
  const count = entries.length;

  return (
    <div className="tl-block">
      <button
        type="button"
        className="tl-block-h"
        aria-expanded={isOpen}
        data-testid="headers-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="tl-block-chev">
          {isOpen ? <IconChevronDown size={12} strokeWidth={2} /> : <IconChevronRight size={12} strokeWidth={2} />}
        </span>
        {t('responsePane.timeline.headers')}
        <span className="tl-block-count">({count})</span>
      </button>
      {isOpen && (
        count === 0
          ? <div className="tl-empty">{t('responsePane.timeline.noHeaders')}</div>
          : (
              <table className="tl-headers-table" data-testid={`tl-headers-table-${variant}`}>
                <tbody>
                  {entries.map((h, i) => (
                    <tr key={i} data-testid={`tl-header-row-${variant}`}>
                      <td className="tl-headers-key" data-testid={`tl-header-name-${variant}`}>{h.name}</td>
                      <td className="tl-headers-val" data-testid={`tl-header-value-${variant}`}>{String(h.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
      )}
    </div>
  );
};

export default Headers;
