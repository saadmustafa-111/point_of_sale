# POS Client Delivery Guide

This POS is designed for one main/admin computer and optional cashier computers on the same Wi-Fi/LAN.

## 1. Main/Admin Computer

Use the main computer as the server. This computer stores the central SQLite database in the app user-data folder and runs the backend API.

1. Install the POS app.
2. Open the app.
3. On first run, choose **Server / Main Computer**.
4. The app creates the production SQLite database automatically if it does not exist.
5. The app runs database migrations automatically.
6. The app starts the backend on port `3000`.
7. If this is a fresh server database, the app shows **Create First Admin**.
8. Enter the shop/POS name, admin name, username, and password.
9. Login with the admin account you created.
10. Keep this computer turned on during business hours.

The server API will be available as:

```text
http://SHOP-SERVER:3000/api/v1
```

If `SHOP-SERVER` does not resolve on the network, use the main computer IP address:

```text
http://192.168.1.10:3000/api/v1
```

The actual IP is shown in **Settings > Server Connection** on the main computer.

## 2. Cashier/Client Computer

Use client mode for cashier computers. Client computers do not start their own backend and do not use their own database.

1. Install the POS app.
2. Open the app.
3. On first run, choose **Client / Cashier Computer**.
4. Enter the server API URL:

```text
http://SHOP-SERVER:3000/api/v1
```

5. Click **Test Connection**.
6. If connection succeeds, save client mode.
7. Login with a cashier account.

If connection fails, enter the main computer IP manually:

```text
http://MAIN_PC_IP:3000/api/v1
```

Example:

```text
http://192.168.1.10:3000/api/v1
```

## 3. Network Requirements

- All computers must be connected to the same Wi-Fi/router/LAN.
- The main/admin computer must stay turned on.
- The backend runs on port `3000`.
- The main computer firewall must allow incoming connections on port `3000`.
- All sales, products, stock, users, customers, and reports are stored on the main computer.
- The production database is created automatically in the app user-data folder on the main computer.

If the main computer is off, cashier computers cannot login or create sales.

## 4. Settings

Open **Settings** as admin to configure:

- POS/software name
- Shop name, address, phone, currency
- Tax rate
- Receipt format
- Current app mode
- Current API URL
- Server LAN URLs
- Connection test
- Default printer on this computer
- Silent print
- Auto print after sale
- 58mm, 80mm, or A4 receipt format

Only admins can change business settings.

## 4.2 Receipt Printer Setup

Receipt printer settings are saved locally on each computer because printer names are different on every PC.

1. Install the thermal printer driver in Windows/macOS first.
2. Open the POS app.
3. Login as admin.
4. Open **Settings > Receipt, Printer & Tax**.
5. Select the receipt format:
   - **Thermal Receipt (80mm)** for standard 80mm receipt printers.
   - **Thermal Receipt (58mm)** for small 58mm receipt printers.
   - **A4 Invoice** for normal office printers.
6. Select the default printer for this computer.
7. Click **Save Printer Settings**.
8. Click **Print Test Page**.
9. Enable **Silent Print** only after the test page prints correctly.
10. Enable **Auto Print After Sale** if receipts should print immediately after checkout.

If no default printer is selected or silent print is off, the system uses the normal operating system print dialog.

## 4.1 Admin and Cashier Accounts

For production delivery, create the first admin from the **Create First Admin** screen on the server/main computer.

Do not depend on demo seed credentials for a real client. The seed file is only for development/testing.

After the first admin logs in:

1. Open **Users**.
2. Click **Add User**.
3. Create cashier accounts.
4. Set role to **Cashier**.
5. Give each cashier their own username and password.

## 5. Health Check

Use this URL to confirm the backend is running:

```text
http://MAIN_PC_IP:3000/api/v1/health
```

Expected response:

```json
{
  "status": "ok",
  "app": "POS Backend",
  "timestamp": "..."
}
```

## 6. Build Commands

From the project folder:

```bash
cd /Users/saaddev/electronic-pos/point_of_sale
```

Build the app:

```bash
npm run build
```

Build Windows ZIP package:

```bash
npm run build:win
```

Build Mac app/DMG:

```bash
npm run build:mac
```

Development mode:

```bash
npm run dev
```

