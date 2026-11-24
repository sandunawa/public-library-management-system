import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings, ShieldCheck, Clock, Coins, Save, RotateCcw, AlertCircle, BookMarked, Send, Download, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { PolicyService, CirculationPolicySettings } from '@/services/circulation/PolicyService';
import { TelegramBackupService, TelegramBackupConfig } from '@/services/circulation/TelegramBackupService';
import { toast } from 'sonner';

export const PolicySettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<CirculationPolicySettings>(() => PolicyService.getSettings());
  const [telegramConfig, setTelegramConfig] = useState<TelegramBackupConfig>(() => TelegramBackupService.getConfig());
  const [savedTelegramConfig, setSavedTelegramConfig] = useState<TelegramBackupConfig>(() => TelegramBackupService.getConfig());
  const [showToken, setShowToken] = useState(false);
  const [showChatId, setShowChatId] = useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [telegramProgress, setTelegramProgress] = useState(0);
  const [telegramStatusText, setTelegramStatusText] = useState('');

  const hasTelegramChanges =
    telegramConfig.botToken.trim() !== savedTelegramConfig.botToken.trim() ||
    telegramConfig.chatId.trim() !== savedTelegramConfig.chatId.trim();

  const handleChange = (key: keyof CirculationPolicySettings, value: number) => {
    setSettings((prev) => ({
      ...prev,
      [key]: Math.max(0, value),
    }));
  };

  const handleSaveTelegramOnly = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    TelegramBackupService.saveConfig(telegramConfig);
    setSavedTelegramConfig(TelegramBackupService.getConfig());
    toast.success('Telegram Bot Token & Chat ID සුරැකිණි (Saved successfully)!');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    PolicyService.saveSettings(settings);
    TelegramBackupService.saveConfig(telegramConfig);
    setSavedTelegramConfig(TelegramBackupService.getConfig());
    toast.success('Circulation Policies & Telegram Backup Settings saved successfully!');
  };

  const handleManualTelegramBackup = async () => {
    setIsSendingTelegram(true);
    setTelegramProgress(5);
    setTelegramStatusText('Starting backup task...');
    try {
      const res = await TelegramBackupService.sendBackupToTelegram((percent, text) => {
        setTelegramProgress(percent);
        setTelegramStatusText(text);
      });

      if (res.success) {
        setTelegramProgress(100);
        setTelegramStatusText('Backup delivered successfully to Telegram!');
        toast.success(res.message);
        setTelegramConfig(TelegramBackupService.getConfig());
      } else {
        toast.error(res.message);
        setTelegramStatusText(res.message);
      }
    } catch (err: any) {
      toast.error(`Telegram Dispatch Error: ${err.message}`);
      setTelegramStatusText(err.message);
    } finally {
      setTimeout(() => {
        setIsSendingTelegram(false);
      }, 1500);
    }
  };

  const handleDownloadBackupZip = async () => {
    try {
      const { blob, fileName } = await TelegramBackupService.generateBackupZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${fileName} to your computer.`);
    } catch (err: any) {
      toast.error('Could not generate ZIP archive: ' + err.message);
    }
  };

  const handleReset = () => {
    const defaults: CirculationPolicySettings = {
      maxLoans: 5,
      loanPeriodDays: 14,
      finePerDay: 10,
      gracePeriodDays: 0,
      fineCap: 1000,
    };
    setSettings(defaults);
    PolicyService.saveSettings(defaults);
    toast.info('Settings reset to system defaults.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            <span>Circulation Policy & Fine Settings (පොත් ණය ප්‍රතිපත්ති සහ දඩ මුදල්)</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Configure borrowing allowances, loan duration periods, and late return fine calculation rates
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleReset} className="text-xs gap-1.5 self-start sm:self-auto">
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Defaults
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Borrowing Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-primary" />
              <span>1. Student & Member Borrowing Quota (ණයට ගත හැකි උපරිම පොත් ගණන)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              එක් ශිෂ්‍යයෙකුට හෝ සාමාජිකයෙකුට එකවර ණයට ගෙන යාමට අවසර දෙන උපරිම පොත් ප්‍රමාණය තීරණය කරන්න.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Maximum Books Allowed Per Student (එක් සිසුවෙකුට දෙන උපරිම පොත් ගණන):
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={settings.maxLoans}
                    onChange={(e) => handleChange('maxLoans', parseInt(e.target.value) || 1)}
                    className="font-mono text-sm font-bold w-32"
                  />
                  <span className="text-xs text-muted-foreground">Books (පොත්)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Circulation desk එකේදී මෙම ගණන ඉක්මවා පොත් scan කිරීමට පද්ධතිය ඉඩ නොදෙයි.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Maximum Loan Duration (පොත් ළඟ තබා ගත හැකි උපරිම දින ගණන):
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={settings.loanPeriodDays}
                    onChange={(e) => handleChange('loanPeriodDays', parseInt(e.target.value) || 1)}
                    className="font-mono text-sm font-bold w-32"
                  />
                  <span className="text-xs text-muted-foreground">Days (දින)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  පොතක් නිකුත් කළ දිනයේ සිට ආපසු භාර දිය යුතු දිනය (Due Date) ස්වයංක්‍රීයව ගණනය වීමට මෙම දින ගණන යොදා ගනී.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fines & Penalties */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Coins className="w-5 h-5 text-warning" />
              <span>2. Late Return Fines (ප්‍රමාද ගාස්තු සහ දඩ මුදල් ගණනය කිරීම)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              නියමිත දිනයට පොත් ආපසු භාර නොදුන් විට එක් ප්‍රමාද දිනයකට අය කළ යුතු දඩ මුදල සකසන්න.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Fine Amount Per Overdue Day (ප්‍රමාද වන 1 දිනකට අය කරන මුදල):
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">LKR (රු.)</span>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={settings.finePerDay}
                    onChange={(e) => handleChange('finePerDay', parseFloat(e.target.value) || 0)}
                    className="font-mono text-sm font-bold w-32"
                  />
                  <span className="text-xs text-muted-foreground">Per Day (දිනකට)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ශිෂ්‍යයාගේ කාඩ්පත scan කළ විට හෝ පොත Check-in කරන විට ප්‍රමාද වූ දින ගණනට අදාළව ස්වයංක්‍රීයව මෙම මුදලින් දඩය ගණනය වේ.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Grace Period Days (දඩ රහිත සහන දින ගණන):
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={settings.gracePeriodDays}
                    onChange={(e) => handleChange('gracePeriodDays', parseInt(e.target.value) || 0)}
                    className="font-mono text-sm font-bold w-32"
                  />
                  <span className="text-xs text-muted-foreground">Days (දින)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  නියමිත දිනට පසු කිසිදු දඩයක් අය නොකරන සහන දින ගණන (සාමාන්‍යයෙන් 0 හෝ 1 දින).
                </p>
              </div>
            </div>

            <div className="pt-2 border-t text-xs text-muted-foreground flex items-center gap-2 bg-warning-soft p-3 rounded-lg border border-warning/30 text-warning-soft-foreground dark:text-foreground">
              <AlertCircle className="w-4 h-4 shrink-0 text-warning" />
              <span>
                <strong>උදාහරණයක් ලෙස:</strong> පොත ළඟ තබා ගත හැකි දින ගණන 14ක් සහ දිනකට දඩය රු. 10ක් ලෙස ලබා දුන් විට, පොත ලබා ගෙන දින 18ක් ගිය පසු භාර දීමට පැමිණියහොත් දින 4ක ප්‍රමාදය සඳහා රු. 40/- ක දඩ මුදලක් සාමාජික කාඩ්පතෙහි ක්ෂණිකව සටහන් වේ.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Automated Daily Telegram Cloud Backup */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Send className="w-5 h-5 text-info" />
                <span>3. Automated Daily Telegram ZIP Backup (දිනපතා Telegram උපස්ථය)</span>
              </span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-info-soft text-info font-bold border border-info/30">
                Telegram Bot API Connected
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              සෑම දිනකම පුස්තකාලයේ සාමාජිකයින්, පොත් නාමාවලිය, ණය වාර්තා සහ දඩ මුදල් සහිත සියලුම දත්ත සම්පීඩිත .ZIP Archive එකක් ලෙස Telegram වෙත ස්වයංක්‍රීයව යවනු ලැබේ.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Telegram Bot Token:</label>
                <div className="relative">
                  <Input
                    type={showToken ? 'text' : 'password'}
                    value={telegramConfig.botToken}
                    onChange={(e) => setTelegramConfig((prev) => ({ ...prev, botToken: e.target.value }))}
                    className="font-mono text-xs pr-10"
                    placeholder="e.g. 123456789:ABCdefGHIjklMNO..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    aria-label={showToken ? 'Hide token' : 'Show token'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Telegram Chat ID / User ID:</label>
                <div className="relative">
                  <Input
                    type={showChatId ? 'text' : 'password'}
                    value={telegramConfig.chatId}
                    onChange={(e) => setTelegramConfig((prev) => ({ ...prev, chatId: e.target.value }))}
                    className="font-mono text-xs pr-10"
                    placeholder="e.g. 123456789 or -100123456789"
                  />
                  <button
                    type="button"
                    onClick={() => setShowChatId(!showChatId)}
                    aria-label={showChatId ? 'Hide chat ID' : 'Show chat ID'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
                  >
                    {showChatId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Conditional Save Button - Only visible when Token or Chat ID is changed */}
            {hasTelegramChanges && (
              <div className="flex items-center justify-between p-2.5 px-3 bg-warning-soft border border-warning/30 rounded-lg animate-in fade-in slide-in-from-top-1">
                <span className="text-xs text-foreground dark:text-foreground font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-warning animate-pulse" />
                  Telegram Token හෝ Chat ID වෙනස් කර ඇත. කරුණාකර වෙනස්කම් Save කරන්න.
                </span>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveTelegramOnly}
                  className="bg-success hover:bg-success/90 text-white text-xs font-bold gap-1.5 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Telegram Credentials
                </Button>
              </div>
            )}

            {/* Live Progress Bar when sending */}
            {isSendingTelegram && (
              <div className="p-3.5 bg-info-soft border border-info/30 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex justify-between items-center text-xs font-semibold text-info">
                  <span className="flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 animate-pulse text-info" />
                    {telegramStatusText || 'Uploading to Telegram...'}
                  </span>
                  <span className="font-mono font-bold text-sm text-info">{telegramProgress}%</span>
                </div>
                <div className="w-full bg-info-soft dark:bg-card/60 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-info h-2.5 rounded-full transition-all duration-300 ease-out shadow-sm"
                    style={{ width: `${telegramProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="p-3 bg-muted/40 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Auto Daily Backup is Active
                </div>
                <div className="text-muted-foreground text-xs">
                  Last Backup: {telegramConfig.lastBackupAt ? new Date(telegramConfig.lastBackupAt).toLocaleString() : 'Not dispatched yet today'}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadBackupZip}
                  className="text-xs gap-1.5 w-full sm:w-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download ZIP
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSendingTelegram}
                  onClick={handleManualTelegramBackup}
                  className="text-xs font-bold gap-1.5 bg-info hover:bg-info/90 text-white w-full sm:w-auto shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSendingTelegram ? 'Sending ZIP...' : 'Send ZIP to Telegram Now'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button type="submit" size="lg" className="font-bold gap-2 bg-primary text-primary-foreground shadow-md">
            <Save className="w-4 h-4" />
            Save Policy Settings (ප්‍රතිපත්ති සුරකින්න)
          </Button>
        </div>
      </form>
    </div>
  );
};
