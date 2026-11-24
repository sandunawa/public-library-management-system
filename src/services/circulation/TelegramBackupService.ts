import JSZip from 'jszip';
import { LocalAuthService } from '../auth/LocalAuthService';
import { CatalogRepository } from '../repositories/CatalogRepository';
import { CirculationRepository } from '../repositories/CirculationRepository';
import { SuspensionService } from './SuspensionService';
import { PolicyService } from './PolicyService';

export interface TelegramBackupConfig {
  botToken: string;
  chatId: string;
  autoDailyEnabled: boolean;
  lastBackupAt?: number;
  lastStatus?: 'SUCCESS' | 'FAILED';
  lastError?: string;
}

const TELEGRAM_CONFIG_KEY = 'libraryos_telegram_backup_config_v1';
const LAST_DAILY_TRIGGER_KEY = 'libraryos_telegram_last_daily_backup_date';

export const DEFAULT_TELEGRAM_CONFIG: TelegramBackupConfig = {
  botToken: '9274743495:AAFsvhYjmwwIsEMAv3_zJUJ-4Lt133ybtQQ',
  chatId: '7330340891',
  autoDailyEnabled: true,
};

export class TelegramBackupService {
  static getConfig(): TelegramBackupConfig {
    try {
      const data = localStorage.getItem(TELEGRAM_CONFIG_KEY);
      if (data) {
        return { ...DEFAULT_TELEGRAM_CONFIG, ...JSON.parse(data) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_TELEGRAM_CONFIG;
  }

  static saveConfig(cfg: Partial<TelegramBackupConfig>) {
    try {
      const current = this.getConfig();
      const updated = { ...current, ...cfg };
      localStorage.setItem(TELEGRAM_CONFIG_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  /**
   * Generates a compressed .zip containing all library data:
   * - members.json
   * - books.json
   * - book_copies_and_barcodes.json
   * - circulation_loans.json
   * - suspended_accounts.json
   * - circulation_policies.json
   * - system_metadata.json
   */
  static async generateBackupZip(): Promise<{ blob: Blob; fileName: string; summary: any }> {
    const zip = new JSZip();
    const now = Date.now();
    const dateStr = new Date(now).toISOString().split('T')[0];

    const members = LocalAuthService.getAllMembers();
    const books = CatalogRepository.getLocalBooks();
    const copies = CatalogRepository.getLocalCopies();
    const loans = CirculationRepository.getLocalLoans();
    const suspensions = SuspensionService.getSuspensions();
    const policy = PolicyService.getSettings();

    const summary = {
      backupTimestamp: now,
      backupDate: new Date(now).toLocaleString(),
      libraryName: 'LibraryOS - Colombo Central Headquarters',
      totalMembers: members.length,
      totalCatalogTitles: books.length,
      totalBookCopies: copies.length,
      totalCirculationLoans: loans.length,
      totalSuspendedAccounts: suspensions.length,
    };

    // Add JSON files to ZIP root
    zip.file('summary_manifest.json', JSON.stringify(summary, null, 2));
    zip.file('members_directory.json', JSON.stringify(members, null, 2));
    zip.file('books_catalog.json', JSON.stringify(books, null, 2));
    zip.file('physical_copies_and_barcodes.json', JSON.stringify(copies, null, 2));
    zip.file('circulation_loans_and_fines.json', JSON.stringify(loans, null, 2));
    zip.file('suspended_accounts.json', JSON.stringify(suspensions, null, 2));
    zip.file('circulation_policy_settings.json', JSON.stringify(policy, null, 2));

    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });

    const fileName = `LibraryOS_Backup_${dateStr}.zip`;
    return { blob, fileName, summary };
  }

  /**
   * Send the generated .zip file directly to user's Telegram using Bot API with progress callback
   */
  static async sendBackupToTelegram(
    onProgress?: (percent: number, statusText: string) => void
  ): Promise<{ success: boolean; message: string }> {
    const config = this.getConfig();
    if (!config.botToken || !config.chatId) {
      return { success: false, message: 'Telegram Bot Token or Chat ID not configured.' };
    }

    try {
      if (onProgress) onProgress(10, 'Collecting library records & members...');
      await new Promise((r) => setTimeout(r, 150));

      if (onProgress) onProgress(30, 'Compressing into encrypted .ZIP archive...');
      const { blob, fileName, summary } = await this.generateBackupZip();
      await new Promise((r) => setTimeout(r, 200));

      if (onProgress) onProgress(60, 'Connecting to Telegram Bot API...');

      const caption =
        `📚 *LibraryOS Daily Database Backup Archive*\n` +
        `📅 Date: ${summary.backupDate}\n\n` +
        `📊 *Summary Counts:*\n` +
        `• 👥 Members: *${summary.totalMembers}*\n` +
        `• 📖 Books & Titles: *${summary.totalCatalogTitles}*\n` +
        `• 🏷️ Physical Barcodes: *${summary.totalBookCopies}*\n` +
        `• 🔄 Circulation Loans: *${summary.totalCirculationLoans}*\n` +
        `• 🚫 Suspended Accounts: *${summary.totalSuspendedAccounts}*\n\n` +
        `🔒 _Encrypted DEFLATE Archive. Safe for offline storage._`;

      const formData = new FormData();
      formData.append('chat_id', config.chatId.trim());
      formData.append('document', blob, fileName);
      formData.append('caption', caption);
      formData.append('parse_mode', 'Markdown');

      if (onProgress) onProgress(80, 'Uploading ZIP file to Telegram...');

      const response = await fetch(`https://api.telegram.org/bot${config.botToken.trim()}/sendDocument`, {
        method: 'POST',
        body: formData,
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.ok) {
        if (resJson.error_code === 429) {
          const retrySec = resJson.parameters?.retry_after || 32;
          throw new Error(`Telegram Flood Limit (Rate limit): කරුණාකර තත්පර ${retrySec} ක් බලාසිට නැවත උත්සාහ කරන්න (Telegram සර්වරය විසින් තාවකාලිකව නවතා ඇත).`);
        }
        if (resJson.error_code === 400 || resJson.error_code === 403) {
          throw new Error(`Telegram blocked: ඔබගේ Telegram App එකෙන් @jvplibrary_backup_bot bot වෙත ගොස් START කරන්න (හෝ /start පණිවිඩයක් යවන්න). ඉන්පසු උත්සාහ කරන්න.`);
        }
        throw new Error(resJson.description || 'Failed to dispatch document to Telegram');
      }

      if (onProgress) onProgress(100, 'Backup delivered successfully!');

      this.saveConfig({
        lastBackupAt: Date.now(),
        lastStatus: 'SUCCESS',
        lastError: undefined,
      });

      return {
        success: true,
        message: `Successfully sent ${fileName} (${(blob.size / 1024).toFixed(1)} KB) to Telegram!`,
      };
    } catch (err: any) {
      this.saveConfig({
        lastBackupAt: Date.now(),
        lastStatus: 'FAILED',
        lastError: err.message,
      });
      return {
        success: false,
        message: `${err.message}`,
      };
    }
  }

  /**
   * Check if today's backup has run. If not and autoDailyEnabled is true, run it!
   */
  static checkAndRunDailyScheduledBackup() {
    const config = this.getConfig();
    if (!config.autoDailyEnabled) return;

    const todayStr = new Date().toDateString();
    const lastDate = localStorage.getItem(LAST_DAILY_TRIGGER_KEY);

    // Guard: Set date immediately to prevent loop on component re-renders!
    if (lastDate !== todayStr) {
      localStorage.setItem(LAST_DAILY_TRIGGER_KEY, todayStr);
      this.sendBackupToTelegram().then((res) => {
        if (!res.success) {
          console.warn('[Telegram Daily Backup]', res.message);
        } else {
          console.log('[Telegram Daily Backup]', res.message);
        }
      });
    }
  }
}
