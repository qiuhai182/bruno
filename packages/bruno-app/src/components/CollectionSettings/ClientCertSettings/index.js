import React from 'react';
import { IconCertificate, IconTrash, IconFile, IconX, IconUpload, IconPlus, IconEye, IconEyeOff } from '@tabler/icons';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import StyledWrapper from './StyledWrapper';
import { useRef, useState } from 'react';
import Modal from 'components/Modal';
import path from 'utils/common/path';
import SensitiveFieldWarning from 'components/SensitiveFieldWarning/index';
import SingleLineEditor from 'components/SingleLineEditor/index';
import { useDetectSensitiveField } from 'hooks/useDetectSensitiveField/index';
import { useTheme } from 'styled-components';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { updateCollectionClientCertificates } from 'providers/ReduxStore/slices/collections';
import { saveCollectionSettings } from 'providers/ReduxStore/slices/collections/actions';
import get from 'lodash/get';
import Button from 'ui/Button';
import ActionIcon from 'ui/ActionIcon';
import ListGroup from 'ui/ListGroup';
import ToggleSwitch from 'components/ToggleSwitch';

const CertField = ({ label, value, title, action }) => (
  <div className="cert-field">
    <span className="cert-field-label">{label}</span>
    <span className="cert-field-value truncate" title={title}>
      {value}
    </span>
    {action}
  </div>
);

const CertFileInput = ({ label, name, value, inputRef, onSelect, onClear, error, touched, dangerColor }) => {
  const { t } = useTranslation();
  return (
    <div className="mb-3 flex items-start">
      <label className="settings-label mt-1" htmlFor={name}>
        {label}
      </label>
      <div className="flex flex-col gap-1">
        <input
          key={name}
          id={name}
          type="file"
          name={name}
          className="hidden"
          onChange={(e) => onSelect(e.target)}
          ref={inputRef}
        />
        {value ? (
          <div className="file-chip" data-testid={`file-chip-${name}`}>
            <IconFile size={14} strokeWidth={1.5} className="flex-shrink-0" />
            <span className="truncate max-w-[260px]" title={value}>
              {path.basename(value)}
            </span>
            <ActionIcon type="button" label={t('collection.common.removeFile')} size="sm" colorOnHover={dangerColor} onClick={onClear}>
              <IconX size={14} strokeWidth={1.5} />
            </ActionIcon>
          </div>
        ) : (
          <Button
            size="xs"
            variant="outline"
            icon={<IconUpload size={13} strokeWidth={1.5} />}
            onClick={() => inputRef.current?.click()}
            data-testid={`choose-file-${name}`}
          >
            {t('collection.common.chooseFile')}
          </Button>
        )}
        {touched && error ? <div className="text-red-500 text-xs">{error}</div> : null}
      </div>
    </div>
  );
};

