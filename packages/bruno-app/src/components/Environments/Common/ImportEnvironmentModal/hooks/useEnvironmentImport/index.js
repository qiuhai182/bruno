import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import i18n from '../../../../../../i18n';
import importPostmanEnvironment from 'utils/importers/postman-environment';
import importBrunoEnvironment from 'utils/importers/bruno-environment';
import { readMultipleFiles } from 'utils/importers/file-reader';
import { toastError } from 'utils/common/error';
import { generateCopyName, normalizeEnvName, orderEnvironmentsByInheritance } from 'utils/environments';
import {
  buildReviewItems,
  detectEnvironmentFormat,
  ENV_STATUS,
  IMPORT_STEPS,
  initialResolutions,
  initialSelection,
  RESOLUTION_TYPES
} from '../../utils';
import { useEnvironmentTarget } from '../useEnvironmentTarget';

export { ENV_STATUS, IMPORT_STEPS };

const parseEnvironmentFiles = async (parsedFiles) => {
  const valid = [];
  const invalid = [];

  for (const file of parsedFiles) {
    try {
      const format = detectEnvironmentFormat(file.content);
      const result = format === 'postman'
        ? await importPostmanEnvironment([file])
        : await importBrunoEnvironment([file]);
      valid.push(...result.valid);
      invalid.push(...result.invalid);
    } catch (err) {
      invalid.push({ fileName: file.fileName || i18n.t('environments.import.unknownFile'), error: i18n.t('environments.import.couldNotBeRead') });
    }
  }

  return { valid, invalid };
};

export const useEnvironmentImport = (type, collection, onClose, onEnvironmentCreated) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(IMPORT_STEPS.UPLOAD);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [resolutions, setResolutions] = useState(new Map());
  const [isImporting, setIsImporting] = useState(false);

  const { existingNames, getExistingEnv, saveEnv, createEnv } = useEnvironmentTarget(type, collection);

  const commitEnvironments = async (environmentsToImport, itemResolutions) => {
    let importedCount = 0;
    let failedCount = 0;
    const currentExistingNames = [...existingNames];

    const isNameDuplicate = (envName) => currentExistingNames.some((existingName) => normalizeEnvName(existingName) === normalizeEnvName(envName));
    const replacedNames = new Set();
    // A parent imported alongside its child can land under a different name 潩 a copy suffix, or the
    // name of the environment it replaced 潩 and the child's `extends` has to follow it there.
    const importedNames = new Map();
    const updateImportedNames = (sourceName, landedName) => {
      if (!importedNames.has(sourceName)) {
        importedNames.set(sourceName, landedName);
      }
    };
    const inheritedNameFor = (environment) =>
      typeof environment.extends === 'string'
        ? importedNames.get(environment.extends) ?? environment.extends
        : environment.extends;

    setIsImporting(true);
    for (const environment of orderEnvironmentsByInheritance(environmentsToImport)) {
      try {
        const isDuplicate = environment.status === ENV_STATUS.DUPLICATE;
        const environmentToImport = { ...environment, extends: inheritedNameFor(environment) };

        if (isDuplicate) {
          const resolution = itemResolutions.get(environment.id) || RESOLUTION_TYPES.CREATE_NEW;
          const normalizedName = normalizeEnvName(environment.name);
          if (resolution === RESOLUTION_TYPES.REPLACE && !replacedNames.has(normalizedName)) {
            const existingEnv = getExistingEnv(environment.name);
            if (existingEnv) {
              await saveEnv(environmentToImport, existingEnv);
              replacedNames.add(normalizedName);
              updateImportedNames(environment.name, existingEnv.name);
              importedCount++;
            } else {
              throw new Error(`Environment ${environment.name} not found for replacement`);
            }
          } else {
            // copy
            const copyName = generateCopyName(environment.name, currentExistingNames);
            currentExistingNames.push(copyName);
            await createEnv(copyName, environmentToImport);
            updateImportedNames(environment.name, copyName);
            importedCount++;
          }
        } else {
          const name = isNameDuplicate(environment.name)
            ? generateCopyName(environment.name, currentExistingNames)
            : environment.name;
          currentExistingNames.push(name);
          await createEnv(name, environmentToImport);
          updateImportedNames(environment.name, name);
          importedCount++;
        }
      } catch (error) {
        failedCount++;
      }
    }
    setIsImporting(false);

    if (failedCount > 0) {
      toastError(new Error(t('environments.import.failedCount', { num: failedCount })), t('environments.import.partialSuccess', { imported: importedCount, failed: failedCount }));
    } else if (importedCount > 0) {
      toast.success(importedCount > 1 ? t('environments.import.successOther', { num: importedCount }) : t('environments.import.successOne'));
    }

    onClose();
    if (onEnvironmentCreated) {
      onEnvironmentCreated();
    }
  };

  const handleImportEnvironment = async (files) => {
    if (isImporting) return;
    try {
      setIsImporting(true);

      const { parsedFiles, invalidFiles } = await readMultipleFiles(Array.from(files));
      const { valid, invalid } = await parseEnvironmentFiles(parsedFiles);

      const reviewItems = buildReviewItems({
        valid,
        invalid: [...invalidFiles, ...invalid],
        existingNames
      });

      setItems(reviewItems);
      setSelected(initialSelection(reviewItems));
      setResolutions(initialResolutions(reviewItems));
      setStep(IMPORT_STEPS.REVIEW);
    } catch (err) {
      toastError(err, t('environments.import.importFailed'));
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (isImporting) return;
    const environmentsToImport = items.filter((env) => (env.status === ENV_STATUS.NEW || env.status === ENV_STATUS.DUPLICATE) && selected.has(env.id));

    if (environmentsToImport.length === 0) {
      toast.error(t('environments.import.noneSelected'));
      return;
    }

    await commitEnvironments(environmentsToImport, resolutions);
  };

  return {
    step,
    isImporting,
    items,
    selected,
    setSelected,
    resolutions,
    setResolutions,
    handleImportEnvironment,
    handleConfirmImport
  };
};
