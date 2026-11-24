export interface BrandConfig {
  name: string;
  shortName: string;
  tagline: string;
  companyName: string;
  logoText: string;
  address: string;
  phones: string[];
  email: string;
  hours: string;
  website: string;
  version: string;
  primaryColor: string;
  indigoColor: string;
  violetColor: string;
}

export const brandConfig: BrandConfig = {
  name: 'Smart Library Management System',
  shortName: 'Smart Library',
  tagline: 'Next-Generation Automated Library Management Platform',
  companyName: 'Enivac International (Pvt) Ltd',
  logoText: 'Smart Library',
  address: 'No 77, Dharmapala Road, Matara, Sri Lanka',
  phones: ['+94 71 389 2928', '+94 76 829 1088'],
  email: 'enivactech@gmail.com',
  hours: 'Mon - Fri, 9:00 AM - 5:00 PM',
  website: 'https://enivac.com/',
  version: 'v2.4.0 (Enterprise Edition)',
  primaryColor: '#0B0630',
  indigoColor: '#1E0FA8',
  violetColor: '#4F35E8',
};
