import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { IconBookmark } from '@tabler/icons';
import { addResponseExample } from 'providers/ReduxStore/slices/collections';
import { saveRequest } from 'providers/ReduxStore/slices/collections/actions';
import { insertTaskIntoQueue } from 'providers/ReduxStore/slices/app';
import { uuid, formatResponse } from 'utils/common';
import toast from 'react-hot-toast';
import CreateExampleModal from 'components/ResponseExample/CreateExampleModal';
import { getExampleBodyType } from 'utils/responseBodyProcessor';
import { detectContentTypeFromBase64 } from 'utils/response';
import { getInitialExampleName } from 'utils/collections/index';
import classnames from 'classnames';
import StyledWrapper from './StyledWrapper';
import ActionIcon from 'ui/ActionIcon/index';

const ResponseBookmark = forwardRef(({ item, collection, responseSize, children }, ref) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [showSaveResponseExampleModal, setShowSaveResponseExampleModal] = useState(false);
  const response = item.response || {};
  const elementRef = useRef(null);

  const isResponseTooLarge = responseSize >= 5 * 1024 * 1024; // 5 MB
  const isStreamingResponse = response.stream;
  const isDisabled = isResponseTooLarge || isStreamingResponse ? true : false;

  const getTitleText = () => {
    if (isStreamingResponse) {
      return t('responsePane.bookmark.streamingNotSupported');
    }

    if (isResponseTooLarge) {
      return t('responsePane.bookmark.tooLarge');
    }

    return t('responsePane.bookmark.saveTitle');
  };

  useImperativeHandle(ref, () => ({
    click: () => elementRef.current?.click(),
    isDisabled
  }), [isDisabled]);

  // Only show for HTTP requests
  if (item.type !== 'http-request') {
    return null;
  }

  const handleSaveClick = (e) => {
    if (!response || response.error) {
      toast.error(t('responsePane.bookmark.noValidResponse'));
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (isResponseTooLarge) {
      toast.error(t('responsePane.bookmark.tooLarge'));
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (isDisabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    setShowSaveResponseExampleModal(true);
  };

  const saveAsExample = async (name, description = '') => {
    // Convert headers object to array format expected by schema
    const headersArray = response.headers && typeof response.headers === 'object'
      ? Object.entries(response.headers).map(([name, value]) => ({
          name,
          value,
          enabled: true
        }))
      : [];

    const contentTypeHeader = headersArray.find((h) => h.name?.toLowerCase() === 'content-type');
    const contentType = contentTypeHeader?.value?.toLowerCase() || '';
    const sniffedMime = detectContentTypeFromBase64(response.dataBuffer);
    const bodyType = getExampleBodyType(contentType, sniffedMime);

    const content = bodyType === 'binary'
      ? response.dataBuffer
      : formatResponse(response.data, response.dataBuffer, bodyType);

    const exampleData = {
      name: name,
      status: response.status || 200,
      headers: headersArray,
      body: {
        type: bodyType,
        content: content
      },
      description: description
    };

    // Calculate the index where the example will be saved
    // This will be the length of the examples array after adding the new one
    const existingExamples = item.draft?.examples || item.examples || [];
    const exampleIndex = existingExamples.length;
    const exampleUid = uuid();

    dispatch(addResponseExample({
      itemUid: item.uid,
      collectionUid: collection.uid,
      example: {
        ...exampleData,
        uid: exampleUid
      }
    }));

    // Save the request
    await dispatch(saveRequest(item.uid, collection.uid, true));

    // Task middleware will track this and open the example in a new tab once the file is reloaded
    dispatch(insertTaskIntoQueue({
      uid: exampleUid,
      type: 'OPEN_EXAMPLE',
      collectionUid: collection.uid,
      itemUid: item.uid,
      exampleIndex: exampleIndex
    }));

    setShowSaveResponseExampleModal(false);
    toast.success(t('responsePane.bookmark.createdSuccessfully', { name }));
  };

  const disabledMessage = getTitleText();

  return (
    <>
      <div
        ref={elementRef}
        onClick={handleSaveClick}
        title={
          !children ? disabledMessage : (isDisabled ? disabledMessage : null)
        }
        className={classnames({
          'opacity-50 cursor-not-allowed': isDisabled && !children
        })}
        data-testid="response-bookmark-btn"
      >
        {children ?? (
          <StyledWrapper className="flex items-center">
            <ActionIcon className="p-1" disabled={isDisabled}>
              <IconBookmark size={16} strokeWidth={2} />
            </ActionIcon>
          </StyledWrapper>
        )}
      </div>

      <CreateExampleModal
        isOpen={showSaveResponseExampleModal}
        onClose={() => setShowSaveResponseExampleModal(false)}
        onSave={saveAsExample}
        title={t('responsePane.bookmark.modalTitle')}
        initialName={getInitialExampleName(item)}
      />
    </>
  );
});

ResponseBookmark.displayName = 'ResponseBookmark';

export default ResponseBookmark;
