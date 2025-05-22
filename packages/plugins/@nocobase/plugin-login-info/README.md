# Login Page Info Plugin

## Purpose

The Login Page Info plugin allows administrators to configure and display a custom piece of information or a short text string on the NocoBase system login page. This can be used to show important notices, version numbers, or any other relevant brief information to users before they log in.

## Features

*   **Admin Configuration**: Provides a settings page for administrators to define the text to be displayed.
*   **Login Page Display**: Shows the configured information prominently on the system login page.

## Configuration

1.  **Accessing Settings**:
    *   Navigate to `Admin > Settings > Login Page Info Settings`.
    *   (The settings page will be listed under "System settings" or a similar category, usually identifiable by the plugin's display name: "Login Info Settings").

2.  **Setting the Information**:
    *   In the settings page, you will find a field labeled **"Record Number"**.
    *   Although labeled "Record Number", this field can be used to store any short text string you wish to display on the login page (e.g., "Max login records to keep: 100", "System Update: Jan 5th", "Version: 1.2.3").
    *   Enter your desired text and click "Save".

The information will be updated and displayed on the login page.

## How it Works (For Developers/Maintainers)

*   **Storage**: The configured information string is stored in the `systemSettings` collection, specifically within the `options.pluginLoginInfo.recordNumber` field.
*   **Display on Login Page**:
    *   The plugin attempts to integrate the display by enhancing the `AuthLayout` component via component override.
    *   If this method is not available or fails, it falls back to DOM manipulation to inject the information text, typically before the "Powered By" section on the login page.
    *   The displayed text is fetched from the system settings when the login page loads.

## Notes

*   Keep the information string relatively short to ensure it displays well on the login page.
*   The plugin requires administrator privileges to configure.
