import React, { useState } from 'react';
import { isGitRepositoryUrl } from 'utils/git';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Button from 'ui/Button';
const GitHubTab = ({
  handleSubmit,
  setErrorMessage
}) => {
  const { t } = useTranslation();
  const [urlInput, setUrlInput] = useState('');

  const handleGitRepositoryImport = (url) => {
    if (!isGitRepositoryUrl(url)) {
      setErrorMessage(t('sidebar.import.invalidGitUrl'));
      return;
    }
    handleSubmit({ repositoryUrl: url, type: 'git-repository' });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (urlInput.trim()) {
      handleGitRepositoryImport(urlInput.trim());
    }
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="flex gap-2">
        <input
          id="gitUrlInput"
          data-testid="git-url-input"
          type="text"
          value={urlInput}
          autoFocus
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder={t('sidebar.import.gitUrlPlaceholder')}
          className="flex-1 px-3 py-1 textbox"
        />
        <Button
          type="submit"
          id="clone-git-button"
          disabled={!urlInput.trim()}
          variant="filled"
          color="primary"
          style={{ height: '100%' }}
        >
          {t('sidebar.import.clone')}
        </Button>
      </div>
    </form>
  );
};

export default GitHubTab;
