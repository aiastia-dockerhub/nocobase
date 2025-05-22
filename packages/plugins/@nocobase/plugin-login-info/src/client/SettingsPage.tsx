import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useSystemSettings, useAPIClient, useTranslation } from '@nocobase/client';

const SettingsPage = () => {
  const { t } = useTranslation();
  const systemSettings = useSystemSettings();
  const api = useAPIClient();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const initialRecordNumber = systemSettings?.options?.pluginLoginInfo?.recordNumber || '10';

  useEffect(() => {
    form.setFieldsValue({ recordNumber: initialRecordNumber });
  }, [initialRecordNumber, form]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await api.resource('loginInfo').updateRecordNumber({ values: { recordNumber: values.recordNumber } });
      // Update system settings context if necessary, though it might refresh automatically
      // Forcing a refresh or directly updating the context might be needed
      // For now, we rely on potential auto-refresh or user navigating away and back
      systemSettings.refresh();
      message.success(t('Saved successfully'));
    } catch (error) {
      message.error(t('Failed to save: ') + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSave}>
      <Form.Item
        label={t('Record Number')}
        name="recordNumber"
        rules={[{ required: true, message: t('Please input the record number!') }]}
      >
        <Input type="number" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          {t('Save')}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default SettingsPage;