## 7. GitHub Release Delivery

Production installers should be delivered through **GitHub Releases**.

When the developer pushes a version tag such as `v1.0.0`, GitHub Actions builds the Windows and macOS installers automatically and uploads them to:

```text
GitHub Repo > Releases > v1.0.0
```

### Developer Release Steps

From the project folder:

```bash
cd /Users/saaddev/electronic-pos/point_of_sale
```

Update the app version in `package.json`:

```bash
npm version patch
```

Commit and push the release tag:

```bash
git push origin main --tags
```

Or create a specific tag manually:

```bash
git tag v1.0.0
git push origin main
git push origin v1.0.0
```

GitHub Actions will then:

1. Install root, backend, and renderer dependencies.
2. Generate the Prisma client.
3. Build the NestJS backend.
4. Build the React/Vite renderer.
5. Build the Electron Windows ZIP package on `windows-latest`.
6. Build the Electron macOS DMG on `macos-latest`.
7. Upload the installers to the GitHub Release.

### Client Download Files

For Windows clients:

```text
Download POS-System-1.0.4-win-x64.zip from GitHub Releases.
```

For Mac clients:

```text
Download the .dmg file from GitHub Releases.
```

Install or run the same app on both the main/server computer and cashier/client computers. The difference is selected on first run:

- Main/admin computer: choose **Server / Main Computer**.
- Cashier computer: choose **Client / Cashier Computer** and enter the server API URL.

### Windows ZIP Delivery

The Windows release is delivered as a ZIP file. This avoids the slow single-EXE portable packing step and is more reliable for this POS because the backend runtime contains many Node/Prisma files.

1. Download:

```text
POS-System-1.0.4-win-x64.zip
```

2. Right-click the ZIP and choose **Extract All**.
3. Extract it to:

```text
C:\POS-System\
```

4. Open the extracted folder.
5. Open `POS System.exe`.
6. Right-click `POS System.exe` and choose **Create shortcut**.
7. Move the shortcut to the Desktop.
8. On the main/admin PC, choose **Server / Main Computer**.
9. On cashier PCs, choose **Client / Cashier Computer**.

Do not delete the `C:\POS-System\` folder after setup.

The ZIP version works the same after extraction, but it does not create Start Menu shortcuts automatically. POS data is still saved in the app user-data folder and server database location, not inside the ZIP file. The main/server PC must still stay turned on for cashier computers to login and create sales.

### Production Database Location

Do not package, copy, or depend on a development `pos.db` file for client delivery.

On the main/server computer, the POS creates the production SQLite database automatically on first server startup. The database is stored in Electron's app user-data folder as:

```text
pos.db
```

The backend uses this writable database URL:

```text
file:<APP_USER_DATA>/pos.db
```

The app also runs Prisma migrations automatically before starting the backend. If no admin exists in this fresh database, the app shows **Create First Admin**.

Do not delete the app user-data folder after setup. Deleting it removes the production database and local machine settings.

### Code Signing Note

Do not store signing certificates, passwords, or other secrets directly in the repository.

The current GitHub Actions workflow uses the default `GITHUB_TOKEN` only for creating the GitHub Release.

If code signing is not configured:

- Windows may show a SmartScreen warning.
- macOS may show an unidentified developer warning.

For professional public distribution, add Windows and macOS code signing later using GitHub Actions secrets.

## 8. First Delivery Test

On the main computer:

1. Open app.
2. Select Server mode.
3. Create first admin if prompted.
4. Login as admin.
5. Create cashier users from Users page.
6. Add or verify products.
7. Check Settings > Server Connection.
8. Note the LAN URL.

On cashier computer:

1. Open app.
2. Select Client mode.
3. Enter main computer API URL.
4. Test connection.
5. Login as cashier.
6. Create a test sale.

Back on admin computer:

1. Open dashboard/reports.
2. Confirm cashier sale appears.
3. Confirm stock decreased.
4. Print a receipt.

## 9. Backup Note

Automatic backup/restore is not implemented yet. Until it is added, regularly back up the server computer production database file from the app user-data folder.

The packaged app stores its production database in the app user-data folder on the server computer. Keep this server computer safe and backed up. A useful backup must copy the runtime `pos.db` file, not a development or packaged database file.
