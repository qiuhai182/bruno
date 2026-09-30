import { useTheme } from '../../../../providers/Theme';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setIsOpeningCollection } from 'providers/ReduxStore/slices/app';

import styled from 'styled-components';
import StyledWrapper from './StyledWrapper';

const LinkStyle = styled.span`
  color: ${(props) => props.theme['text-link']};
`;

const CreateOrOpenCollection = ({ onCreateClick }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const handleOpenCollection = () => {
    dispatch(setIsOpeningCollection(true));
  };
  const CreateLink = () => (
    <LinkStyle
      className="underline text-link cursor-pointer"
      theme={theme}
      onClick={onCreateClick}
    >
      {t('sidebar.create')}
    </LinkStyle>
  );
  const OpenLink = () => (
    <LinkStyle className="underline text-link cursor-pointer" theme={theme} onClick={() => handleOpenCollection(true)}>
      {t('sidebar.open')}
    </LinkStyle>
  );

  return (
    <StyledWrapper className="px-2 mt-4">
      <div className="text-xs text-center">
        <div>{t('sidebar.createOrOpen.noCollectionsFound')}</div>
        <div className="mt-2">
          <CreateLink /> {t('sidebar.createOrOpen.or')} <OpenLink /> {t('sidebar.createOrOpen.collection')}
        </div>
      </div>
    </StyledWrapper>
  );
};

export default CreateOrOpenCollection;