const ClientCertSettings = ({ collection }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [visiblePassphrases, setVisiblePassphrases] = useState([]);

  const togglePassphraseVisibility = (index) => {
    setVisiblePassphrases((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  };

  // Get client certs from draft if exists, otherwise from brunoConfig
  const clientCertConfig = collection.draft?.brunoConfig
    ? get(collection, 'draft.brunoConfig.clientCertificates.certs', [])
    : get(collection, 'brunoConfig.clientCertificates.certs', []);
  const certFilePathInputRef = useRef();
  const keyFilePathInputRef = useRef();
  const pfxFilePathInputRef = useRef();
  const theme = useTheme();
  const { storedTheme } = theme;

  const formik = useFormik({
    initialValues: {
      domain: '',
      type: 'cert',
      certFilePath: '',
      keyFilePath: '',
      pfxFilePath: '',
      passphrase: ''
    },
    validationSchema: Yup.object({
      domain: Yup.string()
        .required()
        .trim()
        .test('not-empty-after-trim', t('collection.clientCert.domainRequired'), (value) => value && value.trim().length > 0),
      type: Yup.string().required().oneOf(['cert', 'pfx']),
      certFilePath: Yup.string().when('type', {
        is: (type) => type == 'cert',
        then: Yup.string().min(1, t('collection.clientCert.certFileRequired')).required()
      }),
      keyFilePath: Yup.string().when('type', {
        is: (type) => type == 'cert',
        then: Yup.string().min(1, t('collection.clientCert.keyFileRequired')).required()
      }),
      pfxFilePath: Yup.string().when('type', {
        is: (type) => type == 'pfx',
        then: Yup.string().min(1, t('collection.clientCert.pfxFileRequired')).required()
      }),
      passphrase: Yup.string()
    }),
    onSubmit: (values) => {
      let relevantValues = {};
      if (values.type === 'cert') {
        relevantValues = {
          domain: values.domain?.trim(),
          type: values.type,
          certFilePath: values.certFilePath,
          keyFilePath: values.keyFilePath,
          passphrase: values.passphrase
        };
      } else {
        relevantValues = {
          domain: values.domain?.trim(),
          type: values.type,
          pfxFilePath: values.pfxFilePath,
          passphrase: values.passphrase
        };
      }

      // Add the new cert to the existing certs in draft
      const updatedCerts = [...clientCertConfig, relevantValues];
      const clientCertificates = {
        enabled: true,
        certs: updatedCerts
      };

      dispatch(updateCollectionClientCertificates({
        collectionUid: collection.uid,
        clientCertificates
      }));

      formik.resetForm();
      resetFileInputFields();
      setShowAddCertModal(false);
    }
  });

  const { isSensitive } = useDetectSensitiveField(collection);
  const { showWarning, warningMessage } = isSensitive(formik.values.passphrase);

  const getFile = (e) => {
    const filePath = window?.ipcRenderer?.getFilePath(e?.files?.[0]);
    if (filePath) {
      let relativePath = path.relative(collection.pathname, filePath);
      formik.setFieldValue(e.name, relativePath);
    }
  };

  const resetFileInputFields = () => {
    if (certFilePathInputRef.current) {
      certFilePathInputRef.current.value = '';
    }
    if (keyFilePathInputRef.current) {
      keyFilePathInputRef.current.value = '';
    }
    if (pfxFilePathInputRef.current) {
      pfxFilePathInputRef.current.value = '';
    }
  };

  const handleTypeChange = (type) => {
    formik.setFieldValue('type', type);
    if (type === 'cert') {
      formik.setFieldValue('pfxFilePath', '');
      if (pfxFilePathInputRef.current) pfxFilePathInputRef.current.value = '';
    } else {
      formik.setFieldValue('certFilePath', '');
      if (certFilePathInputRef.current) certFilePathInputRef.current.value = '';
      formik.setFieldValue('keyFilePath', '');
      if (keyFilePathInputRef.current) keyFilePathInputRef.current.value = '';
    }
  };

  const handleRemove = (indexToRemove) => {
    // visiblePassphrases tracks cert indexes; removing a cert shifts every later index down by
    // one, so drop the removed index and decrement the ones above it to keep them aligned.
    setVisiblePassphrases((previousIndexes) =>
      previousIndexes
        .filter((index) => index !== indexToRemove)
        .map((index) => (index > indexToRemove ? index - 1 : index))
    );
    const updatedCerts = clientCertConfig.filter((cert, index) => index !== indexToRemove);
    const clientCertificates = {
      enabled: true,
      certs: updatedCerts
    };

    dispatch(updateCollectionClientCertificates({
      collectionUid: collection.uid,
      clientCertificates
    }));
  };

  const handleToggleDisabled = (indexToToggle) => {
    const updatedCerts = clientCertConfig.map((cert, index) => {
      if (index !== indexToToggle) return cert;
      const updatedCert = { ...cert };
      // Persist the flag only when the cert is disabled; enabled is the default.
      if (updatedCert.disabled) {
        delete updatedCert.disabled;
      } else {
        updatedCert.disabled = true;
      }
      return updatedCert;
    });

    dispatch(updateCollectionClientCertificates({
      collectionUid: collection.uid,
      clientCertificates: { enabled: true, certs: updatedCerts }
    }));
  };

  const openAddCertModal = () => {
    formik.resetForm();
    resetFileInputFields();
    setShowAddCertModal(true);
  };

  const clearFileField = (name, inputRef) => {
    formik.setFieldValue(name, '');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSave = () => dispatch(saveCollectionSettings(collection.uid));

  return (
    <StyledWrapper className="w-full h-full">
      <h1 className="font-medium text-[0.9375rem]">{t('collection.clientCert.title')}</h1>
      <div className="text-xs mt-1 text-muted">{t('collection.clientCert.subtitle')}</div>

      <ListGroup
        className="mt-5"
        items={clientCertConfig}
        getKey={(_, index) => `client-cert-${index}`}
        emptyState={{
          icon: <IconCertificate size={24} strokeWidth={1.2} />,
          title: t('collection.clientCert.emptyTitle'),
          text: t('collection.clientCert.emptyText')
        }}
        addButton={{
          label: t('collection.clientCert.addCertificate'),
          onClick: openAddCertModal,
          icon: <IconPlus size={15} strokeWidth={1.5} />,
          dataTestId: 'add-client-cert'
        }}
        footerActions={(
          <Button type="button" size="sm" data-testid="client-cert-save-btn" onClick={handleSave}>
            {t('common.save')}
          </Button>
        )}
        renderItem={(clientCert, index) => (
          <ListGroup.Item
            disabled={clientCert.disabled}
            leading={<IconCertificate className="cert-icon" size={20} strokeWidth={1.5} />}
            actions={(
              <>
                <ToggleSwitch
                  size="2xs"
                  isOn={!clientCert.disabled}
                  handleToggle={() => handleToggleDisabled(index)}
                  title={clientCert.disabled ? t('collection.clientCert.enableCertificate') : t('collection.clientCert.disableCertificate')}
                />
                <ActionIcon
                  label={t('collection.clientCert.removeCertificate')}
                  colorOnHover={theme.colors.text.danger}
                  onClick={() => handleRemove(index)}
                >
                  <IconTrash size={16} strokeWidth={1.5} />
                </ActionIcon>
              </>
            )}
          >
            <CertField label={t('collection.clientCert.host')} value={clientCert.domain} title={clientCert.domain} />
            {clientCert.type === 'pfx' ? (
              <CertField label={t('collection.clientCert.pfxFileLabel')} value={path.basename(clientCert.pfxFilePath || '')} title={clientCert.pfxFilePath} />
            ) : (
              <>
                <CertField label={t('collection.clientCert.certFileLabel')} value={path.basename(clientCert.certFilePath || '')} title={clientCert.certFilePath} />
                <CertField label={t('collection.clientCert.keyFileLabel')} value={path.basename(clientCert.keyFilePath || '')} title={clientCert.keyFilePath} />
              </>
            )}
            {clientCert.passphrase ? (
              <CertField
                label={t('collection.clientCert.passphrase')}
                value={visiblePassphrases.includes(index) ? clientCert.passphrase : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                action={(
                  <ActionIcon
                    size="sm"
                    className={visiblePassphrases.includes(index) ? 'stay-visible' : ''}
                    label={visiblePassphrases.includes(index) ? t('collection.clientCert.hidePassphrase') : t('collection.clientCert.showPassphrase')}
                    onClick={() => togglePassphraseVisibility(index)}
                  >
                    {visiblePassphrases.includes(index) ? (
                      <IconEyeOff size={14} strokeWidth={1.5} />
                    ) : (
                      <IconEye size={14} strokeWidth={1.5} />
                    )}
                  </ActionIcon>
                )}
              />
            ) : null}
          </ListGroup.Item>
        )}
      />

      {showAddCertModal && (
        <Modal
          size="md"
          title={t('collection.clientCert.addModalTitle')}
          confirmText={t('collection.common.add')}
          dataTestId="add-client-cert-modal"
          handleConfirm={formik.handleSubmit}
          handleCancel={() => setShowAddCertModal(false)}
        >
          <div className="text-xs mb-4 text-muted">
            {t('collection.clientCert.relativePathsNote')}
          </div>
          {/* Submission is driven by the Modal's confirm button/Enter (handleConfirm); prevent the form's own submit to avoid firing twice */}
          <form className="bruno-form" onSubmit={(e) => e.preventDefault()}>
            <div className="mb-3 flex items-start">
              <label className="settings-label mt-1" htmlFor="domain">
                {t('collection.clientCert.domain')}
              </label>
              <div className="flex flex-col gap-1">
                <div className="relative flex items-center">
                  <div className="absolute left-0 pl-2 pointer-events-none flex items-center h-full">
                    <span className="protocol-placeholder">
                      <span className="protocol-https">https://</span>
                      <span className="protocol-grpcs">grpcs://</span>
                      <span className="protocol-wss">wss://</span>
                    </span>
                  </div>
                  <input
                    id="domain"
                    type="text"
                    name="domain"
                    placeholder="example.org"
                    className="block textbox non-passphrase-input !pl-[60px]"
                    onChange={formik.handleChange}
                    value={formik.values.domain || ''}
                  />
                </div>
                {formik.touched.domain && formik.errors.domain ? (
                  <div className="text-red-500 text-xs">{formik.errors.domain}</div>
                ) : null}
              </div>
            </div>
            <div className="mb-3 flex items-center">
              <label id="type-label" className="settings-label">
                {t('collection.clientCert.type')}
              </label>
              <div className="type-picker" role="radiogroup" aria-labelledby="type-label">
                <button
                  type="button"
                  role="radio"
                  aria-checked={formik.values.type === 'cert'}
                  className={`type-option ${formik.values.type === 'cert' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('cert')}
                >
                  {t('collection.clientCert.certAndKey')}
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={formik.values.type === 'pfx'}
                  className={`type-option ${formik.values.type === 'pfx' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('pfx')}
                >
                  PFX
                </button>
              </div>
            </div>
            {formik.values.type === 'cert' ? (
              <>
                <CertFileInput
                  label={t('collection.clientCert.certFileLabel')}
                  name="certFilePath"
                  value={formik.values.certFilePath}
                  inputRef={certFilePathInputRef}
                  onSelect={getFile}
                  onClear={() => clearFileField('certFilePath', certFilePathInputRef)}
                  error={formik.errors.certFilePath}
                  touched={formik.touched.certFilePath}
                  dangerColor={theme.colors.text.danger}
                />
                <CertFileInput
                  label={t('collection.clientCert.keyFileLabel')}
                  name="keyFilePath"
                  value={formik.values.keyFilePath}
                  inputRef={keyFilePathInputRef}
                  onSelect={getFile}
                  onClear={() => clearFileField('keyFilePath', keyFilePathInputRef)}
                  error={formik.errors.keyFilePath}
                  touched={formik.touched.keyFilePath}
                  dangerColor={theme.colors.text.danger}
                />
              </>
            ) : (
              <CertFileInput
                label={t('collection.clientCert.pfxFileLabel')}
                name="pfxFilePath"
                value={formik.values.pfxFilePath}
                inputRef={pfxFilePathInputRef}
                onSelect={getFile}
                onClear={() => clearFileField('pfxFilePath', pfxFilePathInputRef)}
                error={formik.errors.pfxFilePath}
                touched={formik.touched.pfxFilePath}
                dangerColor={theme.colors.text.danger}
              />
            )}
            <div className="mb-3 flex items-start">
              <label className="settings-label mt-1" htmlFor="passphrase">
                {t('collection.clientCert.passphrase')}
              </label>
              <div className="flex flex-col gap-1">
                <div className="textbox flex flex-row items-center w-[300px] h-[1.70rem] relative">
                  <SingleLineEditor
                    value={formik.values.passphrase || ''}
                    theme={storedTheme}
                    onChange={(val) => formik.setFieldValue('passphrase', val)}
                    collection={collection}
                    isSecret={true}
                  />
                  {showWarning && <SensitiveFieldWarning fieldName="basic-password" warningMessage={warningMessage} />}
                </div>
                {formik.touched.passphrase && formik.errors.passphrase ? (
                  <div className="text-red-500 text-xs">{formik.errors.passphrase}</div>
                ) : null}
              </div>
            </div>
          </form>
        </Modal>
      )}
    </StyledWrapper>
  );
};

export default ClientCertSettings;
