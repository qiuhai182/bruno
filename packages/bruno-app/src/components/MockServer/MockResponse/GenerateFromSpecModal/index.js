import { useState } from 'react';
import MockConfirmModal from 'components/MockServer/MockConfirmModal';
import { useTranslation } from 'react-i18next';

const GenerateFromSpecModal = ({ specName, onClose, onConfirm, isGenerating }) => {
  const { t } = useTranslation();
  const [generateFromSchema, setGenerateFromSchema] = useState(true);

  return (
    <MockConfirmModal
      size="md"
      title={t('mockServer.generate.title')}
      confirmText={isGenerating ? t('mockServer.generate.generating') : t('mockServer.generate.generate')}
      onConfirm={() => onConfirm({ generateFromSchema })}
      onClose={onClose}
      confirmDisabled={isGenerating}
      dataTestId="mock-response-generate-from-spec-modal"
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed">
          {t('mockServer.generate.description', { spec: specName || t('mockServer.responses.thisSpec') })}
        </p>

        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={generateFromSchema}
            onChange={(event) => setGenerateFromSchema(event.target.checked)}
            data-testid="mock-response-generate-from-schema-checkbox"
          />
          <span>
            {t('mockServer.generate.fromSchemaLabel')}
            <span className="block text-xs opacity-70 mt-1">
              {t('mockServer.generate.fromSchemaHint')}
            </span>
          </span>
        </label>
      </div>
    </MockConfirmModal>
  );
};

export default GenerateFromSpecModal;
