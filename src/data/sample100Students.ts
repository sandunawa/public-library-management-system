import { MemberProfile, UserRole } from '@libraryos/shared';

const SRI_LANKAN_FIRST_NAMES = [
  'Kasun', 'Nimal', 'Chamara', 'Ruwan', 'Kavinda', 'Sandun', 'Isuru', 'Dinesh', 'Nuwan', 'Chathura',
  'Praveen', 'Suresh', 'Dilshan', 'Asanka', 'Buddhika', 'Gayan', 'Tharindu', 'Lahiru', 'Mahesh', 'Pradeep',
  'Kumara', 'Roshan', 'Sampath', 'Sanjeewa', 'Damith', 'Anura', 'Manjula', 'Suranga', 'Janaka', 'Niroshan',
  'Sachith', 'Malith', 'Thilina', 'Kusal', 'Dimuth', 'Dasun', 'Wanindu', 'Charith', 'Dananjaya', 'Avishka',
  'Pathum', 'Oshada', 'Bhanuka', 'Minod', 'Pramod', 'Nuwanidu', 'Sahan', 'Shehan', 'Janith', 'Ashen',
  'Anushka', 'Ishara', 'Thilini', 'Sanduni', 'Oshadi', 'Kavindi', 'Dilani', 'Nadeesha', 'Chathurika', 'Harshani',
  'Malsha', 'Rashmi', 'Nethmi', 'Hiruni', 'Piyumi', 'Gayani', 'Menaka', 'Subhashini', 'Pavithra', 'Dinithi',
  'Sivalingam', 'Murugan', 'Tharmalingam', 'Ramesh', 'Senthil', 'Kumar', 'Ganesh', 'Vigneswaran', 'Karthik', 'Sanjay',
  'Priya', 'Meena', 'Kavitha', 'Shalini', 'Janani', 'Divya', 'Ananya', 'Tharika', 'Nivetha', 'Keerthana',
  'Mohamed', 'Ahmed', 'Farhan', 'Rizwan', 'Akeel', 'Fatima', 'Ayesha', 'Zainab', 'Rizna', 'Shazna'
];

const SRI_LANKAN_LAST_NAMES = [
  'Perera', 'Silva', 'Fernando', 'Jayawardena', 'Wickramasinghe', 'Gunasekara', 'Dissanayake', 'Bandara',
  'Senanayake', 'Alwis', 'Karunaratne', 'Herath', 'Rajapaksha', 'Rathnayake', 'Weerasinghe', 'Liyanage',
  'Wijesinghe', 'Samaraweera', 'Abeyratne', 'Amarasinghe', 'Jayasinghe', 'Ekanayake', 'Subasinghe', 'Gamage',
  'Thirimanne', 'De Silva', 'Fonseka', 'Mendis', 'Peiris', 'Seneviratne', 'Tennakoon', 'Ranasinghe',
  'Ilangaratne', 'Balasuriya', 'Gunawardena', 'Munasinghe', 'Kulatunga', 'Jayakody', 'Dias', 'Rodrigo',
  'Tharmarajah', 'Pillai', 'Nadarajah', 'Balachandran', 'Sundaralingam', 'Sellathurai', 'Thevarajah', 'Mahendran'
];

const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

const MEMBERSHIP_TYPES: ('STUDENT' | 'GENERAL' | 'TEACHER' | 'JUNIOR')[] = [
  'STUDENT', 'GENERAL', 'TEACHER', 'JUNIOR'
];

export function generate100SampleStudents(): {
  uid: string;
  email: string;
  password: string;
  role: UserRole;
  profile: MemberProfile;
}[] {
  const members = [];
  const now = Date.now();

  for (let i = 1; i <= 100; i++) {
    const firstName = SRI_LANKAN_FIRST_NAMES[(i - 1) % SRI_LANKAN_FIRST_NAMES.length]!;
    const lastName = SRI_LANKAN_LAST_NAMES[(i * 3) % SRI_LANKAN_LAST_NAMES.length]!;
    const district = DISTRICTS[(i * 2) % DISTRICTS.length]!;
    const mType = MEMBERSHIP_TYPES[i % MEMBERSHIP_TYPES.length]!;
    const prefix = mType === 'STUDENT' ? 'STU' : mType === 'TEACHER' ? 'TCH' : mType === 'JUNIOR' ? 'JUN' : 'MEM';

    const uid = `member_${1000 + i}`;
    const memberIdNumber = `LIB-${prefix}-${2026000 + i}`;

    // 40 of them are PENDING to populate the Staff Approval Queue!
    // 60 of them are ACTIVE for circulation checkouts
    const isPending = i <= 40;
    const status = isPending ? 'PENDING' : 'ACTIVE';

    members.push({
      uid,
      email: `member${i}@library.lk`,
      password: 'Member1234',
      role: 'MEMBER' as UserRole,
      profile: {
        id: uid,
        memberIdNumber,
        fullName: `${firstName} ${lastName}`,
        email: `member${i}@library.lk`,
        phone: `+94 77 ${Math.floor(100 + (i * 7) % 899)} ${Math.floor(1000 + (i * 37) % 8999)}`,
        dob: `${1990 + (i % 25)}-0${(i % 9) + 1}-1${(i % 8) + 1}`,
        address: `No. ${i * 4}, Station Road, ${district}`,
        district,
        nic: `199${(i % 10)}5${Math.floor(100000 + (i * 987) % 899999)}V`,
        membershipType: mType,
        status: status as any,
        homeBranchId: i % 2 === 0 ? 'branch-colombo-hq' : 'branch-kandy',
        preferredLanguage: (i % 3 === 0 ? 'si' : i % 3 === 1 ? 'en' : 'ta') as any,
        borrowingHistoryOptIn: true,
        activeLoansCount: isPending ? 0 : (i % 4),
        unpaidFinesTotal: isPending ? 0 : (i % 10 === 0 ? 50 : 0),
        approvedBy: isPending ? undefined : 'staff-admin-01',
        approvedAt: isPending ? undefined : now - 86400000 * (i % 30),
        expiryDate: now + 365 * 24 * 60 * 60 * 1000,
        createdAt: now - 86400000 * (100 - i),
        updatedAt: now,
      },
    });
  }

  return members;
}
