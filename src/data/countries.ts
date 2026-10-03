export interface Country {
  name: string;
  iso: string;
  dialCode: string;
  flag: string;
  minDigits: number;
  maxDigits: number;
  placeholder: string;
}

export const COUNTRIES: Country[] = [
  { name: 'Afghanistan', iso: 'AF', dialCode: '+93', flag: '🇦🇫', minDigits: 9, maxDigits: 9, placeholder: '70 123 4567' },
  { name: 'Albania', iso: 'AL', dialCode: '+355', flag: '🇦🇱', minDigits: 9, maxDigits: 9, placeholder: '69 123 4567' },
  { name: 'Algeria', iso: 'DZ', dialCode: '+213', flag: '🇩🇿', minDigits: 9, maxDigits: 9, placeholder: '551 23 45 67' },
  { name: 'Andorra', iso: 'AD', dialCode: '+376', flag: '🇦🇩', minDigits: 6, maxDigits: 9, placeholder: '312 345' },
  { name: 'Angola', iso: 'AO', dialCode: '+244', flag: '🇦🇴', minDigits: 9, maxDigits: 9, placeholder: '923 456 789' },
  { name: 'Argentina', iso: 'AR', dialCode: '+54', flag: '🇦🇷', minDigits: 10, maxDigits: 10, placeholder: '911 2345 6789' },
  { name: 'Armenia', iso: 'AM', dialCode: '+374', flag: '🇦🇲', minDigits: 8, maxDigits: 8, placeholder: '77 123 456' },
  { name: 'Australia', iso: 'AU', dialCode: '+61', flag: '🇦🇺', minDigits: 9, maxDigits: 9, placeholder: '412 345 678' },
  { name: 'Austria', iso: 'AT', dialCode: '+43', flag: '🇦🇹', minDigits: 10, maxDigits: 11, placeholder: '664 123 4567' },
  { name: 'Azerbaijan', iso: 'AZ', dialCode: '+994', flag: '🇦🇿', minDigits: 9, maxDigits: 9, placeholder: '50 123 45 67' },
  { name: 'Bahamas', iso: 'BS', dialCode: '+1242', flag: '🇧🇸', minDigits: 7, maxDigits: 7, placeholder: '359 1234' },
  { name: 'Bahrain', iso: 'BH', dialCode: '+973', flag: '🇧🇭', minDigits: 8, maxDigits: 8, placeholder: '3600 1234' },
  { name: 'Bangladesh', iso: 'BD', dialCode: '+880', flag: '🇧🇩', minDigits: 10, maxDigits: 10, placeholder: '1712 345678' },
  { name: 'Barbados', iso: 'BB', dialCode: '+1246', flag: '🇧🇧', minDigits: 7, maxDigits: 7, placeholder: '230 1234' },
  { name: 'Belarus', iso: 'BY', dialCode: '+375', flag: '🇧🇾', minDigits: 9, maxDigits: 9, placeholder: '29 123 4567' },
  { name: 'Belgium', iso: 'BE', dialCode: '+32', flag: '🇧🇪', minDigits: 9, maxDigits: 9, placeholder: '470 12 34 56' },
  { name: 'Belize', iso: 'BZ', dialCode: '+501', flag: '🇧🇿', minDigits: 7, maxDigits: 7, placeholder: '622 1234' },
  { name: 'Benin', iso: 'BJ', dialCode: '+229', flag: '🇧🇯', minDigits: 8, maxDigits: 8, placeholder: '97 12 34 56' },
  { name: 'Bhutan', iso: 'BT', dialCode: '+975', flag: '🇧🇹', minDigits: 8, maxDigits: 8, placeholder: '17 12 34 56' },
  { name: 'Bolivia', iso: 'BO', dialCode: '+591', flag: '🇧🇴', minDigits: 8, maxDigits: 8, placeholder: '7123 4567' },
  { name: 'Bosnia and Herzegovina', iso: 'BA', dialCode: '+387', flag: '🇧🇦', minDigits: 8, maxDigits: 9, placeholder: '61 123 456' },
  { name: 'Botswana', iso: 'BW', dialCode: '+267', flag: '🇧🇼', minDigits: 8, maxDigits: 8, placeholder: '71 234 567' },
  { name: 'Brazil', iso: 'BR', dialCode: '+55', flag: '🇧🇷', minDigits: 10, maxDigits: 11, placeholder: '11 98765 4321' },
  { name: 'Brunei', iso: 'BN', dialCode: '+673', flag: '🇧🇳', minDigits: 7, maxDigits: 7, placeholder: '712 3456' },
  { name: 'Bulgaria', iso: 'BG', dialCode: '+359', flag: '🇧🇬', minDigits: 8, maxDigits: 9, placeholder: '87 123 4567' },
  { name: 'Burkina Faso', iso: 'BF', dialCode: '+226', flag: '🇧🇫', minDigits: 8, maxDigits: 8, placeholder: '70 12 34 56' },
  { name: 'Burundi', iso: 'BI', dialCode: '+257', flag: '🇧🇮', minDigits: 8, maxDigits: 8, placeholder: '79 12 34 56' },
  { name: 'Cambodia', iso: 'KH', dialCode: '+855', flag: '🇰🇭', minDigits: 8, maxDigits: 9, placeholder: '12 345 678' },
  { name: 'Cameroon', iso: 'CM', dialCode: '+237', flag: '🇨🇲', minDigits: 9, maxDigits: 9, placeholder: '6 71 23 45 67' },
  { name: 'Canada', iso: 'CA', dialCode: '+1', flag: '🇨🇦', minDigits: 10, maxDigits: 10, placeholder: '416 555 0199' },
  { name: 'Cape Verde', iso: 'CV', dialCode: '+238', flag: '🇨🇻', minDigits: 7, maxDigits: 7, placeholder: '991 2345' },
  { name: 'Central African Republic', iso: 'CF', dialCode: '+236', flag: '🇨🇫', minDigits: 8, maxDigits: 8, placeholder: '70 12 34 56' },
  { name: 'Chad', iso: 'TD', dialCode: '+235', flag: '🇹🇩', minDigits: 8, maxDigits: 8, placeholder: '66 12 34 56' },
  { name: 'Chile', iso: 'CL', dialCode: '+56', flag: '🇨🇱', minDigits: 9, maxDigits: 9, placeholder: '9 1234 5678' },
  { name: 'China', iso: 'CN', dialCode: '+86', flag: '🇨🇳', minDigits: 11, maxDigits: 11, placeholder: '138 0013 8000' },
  { name: 'Colombia', iso: 'CO', dialCode: '+57', flag: '🇨🇴', minDigits: 10, maxDigits: 10, placeholder: '300 123 4567' },
  { name: 'Comoros', iso: 'KM', dialCode: '+269', flag: '🇰🇲', minDigits: 7, maxDigits: 7, placeholder: '321 2345' },
  { name: 'Congo', iso: 'CG', dialCode: '+242', flag: '🇨🇬', minDigits: 9, maxDigits: 9, placeholder: '06 123 4567' },
  { name: 'Costa Rica', iso: 'CR', dialCode: '+506', flag: '🇨🇷', minDigits: 8, maxDigits: 8, placeholder: '8312 3456' },
  { name: 'Croatia', iso: 'HR', dialCode: '+385', flag: '🇭🇷', minDigits: 8, maxDigits: 9, placeholder: '91 123 4567' },
  { name: 'Cuba', iso: 'CU', dialCode: '+53', flag: '🇨🇺', minDigits: 8, maxDigits: 8, placeholder: '5 123 4567' },
  { name: 'Cyprus', iso: 'CY', dialCode: '+357', flag: '🇨🇾', minDigits: 8, maxDigits: 8, placeholder: '96 123456' },
  { name: 'Czech Republic', iso: 'CZ', dialCode: '+420', flag: '🇨🇿', minDigits: 9, maxDigits: 9, placeholder: '601 123 456' },
  { name: 'Denmark', iso: 'DK', dialCode: '+45', flag: '🇩🇰', minDigits: 8, maxDigits: 8, placeholder: '20 12 34 56' },
  { name: 'Djibouti', iso: 'DJ', dialCode: '+253', flag: '🇩🇯', minDigits: 8, maxDigits: 8, placeholder: '77 12 34 56' },
  { name: 'Dominica', iso: 'DM', dialCode: '+1767', flag: '🇩🇲', minDigits: 7, maxDigits: 7, placeholder: '225 1234' },
  { name: 'Dominican Republic', iso: 'DO', dialCode: '+1809', flag: '🇩🇴', minDigits: 7, maxDigits: 7, placeholder: '234 5678' },
  { name: 'Ecuador', iso: 'EC', dialCode: '+593', flag: '🇪🇨', minDigits: 9, maxDigits: 9, placeholder: '99 123 4567' },
  { name: 'Egypt', iso: 'EG', dialCode: '+20', flag: '🇪🇬', minDigits: 10, maxDigits: 10, placeholder: '100 123 4567' },
  { name: 'El Salvador', iso: 'SV', dialCode: '+503', flag: '🇸🇻', minDigits: 8, maxDigits: 8, placeholder: '7012 3456' },
  { name: 'Equatorial Guinea', iso: 'GQ', dialCode: '+240', flag: '🇬🇶', minDigits: 9, maxDigits: 9, placeholder: '222 123 456' },
  { name: 'Eritrea', iso: 'ER', dialCode: '+291', flag: '🇪🇷', minDigits: 7, maxDigits: 7, placeholder: '7 123 456' },
  { name: 'Estonia', iso: 'EE', dialCode: '+372', flag: '🇪🇪', minDigits: 7, maxDigits: 8, placeholder: '5123 4567' },
  { name: 'Ethiopia', iso: 'ET', dialCode: '+251', flag: '🇪🇹', minDigits: 9, maxDigits: 9, placeholder: '91 123 4567' },
  { name: 'Fiji', iso: 'FJ', dialCode: '+679', flag: '🇫🇯', minDigits: 7, maxDigits: 7, placeholder: '701 2345' },
  { name: 'Finland', iso: 'FI', dialCode: '+358', flag: '🇫🇮', minDigits: 9, maxDigits: 10, placeholder: '40 123 4567' },
  { name: 'France', iso: 'FR', dialCode: '+33', flag: '🇫🇷', minDigits: 9, maxDigits: 9, placeholder: '6 12 34 56 78' },
  { name: 'Gabon', iso: 'GA', dialCode: '+241', flag: '🇬🇦', minDigits: 8, maxDigits: 8, placeholder: '06 12 34 56' },
  { name: 'Gambia', iso: 'GM', dialCode: '+220', flag: '🇬🇲', minDigits: 7, maxDigits: 7, placeholder: '701 2345' },
  { name: 'Georgia', iso: 'GE', dialCode: '+995', flag: '🇬🇪', minDigits: 9, maxDigits: 9, placeholder: '599 12 34 56' },
  { name: 'Germany', iso: 'DE', dialCode: '+49', flag: '🇩🇪', minDigits: 10, maxDigits: 11, placeholder: '151 23456789' },
  { name: 'Ghana', iso: 'GH', dialCode: '+233', flag: '🇬🇭', minDigits: 9, maxDigits: 9, placeholder: '24 123 4567' },
  { name: 'Greece', iso: 'GR', dialCode: '+30', flag: '🇬🇷', minDigits: 10, maxDigits: 10, placeholder: '691 234 5678' },
  { name: 'Grenada', iso: 'GD', dialCode: '+1473', flag: '🇬🇩', minDigits: 7, maxDigits: 7, placeholder: '403 1234' },
  { name: 'Guatemala', iso: 'GT', dialCode: '+502', flag: '🇬🇹', minDigits: 8, maxDigits: 8, placeholder: '5123 4567' },
  { name: 'Guinea', iso: 'GN', dialCode: '+224', flag: '🇬🇳', minDigits: 9, maxDigits: 9, placeholder: '621 12 34 56' },
  { name: 'Guyana', iso: 'GY', dialCode: '+592', flag: '🇬🇾', minDigits: 7, maxDigits: 7, placeholder: '609 1234' },
  { name: 'Haiti', iso: 'HT', dialCode: '+509', flag: '🇭🇹', minDigits: 8, maxDigits: 8, placeholder: '3412 3456' },
  { name: 'Honduras', iso: 'HN', dialCode: '+504', flag: '🇭🇳', minDigits: 8, maxDigits: 8, placeholder: '9123 4567' },
  { name: 'Hong Kong', iso: 'HK', dialCode: '+852', flag: '🇭🇰', minDigits: 8, maxDigits: 8, placeholder: '5123 4567' },
  { name: 'Hungary', iso: 'HU', dialCode: '+36', flag: '🇭🇺', minDigits: 9, maxDigits: 9, placeholder: '20 123 4567' },
  { name: 'Iceland', iso: 'IS', dialCode: '+354', flag: '🇮🇸', minDigits: 7, maxDigits: 7, placeholder: '612 3456' },
  { name: 'India', iso: 'IN', dialCode: '+91', flag: '🇮🇳', minDigits: 10, maxDigits: 10, placeholder: '98765 43210' },
  { name: 'Indonesia', iso: 'ID', dialCode: '+62', flag: '🇮🇩', minDigits: 9, maxDigits: 12, placeholder: '812 3456 7890' },
  { name: 'Iran', iso: 'IR', dialCode: '+98', flag: '🇮🇷', minDigits: 10, maxDigits: 10, placeholder: '912 345 6789' },
  { name: 'Iraq', iso: 'IQ', dialCode: '+964', flag: '🇮🇶', minDigits: 10, maxDigits: 10, placeholder: '790 123 4567' },
  { name: 'Ireland', iso: 'IE', dialCode: '+353', flag: '🇮🇪', minDigits: 9, maxDigits: 9, placeholder: '85 123 4567' },
  { name: 'Israel', iso: 'IL', dialCode: '+972', flag: '🇮🇱', minDigits: 9, maxDigits: 9, placeholder: '50 123 4567' },
  { name: 'Italy', iso: 'IT', dialCode: '+39', flag: '🇮🇹', minDigits: 9, maxDigits: 10, placeholder: '312 345 6789' },
  { name: 'Ivory Coast', iso: 'CI', dialCode: '+225', flag: '🇨🇮', minDigits: 10, maxDigits: 10, placeholder: '07 12 34 56 78' },
  { name: 'Jamaica', iso: 'JM', dialCode: '+1876', flag: '🇯🇲', minDigits: 7, maxDigits: 7, placeholder: '234 5678' },
  { name: 'Japan', iso: 'JP', dialCode: '+81', flag: '🇯🇵', minDigits: 10, maxDigits: 10, placeholder: '90 1234 5678' },
  { name: 'Jordan', iso: 'JO', dialCode: '+962', flag: '🇯🇴', minDigits: 9, maxDigits: 9, placeholder: '7 9123 4567' },
  { name: 'Kazakhstan', iso: 'KZ', dialCode: '+7', flag: '🇰🇿', minDigits: 10, maxDigits: 10, placeholder: '701 123 4567' },
  { name: 'Kenya', iso: 'KE', dialCode: '+254', flag: '🇰🇪', minDigits: 9, maxDigits: 9, placeholder: '712 345 678' },
  { name: 'Kuwait', iso: 'KW', dialCode: '+965', flag: '🇰🇼', minDigits: 8, maxDigits: 8, placeholder: '9123 4567' },
  { name: 'Kyrgyzstan', iso: 'KG', dialCode: '+996', flag: '🇰🇬', minDigits: 9, maxDigits: 9, placeholder: '550 123 456' },
  { name: 'Laos', iso: 'LA', dialCode: '+856', flag: '🇱🇦', minDigits: 8, maxDigits: 9, placeholder: '20 23 123 456' },
  { name: 'Latvia', iso: 'LV', dialCode: '+371', flag: '🇱🇻', minDigits: 8, maxDigits: 8, placeholder: '21 234 567' },
  { name: 'Lebanon', iso: 'LB', dialCode: '+961', flag: '🇱🇧', minDigits: 7, maxDigits: 8, placeholder: '71 123 456' },
  { name: 'Libya', iso: 'LY', dialCode: '+218', flag: '🇱🇾', minDigits: 9, maxDigits: 9, placeholder: '91 123 4567' },
  { name: 'Liechtenstein', iso: 'LI', dialCode: '+423', flag: '🇱🇮', minDigits: 7, maxDigits: 7, placeholder: '660 1234' },
  { name: 'Lithuania', iso: 'LT', dialCode: '+370', flag: '🇱🇹', minDigits: 8, maxDigits: 8, placeholder: '612 34567' },
  { name: 'Luxembourg', iso: 'LU', dialCode: '+352', flag: '🇱🇺', minDigits: 9, maxDigits: 9, placeholder: '621 123 456' },
  { name: 'Madagascar', iso: 'MG', dialCode: '+261', flag: '🇲🇬', minDigits: 9, maxDigits: 9, placeholder: '32 12 345 67' },
  { name: 'Malaysia', iso: 'MY', dialCode: '+60', flag: '🇲🇾', minDigits: 9, maxDigits: 10, placeholder: '12 345 6789' },
  { name: 'Maldives', iso: 'MV', dialCode: '+960', flag: '🇲🇻', minDigits: 7, maxDigits: 7, placeholder: '712 3456' },
  { name: 'Mali', iso: 'ML', dialCode: '+223', flag: '🇲🇱', minDigits: 8, maxDigits: 8, placeholder: '65 12 34 56' },
  { name: 'Malta', iso: 'MT', dialCode: '+356', flag: '🇲🇹', minDigits: 8, maxDigits: 8, placeholder: '9912 3456' },
  { name: 'Mauritania', iso: 'MR', dialCode: '+222', flag: '🇲🇷', minDigits: 8, maxDigits: 8, placeholder: '22 12 34 56' },
  { name: 'Mauritius', iso: 'MU', dialCode: '+230', flag: '🇲🇺', minDigits: 8, maxDigits: 8, placeholder: '5123 4567' },
  { name: 'Mexico', iso: 'MX', dialCode: '+52', flag: '🇲🇽', minDigits: 10, maxDigits: 10, placeholder: '55 1234 5678' },
  { name: 'Moldova', iso: 'MD', dialCode: '+373', flag: '🇲🇩', minDigits: 8, maxDigits: 8, placeholder: '621 12 345' },
  { name: 'Monaco', iso: 'MC', dialCode: '+377', flag: '🇲🇨', minDigits: 8, maxDigits: 9, placeholder: '6 12 34 56 78' },
  { name: 'Mongolia', iso: 'MN', dialCode: '+976', flag: '🇲🇳', minDigits: 8, maxDigits: 8, placeholder: '8812 3456' },
  { name: 'Montenegro', iso: 'ME', dialCode: '+382', flag: '🇲🇪', minDigits: 8, maxDigits: 8, placeholder: '67 123 456' },
  { name: 'Morocco', iso: 'MA', dialCode: '+212', flag: '🇲🇦', minDigits: 9, maxDigits: 9, placeholder: '612 345 678' },
  { name: 'Mozambique', iso: 'MZ', dialCode: '+258', flag: '🇲🇿', minDigits: 9, maxDigits: 9, placeholder: '84 123 4567' },
  { name: 'Myanmar', iso: 'MM', dialCode: '+95', flag: '🇲🇲', minDigits: 9, maxDigits: 10, placeholder: '9 123 456 789' },
  { name: 'Namibia', iso: 'NA', dialCode: '+264', flag: '🇳🇦', minDigits: 8, maxDigits: 9, placeholder: '81 123 4567' },
  { name: 'Nepal', iso: 'NP', dialCode: '+977', flag: '🇳🇵', minDigits: 10, maxDigits: 10, placeholder: '984 1234567' },
  { name: 'Netherlands', iso: 'NL', dialCode: '+31', flag: '🇳🇱', minDigits: 9, maxDigits: 9, placeholder: '6 12345678' },
  { name: 'New Zealand', iso: 'NZ', dialCode: '+64', flag: '🇳🇿', minDigits: 8, maxDigits: 10, placeholder: '21 123 4567' },
  { name: 'Nicaragua', iso: 'NI', dialCode: '+505', flag: '🇳🇮', minDigits: 8, maxDigits: 8, placeholder: '8123 4567' },
  { name: 'Niger', iso: 'NE', dialCode: '+227', flag: '🇳🇪', minDigits: 8, maxDigits: 8, placeholder: '90 12 34 56' },
  { name: 'Nigeria', iso: 'NG', dialCode: '+234', flag: '🇳🇬', minDigits: 10, maxDigits: 10, placeholder: '802 123 4567' },
  { name: 'North Macedonia', iso: 'MK', dialCode: '+389', flag: '🇲🇰', minDigits: 8, maxDigits: 8, placeholder: '70 123 456' },
  { name: 'Norway', iso: 'NO', dialCode: '+47', flag: '🇳🇴', minDigits: 8, maxDigits: 8, placeholder: '412 34 567' },
  { name: 'Oman', iso: 'OM', dialCode: '+968', flag: '🇴🇲', minDigits: 8, maxDigits: 8, placeholder: '9123 4567' },
  { name: 'Pakistan', iso: 'PK', dialCode: '+92', flag: '🇵🇰', minDigits: 10, maxDigits: 10, placeholder: '300 1234567' },
  { name: 'Palestine', iso: 'PS', dialCode: '+970', flag: '🇵🇸', minDigits: 9, maxDigits: 9, placeholder: '59 123 4567' },
  { name: 'Panama', iso: 'PA', dialCode: '+507', flag: '🇵🇦', minDigits: 8, maxDigits: 8, placeholder: '6123 4567' },
  { name: 'Papua New Guinea', iso: 'PG', dialCode: '+675', flag: '🇵🇬', minDigits: 8, maxDigits: 8, placeholder: '7012 3456' },
  { name: 'Paraguay', iso: 'PY', dialCode: '+595', flag: '🇵🇾', minDigits: 9, maxDigits: 9, placeholder: '981 123 456' },
  { name: 'Peru', iso: 'PE', dialCode: '+51', flag: '🇵🇪', minDigits: 9, maxDigits: 9, placeholder: '912 345 678' },
  { name: 'Philippines', iso: 'PH', dialCode: '+63', flag: '🇵🇭', minDigits: 10, maxDigits: 10, placeholder: '917 123 4567' },
  { name: 'Poland', iso: 'PL', dialCode: '+48', flag: '🇵🇱', minDigits: 9, maxDigits: 9, placeholder: '512 345 678' },
  { name: 'Portugal', iso: 'PT', dialCode: '+351', flag: '🇵🇹', minDigits: 9, maxDigits: 9, placeholder: '912 345 678' },
  { name: 'Qatar', iso: 'QA', dialCode: '+974', flag: '🇶🇦', minDigits: 8, maxDigits: 8, placeholder: '3312 3456' },
  { name: 'Romania', iso: 'RO', dialCode: '+40', flag: '🇷🇴', minDigits: 9, maxDigits: 9, placeholder: '712 345 678' },
  { name: 'Russia', iso: 'RU', dialCode: '+7', flag: '🇷🇺', minDigits: 10, maxDigits: 10, placeholder: '912 345 67 89' },
  { name: 'Rwanda', iso: 'RW', dialCode: '+250', flag: '🇷🇼', minDigits: 9, maxDigits: 9, placeholder: '788 123 456' },
  { name: 'Saudi Arabia', iso: 'SA', dialCode: '+966', flag: '🇸🇦', minDigits: 9, maxDigits: 9, placeholder: '50 123 4567' },
  { name: 'Senegal', iso: 'SN', dialCode: '+221', flag: '🇸🇳', minDigits: 9, maxDigits: 9, placeholder: '77 123 45 67' },
  { name: 'Serbia', iso: 'RS', dialCode: '+381', flag: '🇷🇸', minDigits: 8, maxDigits: 9, placeholder: '60 123 4567' },
  { name: 'Seychelles', iso: 'SC', dialCode: '+248', flag: '🇸🇨', minDigits: 7, maxDigits: 7, placeholder: '2 512 345' },
  { name: 'Sierra Leone', iso: 'SL', dialCode: '+232', flag: '🇸🇱', minDigits: 8, maxDigits: 8, placeholder: '76 123456' },
  { name: 'Singapore', iso: 'SG', dialCode: '+65', flag: '🇸🇬', minDigits: 8, maxDigits: 8, placeholder: '8123 4567' },
  { name: 'Slovakia', iso: 'SK', dialCode: '+421', flag: '🇸🇰', minDigits: 9, maxDigits: 9, placeholder: '912 345 678' },
  { name: 'Slovenia', iso: 'SI', dialCode: '+386', flag: '🇸🇮', minDigits: 8, maxDigits: 8, placeholder: '31 234 567' },
  { name: 'Somalia', iso: 'SO', dialCode: '+252', flag: '🇸🇴', minDigits: 8, maxDigits: 9, placeholder: '61 234 567' },
  { name: 'South Africa', iso: 'ZA', dialCode: '+27', flag: '🇿🇦', minDigits: 9, maxDigits: 9, placeholder: '71 123 4567' },
  { name: 'South Korea', iso: 'KR', dialCode: '+82', flag: '🇰🇷', minDigits: 9, maxDigits: 10, placeholder: '10 1234 5678' },
  { name: 'Spain', iso: 'ES', dialCode: '+34', flag: '🇪🇸', minDigits: 9, maxDigits: 9, placeholder: '612 34 56 78' },
  { name: 'Sri Lanka', iso: 'LK', dialCode: '+94', flag: '🇱🇰', minDigits: 9, maxDigits: 9, placeholder: '77 123 4567' },
  { name: 'Sudan', iso: 'SD', dialCode: '+249', flag: '🇸🇩', minDigits: 9, maxDigits: 9, placeholder: '91 123 4567' },
  { name: 'Sweden', iso: 'SE', dialCode: '+46', flag: '🇸🇪', minDigits: 9, maxDigits: 9, placeholder: '70 123 45 67' },
  { name: 'Switzerland', iso: 'CH', dialCode: '+41', flag: '🇨🇭', minDigits: 9, maxDigits: 9, placeholder: '78 123 45 67' },
  { name: 'Taiwan', iso: 'TW', dialCode: '+886', flag: '🇹🇼', minDigits: 9, maxDigits: 9, placeholder: '912 345 678' },
  { name: 'Tajikistan', iso: 'TJ', dialCode: '+992', flag: '🇹🇯', minDigits: 9, maxDigits: 9, placeholder: '918 12 34 56' },
  { name: 'Tanzania', iso: 'TZ', dialCode: '+255', flag: '🇹🇿', minDigits: 9, maxDigits: 9, placeholder: '712 345 678' },
  { name: 'Thailand', iso: 'TH', dialCode: '+66', flag: '🇹🇭', minDigits: 9, maxDigits: 9, placeholder: '81 234 5678' },
  { name: 'Togo', iso: 'TG', dialCode: '+228', flag: '🇹🇬', minDigits: 8, maxDigits: 8, placeholder: '90 12 34 56' },
  { name: 'Trinidad and Tobago', iso: 'TT', dialCode: '+1868', flag: '🇹🇹', minDigits: 7, maxDigits: 7, placeholder: '291 2345' },
  { name: 'Tunisia', iso: 'TN', dialCode: '+216', flag: '🇹🇳', minDigits: 8, maxDigits: 8, placeholder: '20 123 456' },
  { name: 'Turkey', iso: 'TR', dialCode: '+90', flag: '🇹🇷', minDigits: 10, maxDigits: 10, placeholder: '501 234 5678' },
  { name: 'Uganda', iso: 'UG', dialCode: '+256', flag: '🇺🇬', minDigits: 9, maxDigits: 9, placeholder: '712 345678' },
  { name: 'Ukraine', iso: 'UA', dialCode: '+380', flag: '🇺🇦', minDigits: 9, maxDigits: 9, placeholder: '50 123 4567' },
  { name: 'United Arab Emirates', iso: 'AE', dialCode: '+971', flag: '🇦🇪', minDigits: 9, maxDigits: 9, placeholder: '50 123 4567' },
  { name: 'United Kingdom', iso: 'GB', dialCode: '+44', flag: '🇬🇧', minDigits: 10, maxDigits: 10, placeholder: '7911 123456' },
  { name: 'United States', iso: 'US', dialCode: '+1', flag: '🇺🇸', minDigits: 10, maxDigits: 10, placeholder: '555 123 4567' },
  { name: 'Uruguay', iso: 'UY', dialCode: '+598', flag: '🇺🇾', minDigits: 8, maxDigits: 8, placeholder: '99 123 456' },
  { name: 'Uzbekistan', iso: 'UZ', dialCode: '+998', flag: '🇺🇿', minDigits: 9, maxDigits: 9, placeholder: '90 123 45 67' },
  { name: 'Venezuela', iso: 'VE', dialCode: '+58', flag: '🇻🇪', minDigits: 10, maxDigits: 10, placeholder: '412 1234567' },
  { name: 'Vietnam', iso: 'VN', dialCode: '+84', flag: '🇻🇳', minDigits: 9, maxDigits: 10, placeholder: '91 234 5678' },
  { name: 'Yemen', iso: 'YE', dialCode: '+967', flag: '🇾🇪', minDigits: 9, maxDigits: 9, placeholder: '71 123 4567' },
  { name: 'Zambia', iso: 'ZM', dialCode: '+260', flag: '🇿🇲', minDigits: 9, maxDigits: 9, placeholder: '97 1234567' },
  { name: 'Zimbabwe', iso: 'ZW', dialCode: '+263', flag: '🇿🇼', minDigits: 9, maxDigits: 9, placeholder: '71 234 5678' }
];

export const DEFAULT_COUNTRY = COUNTRIES.find((c) => c.iso === 'US') || COUNTRIES[0];

/**
 * Parses any phone string (e.g. "+1 (555) 000-0000" or "+94 77 123 4567") into
 * a matched country and clean numeric digits.
 */
export function parsePhoneNumber(rawPhone: string = ''): { country: Country; digits: string } {
  if (!rawPhone || !rawPhone.trim()) {
    return { country: DEFAULT_COUNTRY, digits: '' };
  }

  const trimmed = rawPhone.trim();

  // Try matching dial code from longest to shortest dial codes
  const sortedCountries = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);

  for (const c of sortedCountries) {
    if (trimmed.startsWith(c.dialCode)) {
      const rest = trimmed.slice(c.dialCode.length);
      const digitsOnly = rest.replace(/\D/g, '').slice(0, c.maxDigits);
      return { country: c, digits: digitsOnly };
    }
  }

  // Fallback: strip everything except digits
  const allDigits = trimmed.replace(/\D/g, '');
  return {
    country: DEFAULT_COUNTRY,
    digits: allDigits.slice(0, DEFAULT_COUNTRY.maxDigits),
  };
}
