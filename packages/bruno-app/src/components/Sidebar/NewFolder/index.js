import React, { useRef, useEffect, useState, forwardRef } from 'react';
import { useFormik } from 'formik';
import toast from 'react-hot-toast';
import * as Yup from 'yup';
import Portal from 'components/Portal';
import Modal from 'components/Modal';
import { useDispatch } from 'react-redux';
import { newFolder } from 'providers/ReduxStore/slices/collections/actions';
import { IconArrowBackUp, IconEdit } from '@tabler/icons';
import { sanitizeName, validateName, validateNameError } from 'utils/common/regex';
import PathDisplay from 'components/PathDisplay/index';
import Help from 'components/Help';
import Dropdown from 'components/Dropdown';
import { IconCaretDown } from '@tabler/icons';
import StyledWrapper from './StyledWrapper';
import { useTranslation } from 'react-i18next';
import Button from 'ui/Button';

const NewFolder = ({ collectionUid, item, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const inputRef = useRef();
  const [isEditing, toggleEditing] = useState(false);
  const [showFilesystemName, toggleShowFilesystemName] = useState(false);

  const dropdownTippyRef = useRef();
  const onDropdownCreate = (ref) => (dropdownTippyRef.current = ref);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      folderName: '',
      directoryName: ''
    },
    validationSchema: Yup.object({
      folderName: Yup.string()
        .trim()
        .min(1, t('sidebar.validation.min1Char'))
        .required(t('sidebar.validation.nameRequired')),
      directoryName: Yup.string()
        .trim()
        .min(1, t('sidebar.validation.min1Char'))
        .required(t('sidebar.validation.folderNameRequired'))
        .test('is-valid-folder-name', function (value) {
          const isValid = validateName(value);
          return isValid ? true : this.createError({ message: validateNameError(value) });
        })
        .test({
          name: 'folderName',
          message: t('sidebar.validation.reservedFolderName'),
          test: (value) => {
            if (item?.uid) return true;
            return value && !value.trim().toLowerCase().includes('environments');
          }
        })
    }),
    onSubmit: (values) => {
      dispatch(newFolder(values.folderName, values.directoryName, collectionUid, item ? item.uid : null))
        .then(() => {
          toast.success(t('sidebar.toast.newFolderCreated'));
          onClose();
        })
        .catch((err) => toast.error(err ? err.message : t('sidebar.toast.errorAddingFolder')));
    }
  });

  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  const AdvancedOptions = forwardRef((props, ref) => {
    return (
      <div ref={ref} className="flex mr-2 text-link cursor-pointer items-center">
        <button
          className="btn-advanced"
          type="button"
        >
          {t('sidebar.options')}
        </button>
        <IconCaretDown className="caret ml-1" size={14} strokeWidth={2} />
      </div>
    );
  });

  return (
    <Portal>
      <StyledWrapper>
        <Modal size="md" title={t('sidebar.newFolder.title')} hideFooter={true} handleCancel={onClose}>
          <form className="bruno-form" onSubmit={formik.handleSubmit}>
            <label htmlFor="folderName" className="block font-medium">
              {t('sidebar.newFolder.folderName')}
            </label>
            <input
              id="folder-name"
              type="text"
              name="folderName"
              ref={inputRef}
              className="block textbox mt-2 w-full"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              onChange={(e) => {
                formik.setFieldValue('folderName', e.target.value);
                !isEditing && formik.setFieldValue('directoryName', sanitizeName(e.target.value));
              }}
              data-testid="new-folder-input"
              value={formik.values.folderName || ''}
            />
            {formik.touched.folderName && formik.errors.folderName ? (
              <div className="text-red-500" data-testid="form-error">{formik.errors.folderName}</div>
            ) : null}

            {showFilesystemName && (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="directoryName" className="flex items-center font-medium">
                    {t('sidebar.newFolder.folderName')} <small className="font-normal text-muted ml-1">{t('sidebar.newRequest.onFilesystem')}</small>
                    <Help width="300">
                      <p>
                        {t('sidebar.newFolder.folderNameHelp')}
                      </p>
                    </Help>
                  </label>
                  {isEditing ? (
                    <IconArrowBackUp
                      className="cursor-pointer opacity-50 hover:opacity-80"
                      size={16}
                      strokeWidth={1.5}
                      onClick={() => toggleEditing(false)}
                    />
                  ) : (
                    <IconEdit
                      className="cursor-pointer opacity-50 hover:opacity-80"
                      size={16}
                      strokeWidth={1.5}
                      onClick={() => toggleEditing(true)}
                    />
                  )}
                </div>
                {isEditing ? (
                  <div className="relative flex flex-row gap-1 items-center justify-between">
                    <input
                      id="file-name"
                      type="text"
                      name="directoryName"
                      placeholder={t('sidebar.newFolder.folderName')}
                      className="block textbox mt-2 w-full"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      onChange={formik.handleChange}
                      value={formik.values.directoryName || ''}
                    />
                  </div>
                ) : (
                  <div className="relative flex flex-row gap-1 items-center justify-between">
                    <PathDisplay
                      iconType="folder"
                      baseName={formik.values.directoryName}
                    />
                  </div>
                )}
                {formik.touched.directoryName && formik.errors.directoryName ? (
                  <div className="text-red-500" data-testid="form-error">{formik.errors.directoryName}</div>
                ) : null}
              </div>
            )}
            <div className="flex justify-between items-center mt-8 bruno-modal-footer">
              <div className="flex advanced-options">
                <Dropdown onCreate={onDropdownCreate} icon={<AdvancedOptions />} placement="bottom-start">
                  <div
                    className="dropdown-item"
                    key="show-filesystem-name"
                    onClick={(e) => {
                      dropdownTippyRef.current.hide();
                      toggleShowFilesystemName(!showFilesystemName);
                    }}
                  >
                    {showFilesystemName ? t('sidebar.hideFilesystemName') : t('sidebar.showFilesystemName')}
                  </div>
                </Dropdown>
              </div>
              <div className="flex justify-end">
                <Button type="button" color="secondary" variant="ghost" onClick={onClose} className="mr-2">
                  {t('common.cancel')}
                </Button>
                <Button type="submit">
                  {t('sidebar.create')}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      </StyledWrapper>
    </Portal>
  );
};

export default NewFolder;
