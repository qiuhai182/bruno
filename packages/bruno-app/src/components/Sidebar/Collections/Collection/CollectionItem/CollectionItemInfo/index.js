import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from 'components/Modal';
import Help from 'components/Help';
import { getItemTypeLabel } from 'utils/collections';

const CollectionItemInfo = ({ item, onClose }) => {
  const { t } = useTranslation();
  const { name, filename, type } = item;
  const itemTypeLabel = getItemTypeLabel(item);

  return (
    <Modal
      size="md"
      title={t('sidebar.menu.info')}
      handleCancel={onClose}
      hideCancel={true}
      hideFooter={true}
    >
      <div className="w-fit flex flex-col h-full">
        <table className="w-full border-collapse">
          <tbody>
            <tr className="">
              <td className="py-2 px-2 text-left text-muted ">
                {t('sidebar.item.nameLabel', { type: itemTypeLabel })}
              </td>
              <td className="py-2 px-2 text-nowrap truncate max-w-[500px]" title={name}>
                <span className="mr-2">:</span>{name}
              </td>
            </tr>
            <tr className="">
              <td className="py-2 px-2 text-left text-muted flex items-center">
                {type == 'folder' ? t('sidebar.folderName') : t('sidebar.newRequest.fileName')}
                <small className="font-normal text-muted ml-1">{t('sidebar.newRequest.onFilesystem')}</small>
                {type == 'folder' ? (
                  <Help width="300">
                    <p>
                      {t('sidebar.item.infoFolderNameHelp')}
                    </p>
                  </Help>
                ) : (
                  <Help width="300">
                    <p>
                      {t('sidebar.item.fileNameHelp1')}
                    </p>
                  </Help>
                )}
              </td>
              <td className="py-2 px-2 break-all text-nowrap truncate max-w-[500px]" title={filename}>
                <span className="mr-2">:</span>
                {filename}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

export default CollectionItemInfo;
