import { LoanPolicy } from '@libraryos/shared';

const POLICY_SETTINGS_KEY = 'libraryos_circulation_policy_settings_v1';

export interface CirculationPolicySettings {
  maxLoans: number;         // උපරිම ණයට දිය හැකි පොත් ගණන (Default: 5)
  loanPeriodDays: number;   // ළඟ තබා ගත හැකි උපරිම දින ගණන (Default: 14)
  finePerDay: number;       // ප්‍රමාද වන එක් දිනකට අය කරන මුදල (LKR) (Default: 10)
  gracePeriodDays: number;  // දඩ මුදලක් අය නොකරන සහන දින ගණන (Default: 0)
  fineCap: number;          // උපරිම දඩ මුදල (Default: 1000)
}

const DEFAULT_SETTINGS: CirculationPolicySettings = {
  maxLoans: 5,
  loanPeriodDays: 14,
  finePerDay: 10,
  gracePeriodDays: 0,
  fineCap: 1000,
};

export class PolicyService {
  static getSettings(): CirculationPolicySettings {
    try {
      const data = localStorage.getItem(POLICY_SETTINGS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          maxLoans: Number(parsed.maxLoans) || DEFAULT_SETTINGS.maxLoans,
          loanPeriodDays: Number(parsed.loanPeriodDays) || DEFAULT_SETTINGS.loanPeriodDays,
          finePerDay: Number(parsed.finePerDay) || DEFAULT_SETTINGS.finePerDay,
          gracePeriodDays: Number(parsed.gracePeriodDays) || DEFAULT_SETTINGS.gracePeriodDays,
          fineCap: Number(parsed.fineCap) || DEFAULT_SETTINGS.fineCap,
        };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  }

  static saveSettings(settings: CirculationPolicySettings) {
    try {
      localStorage.setItem(POLICY_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }

  static toLoanPolicy(): LoanPolicy {
    const s = this.getSettings();
    return {
      id: 'active-policy',
      name: 'Standard Library Circulation Policy',
      membershipType: 'STUDENT',
      materialType: 'PRINT',
      maxLoans: s.maxLoans,
      loanPeriodDays: s.loanPeriodDays,
      maxRenewals: 2,
      finePerDay: s.finePerDay,
      gracePeriodDays: s.gracePeriodDays,
      fineCap: s.fineCap,
      holdPeriodDays: 7,
      isActive: true,
    };
  }
}
