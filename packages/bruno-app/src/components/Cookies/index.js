import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Modal from 'components/Modal';
import Accordion from 'components/Accordion/index';
import { IconTrash, IconEdit, IconCirclePlus, IconCookieOff, IconAlertTriangle, IconSearch } from '@tabler/icons';
import { deleteCookiesForDomain, deleteCookie } from 'providers/ReduxStore/slices/app';
import toast from 'react-hot-toast';
import ModifyCookieModal from 'components/Cookies/ModifyCookieModal/index';
import StyledWrapper from './StyledWrapper';
import moment from 'moment';
import { Tooltip } from 'react-tooltip';
import Button from 'ui/Button';
import { useTranslation } from 'react-i18next';

const ClearDomainCookiesModal = ({ onClose, domain, onClear }) => {
  const { t } = useTranslation();
  return (
    <Modal onClose={onClose} handleCancel={onClose} title={t('cookies.clearDomainCookiesTitle')} hideFooter={true}>
      <div className="flex items-center font-normal">
        <IconAlertTriangle size={32} strokeWidth={1.5} className="warning-icon" />
        <h1 className="ml-2 text-lg font-medium">{t('cookies.holdOn')}</h1>
      </div>
      <div className="font-normal mt-4">
        {t('cookies.clearDomainCookiesConfirm', { domain })}
      </div>

      <div className="flex justify-between mt-6">
        <div>
          <Button color="secondary" variant="ghost" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
        <div>
          <Button color="danger" onClick={onClear}>
            {t('cookies.clearAll')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const DeleteCookieModal = ({ onClose, cookieName, onDelete }) => {
  const { t } = useTranslation();
  return (
    <Modal onClose={onClose} handleCancel={onClose} title={t('cookies.deleteCookieTitle')} hideFooter={true}>
      <div className="flex items-center font-normal">
        <IconAlertTriangle size={32} strokeWidth={1.5} className="warning-icon" />
        <h1 className="ml-2 text-lg font-medium">{t('cookies.holdOn')}</h1>
      </div>
      <div className="font-normal mt-4">
        {t('cookies.deleteCookieConfirm', { cookieName })}
      </div>

      <div className="flex justify-between mt-6">
        <div>
          <Button color="secondary" variant="ghost" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
        <div>
          <Button color="danger" onClick={onDelete}>
            {t('common.delete')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const CollectionProperties = ({ onClose }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const cookies = useSelector((state) => state.app.cookies) || [];
  const [isModifyCookieModalOpen, setIsModifyCookieModalOpen] = useState(false);
  const [currentDomain, setCurrentDomain] = useState(null);
  const [cookieToEdit, setCookieToEdit] = useState(null);

  const [domainToClear, setDomainToClear] = useState(null);
  const [cookieToDelete, setCookieToDelete] = useState(null);
  const [searchText, setSearchText] = useState(null);

  const handleAddCookie = (domain) => {
    if (domain) setCurrentDomain(domain);
    setIsModifyCookieModalOpen(true);
  };

  const handleEditCookie = (domain, cookie) => {
    setCurrentDomain(domain);
    setCookieToEdit(cookie);
    setIsModifyCookieModalOpen(true);
  };

  const handleClearDomainCookies = (domain) => {
    setDomainToClear(domain);
  };

  const clearDomainCookiesAction = () => {
    dispatch(deleteCookiesForDomain(domainToClear))
      .then(() => {
        toast.success(t('cookies.clearDomainSuccess'));
      })
      .catch((err) => console.log(err) && toast.error(t('cookies.clearDomainFailed')));
    setDomainToClear(null);
  };

  const handleDeleteCookie = (domain, path, key) => {
    setCookieToDelete({ key, domain, path });
  };

  const deleteCookieAction = () => {
    if (cookieToDelete) {
      const { domain, path, key } = cookieToDelete;
      dispatch(deleteCookie(domain, path, key))
        .then(() => {
          toast.success(t('cookies.deleteSuccess'));
        })
        .catch((err) => console.log(err) && toast.error(t('cookies.deleteFailed')));
    }
    setCookieToDelete(null);
  };

  const filteredCookies = useMemo(() => {
    if (!searchText) return cookies;

    return cookies.filter((cookie) =>
      cookie.domain.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [cookies, searchText]);

  const shouldShowHeader = cookies && cookies.length > 0;

  return (
    <>
      <Modal
        size="xl"
        title={t('cookies.title')}
        hideFooter={true}
        handleCancel={onClose}
        customHeader={shouldShowHeader ? (
          <StyledWrapper className="header flex items-center justify-between w-full">
            <h2 className="text-xs font-medium">{t('cookies.title')}</h2>
            <input
              type="search"
              placeholder={t('cookies.searchByDomain')}
              value={searchText || ''}
              onChange={(e) => setSearchText(e.target.value)}
              className="block textbox non-passphrase-input ml-auto font-normal"
              autoFocus
            />
            <Button
              type="submit"
              size="sm"
              className="mx-4"
              icon={<IconCirclePlus strokeWidth={1.5} size={16} />}
              onClick={(e) => {
                e.stopPropagation();
                handleAddCookie();
              }}
            >
              <span>{t('cookies.addCookie')}</span>
            </Button>
          </StyledWrapper>
        ) : null}
      >
        <StyledWrapper>
          {!cookies || !cookies.length ? (
            // No cookies found
            <div className="flex items-center justify-center flex-col">
              <IconCookieOff size={48} strokeWidth={1.5} className="empty-icon" />
              <h2 className="text-lg font-medium mt-4">{t('cookies.noCookies')}</h2>
              <p className="empty-text mt-2">{t('cookies.emptyHint')}</p>
              <Button
                type="submit"
                size="sm"
                className="mt-8"
                icon={<IconCirclePlus strokeWidth={1.5} size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddCookie();
                }}
              >
                {t('cookies.addCookie')}
              </Button>
            </div>
          ) : cookies.length && !filteredCookies.length ? (
            // No search results
            <div className="flex items-center justify-center flex-col">
              <IconSearch size={48} />
              <h2 className="text-lg font-medium mt-4">{t('cookies.noSearchResults')}</h2>
              <p className="empty-text mt-2">{t('cookies.tryDifferentSearch')}</p>
            </div>
          ) : (
            // Show cookies list
            <div className="scroll-box">
              <Accordion defaultIndex={0}>
                {filteredCookies.map((domainWithCookies, i) => (
                  <Accordion.Item key={i} index={i}>
                    <Accordion.Header index={i} className="flex items-center">
                      <div className="flex items-center">
                        <span>{domainWithCookies.domain}</span>
                        <span className="domain-count ml-2 text-xs">
                          ({domainWithCookies.cookies.length}{' '}
                          {domainWithCookies.cookies.length === 1 ? t('cookies.cookieSingular') : t('cookies.cookiePlural')})
                        </span>
                        <div className="ml-auto flex items-center gap-2">
                          <button
                            type="submit"
                            className="action-button flex items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddCookie(domainWithCookies.domain);
                            }}
                          >
                            <IconCirclePlus strokeWidth={1.5} size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearDomainCookies(domainWithCookies.domain);
                            }}
                            className="action-button-danger mr-2"
                          >
                            <IconTrash strokeWidth={1.5} size={16} />
                          </button>
                        </div>
                      </div>
                    </Accordion.Header>
                    <Accordion.Content index={i}>
                      <div className="flex items-center justify-between">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left">
                              <th className="py-2 px-4 font-medium w-32">{t('cookies.colName')}</th>
                              <th className="py-2 px-4 font-medium w-52">{t('cookies.colValue')}</th>
                              <th className="py-2 px-4 font-medium">{t('cookies.colPath')}</th>
                              <th className="py-2 px-4 font-medium">{t('cookies.colExpires')}</th>
                              <th className="py-2 px-4 font-medium text-center">{t('cookies.secure')}</th>
                              <th className="py-2 px-4 font-medium text-center">{t('cookies.httpOnly')}</th>
                              <th className="py-2 px-4 font-medium text-right w-24">{t('cookies.colActions')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {domainWithCookies.cookies.map((cookie) => (
                              <tr key={cookie.key}>
                                <td className="py-2 px-4 truncate">
                                  <span id={`cookie-key-${cookie.key}`}>{cookie.key}</span>
                                  <Tooltip
                                    anchorId={`cookie-key-${cookie.key}`}
                                    className="tooltip-mod"
                                    html={cookie.key}
                                  />
                                </td>
                                <td className="py-2 px-4 truncate">
                                  <span id={`cookie-value-${cookie.key}`}>{cookie.value}</span>
                                  <Tooltip
                                    anchorId={`cookie-value-${cookie.key}`}
                                    className="tooltip-mod"
                                    html={cookie.value}
                                  />
                                </td>
                                <td className="py-2 px-4 truncate">{cookie.path || '/'}</td>
                                <td className="py-2 px-4 truncate">
                                  <span id={`cookie-expires-${cookie.key}`}>
                                    {cookie.expires && moment(cookie.expires).isValid()
                                      ? new Date(cookie.expires).toLocaleString()
                                      : t('cookies.session')}
                                  </span>
                                  {cookie.expires && moment(cookie.expires).isValid() && (
                                    <Tooltip
                                      anchorId={`cookie-expires-${cookie.key}`}
                                      className="tooltip-mod"
                                      html={new Date(cookie.expires).toLocaleString()}
                                    />
                                  )}
                                </td>
                                <td className="py-2 px-4 text-center">{cookie.secure ? '?' : ''}</td>
                                <td className="py-2 px-4 text-center">{cookie.httpOnly ? '?' : ''}</td>
                                <td className="py-2 px-4">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditCookie(domainWithCookies.domain, cookie);
                                      }}
                                      className="edit-button"
                                    >
                                      <IconEdit strokeWidth={1.5} size={16} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCookie(domainWithCookies.domain, cookie.path, cookie.key);
                                      }}
                                      className="delete-button"
                                    >
                                      <IconTrash strokeWidth={1.5} size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Accordion.Content>
                  </Accordion.Item>
                ))}
              </Accordion>
            </div>
          )}
        </StyledWrapper>
      </Modal>
      {isModifyCookieModalOpen && (
        <ModifyCookieModal
          onClose={() => {
            setCookieToEdit(null);
            setCurrentDomain(null);
            setIsModifyCookieModalOpen(false);
          }}
          domain={currentDomain}
          cookie={cookieToEdit}
        />
      )}
      {domainToClear ? (
        <ClearDomainCookiesModal
          onClose={() => setDomainToClear(null)}
          domain={domainToClear}
          onClear={clearDomainCookiesAction}
        />
      ) : null}
      {cookieToDelete ? (
        <DeleteCookieModal
          onClose={() => setCookieToDelete(null)}
          cookieName={cookieToDelete.key}
          onDelete={deleteCookieAction}
        />
      ) : null}
    </>
  );
};

export default CollectionProperties;
