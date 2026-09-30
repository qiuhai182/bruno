import React, { useMemo, useCallback } from 'react';
import get from 'lodash/get';
import {
  IconCaretDown,
  IconForms,
  IconBraces,
  IconCode,
  IconFileText,
  IconDatabase,
  IconFile,
  IconX
} from '@tabler/icons';
import MenuDropdown from 'ui/MenuDropdown';
import { useDispatch } from 'react-redux';
import { updateRequestBodyMode } from 'providers/ReduxStore/slices/collections';
import { humanizeRequestBodyMode } from 'utils/collections';
import StyledWrapper from './StyledWrapper';
import { updateRequestBody } from 'providers/ReduxStore/slices/collections/index';
import { toastError } from 'utils/common/error';
import { prettifyJsonString } from 'utils/common/index';
import xmlFormat from 'xml-formatter';
import { useTranslation } from 'react-i18next';

const DEFAULT_MODES = [
  {
    nameKey: 'requestPane.bodyMode.groupForm',
    options: [
      { id: 'multipartForm', labelKey: 'requestPane.bodyMode.multipartForm', leftSection: IconForms },
      { id: 'formUrlEncoded', labelKey: 'requestPane.bodyMode.formUrlEncoded', leftSection: IconForms }
    ]
  },
  {
    nameKey: 'requestPane.bodyMode.groupRaw',
    options: [
      { id: 'json', label: 'JSON', leftSection: IconBraces },
      { id: 'xml', label: 'XML', leftSection: IconCode },
      { id: 'text', label: 'TEXT', leftSection: IconFileText },
      { id: 'sparql', label: 'SPARQL', leftSection: IconDatabase }
    ]
  },
  {
    nameKey: 'requestPane.bodyMode.groupOther',
    options: [
      { id: 'file', labelKey: 'requestPane.bodyMode.file', leftSection: IconFile },
      { id: 'none', labelKey: 'requestPane.body.noBody', leftSection: IconX }
    ]
  }
];

const RequestBodyMode = ({ item, collection }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const body = item.draft ? get(item, 'draft.request.body') : get(item, 'request.body');
  const bodyMode = body?.mode;

  const onModeChange = useCallback((value) => {
    dispatch(
      updateRequestBodyMode({
        itemUid: item.uid,
        collectionUid: collection.uid,
        mode: value
      })
    );
  }, [dispatch, item.uid, collection.uid]);

  const onPrettify = () => {
    if (body?.json && bodyMode === 'json') {
      try {
        const prettyBodyJson = prettifyJsonString(body.json);
        dispatch(
          updateRequestBody({
            content: prettyBodyJson,
            itemUid: item.uid,
            collectionUid: collection.uid
          })
        );
      } catch (e) {
        toastError(new Error(t('requestPane.bodyMode.prettifyInvalidJson')));
      }
    } else if (body?.xml && bodyMode === 'xml') {
      try {
        const prettyBodyXML = xmlFormat(body.xml, { collapseContent: true });
        dispatch(
          updateRequestBody({
            content: prettyBodyXML,
            itemUid: item.uid,
            collectionUid: collection.uid
          })
        );
      } catch (e) {
        toastError(new Error(t('requestPane.bodyMode.prettifyInvalidXml')));
      }
    }
  };

  const menuItems = useMemo(() => {
    return DEFAULT_MODES.map((group) => ({
      name: t(group.nameKey),
      options: group.options.map((option) => ({
        ...option,
        label: option.labelKey ? t(option.labelKey) : option.label,
        onClick: () => onModeChange(option.id)
      }))
    }));
  }, [t, onModeChange]);

  return (
    <StyledWrapper>
      <div className="inline-flex items-center cursor-pointer body-mode-selector" data-testid="request-body-mode-selector">
        <MenuDropdown
          items={menuItems}
          placement="bottom-end"
          selectedItemId={bodyMode}
          showGroupDividers={false}
          groupStyle="select"
          data-testid="request-body-mode-label"
        >
          <div className="flex items-center justify-center pl-3 py-1 select-none selected-body-mode">
            {humanizeRequestBodyMode(bodyMode)} <IconCaretDown className="caret ml-1" size={14} strokeWidth={2} />
          </div>
        </MenuDropdown>
      </div>
      {(bodyMode === 'json' || bodyMode === 'xml') && (
        <button className="ml-2" onClick={onPrettify}>
          {t('requestPane.bodyMode.prettify')}
        </button>
      )}
    </StyledWrapper>
  );
};
export default RequestBodyMode;
