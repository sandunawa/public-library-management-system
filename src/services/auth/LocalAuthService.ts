import { UserRole, MemberProfile } from '@libraryos/shared';
import { generate100SampleStudents } from '@/data/sample100Students';

// Keys for LocalStorage
const USERS_KEY = 'libraryos_local_users';
const CURRENT_USER_KEY = 'libraryos_current_user';

export interface LocalUser {
  uid: string;
  email: string;
  password?: string;
  role: UserRole;
  profile: MemberProfile;
}

// In-memory runtime cache to eliminate LocalStorage quota bottlenecks
let inMemoryUsers: LocalUser[] | null = null;
let inMemoryCurrentUser: LocalUser | null = null;

export class LocalAuthService {
  private static cleanOldStorageIfQuotaExceeded() {
    try {
      // Clear redundant or old keys if browser hits quota
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('_v1') || key.includes('temp') || key.includes('debug'))) {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // ignore
    }
  }

  static seed100SampleMembers(): LocalUser[] {
    const students = generate100SampleStudents();
    const demoAdmin: LocalUser = {
      uid: 'staff_admin_01',
      email: 'admin@library.lk',
      password: 'Admin1234',
      role: 'SUPER_ADMIN',
      profile: {
        id: 'staff_admin_01',
        memberIdNumber: 'STAFF-001',
        fullName: 'Chief Administrative Librarian',
        email: 'admin@library.lk',
        phone: '+94 11 269 3152',
        dob: '1985-01-01',
        address: 'Library Headquarters, Colombo 07',
        district: 'Colombo',
        membershipType: 'GENERAL',
        status: 'ACTIVE',
        homeBranchId: 'branch-colombo-hq',
        preferredLanguage: 'en',
        borrowingHistoryOptIn: true,
        activeLoansCount: 0,
        unpaidFinesTotal: 0,
        expiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };

    const initialUsers = [demoAdmin, ...students];
    inMemoryUsers = initialUsers;
    this.saveUsers(initialUsers);
    return initialUsers;
  }

  static getStoredUsers(): LocalUser[] {
    if (inMemoryUsers && inMemoryUsers.length > 0) {
      return inMemoryUsers;
    }

    try {
      const data = localStorage.getItem(USERS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryUsers = parsed;
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    // Auto-seed demo admin and 100 students if none exist!
    const students = generate100SampleStudents();
    const demoAdmin: LocalUser = {
      uid: 'staff_admin_01',
      email: 'admin@library.lk',
      password: 'Admin1234',
      role: 'SUPER_ADMIN',
      profile: {
        id: 'staff_admin_01',
        memberIdNumber: 'STAFF-001',
        fullName: 'Chief Administrative Librarian',
        email: 'admin@library.lk',
        phone: '+94 11 269 3152',
        dob: '1985-01-01',
        address: 'Library Headquarters, Colombo 07',
        district: 'Colombo',
        membershipType: 'GENERAL',
        status: 'ACTIVE',
        homeBranchId: 'branch-colombo-hq',
        preferredLanguage: 'en',
        borrowingHistoryOptIn: true,
        activeLoansCount: 0,
        unpaidFinesTotal: 0,
        expiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };

    const initialUsers = [demoAdmin, ...students];
    inMemoryUsers = initialUsers;
    this.saveUsers(initialUsers);
    return initialUsers;
  }

  static saveUsers(users: LocalUser[]) {
    inMemoryUsers = users;
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (err) {
      console.warn('LocalStorage save warning, falling back to memory & clearing excess:', err);
      this.cleanOldStorageIfQuotaExceeded();
      try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      } catch {
        // Safe graceful in-memory operation
      }
    }
  }

  static getCurrentUser(): LocalUser | null {
    if (inMemoryCurrentUser) {
      return inMemoryCurrentUser;
    }
    try {
      const data = localStorage.getItem(CURRENT_USER_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        inMemoryCurrentUser = parsed;
        return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  }

  static setCurrentUser(user: LocalUser | null) {
    inMemoryCurrentUser = user;
    if (user) {
      // Store compact session object to NEVER exceed quota
      const sessionUser: LocalUser = {
        uid: user.uid,
        email: user.email,
        role: user.role,
        profile: user.profile,
      };
      try {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
      } catch (err) {
        console.warn('LocalStorage quota caught for current user, cleaning storage:', err);
        this.cleanOldStorageIfQuotaExceeded();
        try {
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
        } catch {
          // In-memory fallback prevents any uncaught browser error!
        }
      }
    } else {
      try {
        localStorage.removeItem(CURRENT_USER_KEY);
      } catch {
        // ignore
      }
    }
  }

  static async register(data: any): Promise<{ user: LocalUser; memberIdNumber: string }> {
    const users = this.getStoredUsers();
    
    // Check if email already registered
    if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error('This email is already registered. Please sign in instead.');
    }

    const uid = 'usr_' + Math.random().toString(36).substring(2, 9);
    const memberIdNumber = `LIB-${data.membershipType === 'STUDENT' ? 'STU' : 'MEM'}-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;
    const now = Date.now();

    // STRICT: Registered members ALWAYS start in PENDING status!
    const newProfile: MemberProfile = {
      id: uid,
      memberIdNumber,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      dob: data.dob,
      address: data.address,
      district: data.district,
      nic: data.nic || undefined,
      membershipType: data.membershipType,
      status: 'PENDING',
      homeBranchId: data.homeBranchId,
      preferredLanguage: data.preferredLanguage || 'en',
      borrowingHistoryOptIn: !!data.borrowingHistoryOptIn,
      activeLoansCount: 0,
      unpaidFinesTotal: 0,
      expiryDate: now + 365 * 24 * 60 * 60 * 1000,
      createdAt: now,
      updatedAt: now,
    };

    const newUser: LocalUser = {
      uid,
      email: data.email,
      password: data.password,
      role: 'MEMBER',
      profile: newProfile,
    };

    users.unshift(newUser);
    this.saveUsers(users);
    this.setCurrentUser(newUser);

    return { user: newUser, memberIdNumber };
  }

  static async login(email: string, password: string): Promise<LocalUser> {
    const inputEmail = email.trim().toLowerCase();
    const inputPass = password.trim();

    // 1. Built-in master admin guarantee
    if (
      (inputEmail === 'admin@library.lk' || inputEmail === 'admin') &&
      inputPass.toLowerCase() === 'admin1234'
    ) {
      const demoAdmin: LocalUser = {
        uid: 'staff_admin_01',
        email: 'admin@library.lk',
        password: 'Admin1234',
        role: 'SUPER_ADMIN',
        profile: {
          id: 'staff_admin_01',
          memberIdNumber: 'STAFF-001',
          fullName: 'Chief Administrative Librarian',
          email: 'admin@library.lk',
          phone: '+94 11 269 3152',
          dob: '1985-01-01',
          address: 'Library Headquarters, Colombo 07',
          district: 'Colombo',
          membershipType: 'GENERAL',
          status: 'ACTIVE',
          homeBranchId: 'branch-colombo-hq',
          preferredLanguage: 'en',
          borrowingHistoryOptIn: true,
          activeLoansCount: 0,
          unpaidFinesTotal: 0,
          expiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      };

      // Ensure demo admin is in stored list
      const users = this.getStoredUsers();
      if (!users.some((u) => u.email.toLowerCase() === 'admin@library.lk')) {
        users.unshift(demoAdmin);
        this.saveUsers(users);
      }
      this.setCurrentUser(demoAdmin);
      return demoAdmin;
    }

    const users = this.getStoredUsers();

    const matched = users.find(
      (u) =>
        u.email.trim().toLowerCase() === inputEmail &&
        u.password &&
        (u.password === inputPass || u.password.toLowerCase() === inputPass.toLowerCase())
    );

    if (!matched) {
      throw new Error('Invalid email or password. Please verify your credentials.');
    }

    this.setCurrentUser(matched);
    return matched;
  }

  static updateMemberStatus(memberId: string, newStatus: 'ACTIVE' | 'CANCELLED' | 'SUSPENDED') {
    const users = this.getStoredUsers();
    const target = users.find((u) => u.profile.id === memberId || u.uid === memberId);
    if (target) {
      target.profile.status = newStatus;
      target.profile.updatedAt = Date.now();
      if (newStatus === 'ACTIVE') {
        target.profile.approvedBy = 'staff-admin-01';
        target.profile.approvedAt = Date.now();
      }
      this.saveUsers(users);

      // If current logged-in user is updated, sync their session
      const curr = this.getCurrentUser();
      if (curr && (curr.uid === memberId || curr.profile.id === memberId)) {
        curr.profile.status = newStatus;
        this.setCurrentUser(curr);
      }
    }
  }

  static getPendingMembers(): MemberProfile[] {
    const users = this.getStoredUsers();
    return users
      .filter((u) => u.role === 'MEMBER' && u.profile.status === 'PENDING')
      .map((u) => u.profile);
  }

  static getAllMembers(): MemberProfile[] {
    const users = this.getStoredUsers();
    return users
      .filter((u) => u.role === 'MEMBER')
      .map((u) => u.profile);
  }

  static saveMembers(members: MemberProfile[]) {
    const users = this.getStoredUsers();
    members.forEach((m) => {
      const target = users.find((u) => u.profile.id === m.id || u.uid === m.id);
      if (target) {
        target.profile = { ...target.profile, ...m };
      }
    });
    this.saveUsers(users);
  }

  static logout() {
    inMemoryCurrentUser = null;
    try {
      localStorage.removeItem(CURRENT_USER_KEY);
      sessionStorage.removeItem(CURRENT_USER_KEY);
    } catch {
      // ignore
    }
  }
}
