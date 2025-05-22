import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SettingsPage from '../SettingsPage';

// Mock antd message
const mockMessageSuccess = jest.fn();
const mockMessageError = jest.fn();
jest.mock('antd', () => {
  const antd = jest.requireActual('antd');
  return {
    ...antd,
    message: {
      success: mockMessageSuccess,
      error: mockMessageError,
    },
  };
});

// Mock @nocobase/client hooks
const mockUseSystemSettings = jest.fn();
const mockUseAPIClient = jest.fn();
const mockUseTranslation = jest.fn();
const mockRefresh = jest.fn();
const mockUpdateRecordNumber = jest.fn();

jest.mock('@nocobase/client', () => {
  const client = jest.requireActual('@nocobase/client');
  return {
    ...client,
    useSystemSettings: () => mockUseSystemSettings(),
    useAPIClient: () => mockUseAPIClient(),
    useTranslation: () => mockUseTranslation(),
  };
});

describe('SettingsPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockMessageSuccess.mockClear();
    mockMessageError.mockClear();
    mockRefresh.mockClear();
    mockUpdateRecordNumber.mockClear();

    mockUseSystemSettings.mockReturnValue({
      options: {
        pluginLoginInfo: {
          recordNumber: '10',
        },
      },
      refresh: mockRefresh,
    });

    mockUseAPIClient.mockReturnValue({
      resource: jest.fn().mockReturnValue({
        updateRecordNumber: mockUpdateRecordNumber,
      }),
    });

    mockUseTranslation.mockReturnValue({
      t: (key) => key, // Simple pass-through translation
    });
  });

  test('renders correctly and displays initial record number', () => {
    const { getByLabelText } = render(<SettingsPage />);
    const recordNumberInput = getByLabelText('Record Number') as HTMLInputElement;
    expect(recordNumberInput).toBeInTheDocument();
    expect(recordNumberInput.value).toBe('10');
  });

  test('allows input change and calls API on save', async () => {
    mockUpdateRecordNumber.mockResolvedValue({}); // Simulate successful API call

    const { getByLabelText, getByText } = render(<SettingsPage />);
    const recordNumberInput = getByLabelText('Record Number') as HTMLInputElement;
    const saveButton = getByText('Save');

    // Simulate user typing a new value
    fireEvent.change(recordNumberInput, { target: { value: '20' } });
    expect(recordNumberInput.value).toBe('20');

    // Simulate clicking the save button
    fireEvent.click(saveButton);

    // Wait for API call and message
    await waitFor(() => {
      expect(mockUpdateRecordNumber).toHaveBeenCalledWith({ values: { recordNumber: '20' } });
    });
    await waitFor(() => {
      expect(mockMessageSuccess).toHaveBeenCalledWith('Saved successfully');
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  test('shows error message on API failure', async () => {
    const errorMessage = 'API Error';
    mockUpdateRecordNumber.mockRejectedValue(new Error(errorMessage)); // Simulate API error

    const { getByLabelText, getByText } = render(<SettingsPage />);
    const recordNumberInput = getByLabelText('Record Number') as HTMLInputElement;
    const saveButton = getByText('Save');

    fireEvent.change(recordNumberInput, { target: { value: '30' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateRecordNumber).toHaveBeenCalledWith({ values: { recordNumber: '30' } });
    });
    await waitFor(() => {
      expect(mockMessageError).toHaveBeenCalledWith('Failed to save: ' + errorMessage);
    });
  });
});
