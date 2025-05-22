import React from 'react';
import { useSystemSettings, useTranslation } from '@nocobase/client';

const RecordNumberDisplay = () => {
  const { t } = useTranslation();
  const systemSettings = useSystemSettings();
  const recordNumber = systemSettings?.data?.data?.options?.pluginLoginInfo?.recordNumber;

  if (!recordNumber) {
    return null;
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '10px', color: '#888' }}>
      {t('Record Number Display', { ns: 'login-info' })}: {recordNumber}
    </div>
  );
};

export default RecordNumberDisplay;
