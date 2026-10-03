export type SupportedLanguage = 'English' | 'Tamil' | 'Sinhala';

export interface TranslationEntry {
  ta: string;
  si: string;
}

export const DICTIONARY: Record<string, TranslationEntry> = {
  // Navigation & Core Menu
  'Dashboard': { ta: 'முகப்பு', si: 'උපකරණ පුවරුව' },
  'Team': { ta: 'குழு', si: 'කණ්ඩායම' },
  'Attendance': { ta: 'வருகை', si: 'පැමිණීම' },
  'Leave Management': { ta: 'விடுமுறை மேலாண்மை', si: 'නිවාඩු කළමනාකරණය' },
  'Leave': { ta: 'விடுமுறை', si: 'නිවාඩු' },
  'Projects': { ta: 'திட்டங்கள்', si: 'ව්‍යාපෘති' },
  'Tasks & Kanban': { ta: 'பணிகள் & கான்பன்', si: 'කාර්යයන් සහ කාන්බන්' },
  'Tasks': { ta: 'பணிகள்', si: 'කාර්යයන්' },
  'Activity Audit': { ta: 'நடவடிக்கை தணிக்கை', si: 'ක්‍රියාකාරකම් විගණනය' },
  'Activity': { ta: 'நடவடிக்கை', si: 'ක්‍රියාකාරකම්' },
  'Settings': { ta: 'அமைப்புகள்', si: 'සැකසීම්' },
  'Log Out': { ta: 'வெளியேறு', si: 'පිටවීම' },
  'Logout': { ta: 'வெளியேறு', si: 'පිටවීම' },
  'Language': { ta: 'மொழி', si: 'භාෂාව' },
  'Collapse': { ta: 'சுருக்கு', si: 'හකුලන්න' },
  'Expand': { ta: 'விரிவாக்கு', si: 'දිගහරින්න' },

  // Roles & Personas
  'Admin': { ta: 'நிர்வாகி', si: 'පරිපාලක' },
  'Administrator': { ta: 'முதன்மை நிர்வாகி', si: 'ප්‍රධාන පරිපාලක' },
  'Project Manager': { ta: 'திட்ட மேலாளர்', si: 'ව්‍යාපෘති කළමනාකරු' },
  'Employee': { ta: 'ஊழியர்', si: 'සේවකයා' },
  'Active Employee': { ta: 'செயலில் உள்ள ஊழியர்', si: 'ක්‍රියාකාරී සේවකයා' },
  'System Role': { ta: 'கணினி பங்கு', si: 'පද්ධති කාර්යභාරය' },
  'Switch Role': { ta: 'பங்கை மாற்றவும்', si: 'භූමිකාව මාරු කරන්න' },
  'Switch Persona / Role': { ta: 'பங்கை மாற்றவும்', si: 'භූමිකාව මාරු කරන්න' },
  'Full administrator privileges. Can onboard and deactivate staff, manage system settings, approve/reject leave requests, assign project memberships, and access audit logs.': {
    ta: 'முழு நிர்வாக அணுகல். ஊழியர்களை இணைக்க/நீக்கலாம், அமைப்புகளை நிர்வகிக்கலாம், விடுமுறைகளை அங்கீகரிக்கலாம் மற்றும் பதிவுகளைப் பார்க்கலாம்.',
    si: 'සම්පූර්ණ පරිපාලක බලතල. කාර්යමණ්ඩලය එක් කිරීමට, පද්ධති සැකසුම් කළමනාකරණයට, නිවාඩු අනුමත කිරීමට සහ විගණන ලේඛන බැලීමට හැකිය.'
  },
  'Full company oversight, approvals & employee onboarding': {
    ta: 'முழு நிறுவன மேற்பார்வை, அனுமதிகள் மற்றும் ஊழியர் சேர்க்கை',
    si: 'සම්පූර්ණ සමාගම් අධීක්ෂණය, අනුමැතිය සහ සේවක බඳවා ගැනීම්'
  },
  'Project & task creation, sprint tracking & team reviews': {
    ta: 'திட்டம் மற்றும் பணி உருவாக்கம், கண்காணிப்பு மற்றும் குழு மதிப்பாய்வு',
    si: 'ව්‍යාපෘති සහ කාර්ය නිර්මාණය, නිරීක්ෂණය සහ කණ්ඩායම් සමාලෝචන'
  },
  'Check-in/out, task execution & personal leave requests': {
    ta: 'வருகை பதிவு, பணி நிறைவேற்றம் மற்றும் தனிப்பட்ட விடுமுறை கோரிக்கைகள்',
    si: 'පැමිණීම සටහන් කිරීම, කාර්ය ඉටුකිරීම සහ පුද්ගලික නිවාඩු ඉල්ලීම්'
  },

  // Common Actions & Buttons
  'Save': { ta: 'சேமி', si: 'සුරකින්න' },
  'Save Changes': { ta: 'மாற்றங்களை சேமி', si: 'වෙනස්කම් සුරකින්න' },
  'Save All Changes': { ta: 'அனைத்து மாற்றங்களையும் சேமி', si: 'සියලු වෙනස්කම් සුරකින්න' },
  'Cancel': { ta: 'ரத்து செய்', si: 'අවලංගු කරන්න' },
  'Close': { ta: 'மூடு', si: 'වසන්න' },
  'Delete': { ta: 'நீக்கு', si: 'මකන්න' },
  'Edit': { ta: 'திருத்து', si: 'සංස්කරණය' },
  'Edit Profile': { ta: 'சுயவிவரத்தைத் திருத்து', si: 'පැතිකඩ සංස්කරණය' },
  'View Profile': { ta: 'சுயவிவரத்தைப் பார்', si: 'පැතිකඩ බලන්න' },
  'View Profile & Settings': { ta: 'சுயவிவரம் & அமைப்புகள்', si: 'පැතිකඩ සහ සැකසීම්' },
  'Reset Defaults': { ta: 'இயல்புநிலைக்கு மீட்டமை', si: 'පෙරනිමි වෙත යළි පිහිටුවන්න' },
  'Search': { ta: 'தேடு', si: 'සොයන්න' },
  'Filter': { ta: 'வடிகட்டு', si: 'පෙරහන් කරන්න' },
  'All': { ta: 'அனைத்தும்', si: 'සියල්ල' },
  'All Departments': { ta: 'அனைத்து துறைகளும்', si: 'සියලුම දෙපාර්තමේන්තු' },
  'Check In': { ta: 'வருகை பதிவு', si: 'පැමිණීම සටහන් කරන්න' },
  'Check Out': { ta: 'வெளியேறுதல் பதிவு', si: 'පිටවීම සටහන් කරන්න' },
  'Clock In': { ta: 'வருகை பதிவு', si: 'පැමිණීම සටහன் කරන්න' },
  'Clock Out': { ta: 'வெளியேறுதல் பதிவு', si: 'පිටවීම සටහන් කරන්න' },
  'Apply Leave': { ta: 'விடுமுறைக்கு விண்ணப்பிக்கவும்', si: 'නිවාඩු ඉල්ලුම් කරන්න' },
  'Onboard Member': { ta: 'உறுப்பினரை இணைக்க', si: 'සාමාජිකයෙකු එක් කරන්න' },
  'Onboard New Team Member': { ta: 'புதிய குழு உறுப்பினரை இணைக்க', si: 'නව කණ්ඩායම් සාමාජිකයෙකු එක් කරන්න' },
  'New Project': { ta: 'புதிய திட்டம்', si: 'නව ව්‍යාපෘතිය' },
  'New Task': { ta: 'புதிய பணி', si: 'නව කාර්යය' },
  'Add Task': { ta: 'பணியைச் சேர்', si: 'කාර්යයක් එක් කරන්න' },
  'Approve': { ta: 'அங்கீகரி', si: 'අනුමත කරන්න' },
  'Reject': { ta: 'நிராகரி', si: 'ප්‍රතික්ෂේප කරන්න' },
  'Download': { ta: 'பதிவிறக்கு', si: 'බාගන්න' },
  'Upload': { ta: 'பதிவேற்று', si: 'උඩුගත කරන්න' },
  'Revoke': { ta: 'ரத்து செய்', si: 'අවලංගු කරන්න' },
  'Submit': { ta: 'சமர்ப்பி', si: 'යොමු කරන්න' },

  // Form Fields & Labels
  'Full Name': { ta: 'முழு பெயர்', si: 'සම්පූර්ණ නම' },
  'Full Name *': { ta: 'முழு பெயர் *', si: 'සම්පූර්ණ නම *' },
  'Work Email': { ta: 'பணி மின்னஞ்சல்', si: 'කාර්යාල විද්‍යුත් තැපෑල' },
  'Work Email *': { ta: 'பணி மின்னஞ்சல் *', si: 'කාர்යාල විද්‍යුත් තැපෑල *' },
  'Email Address': { ta: 'மின்னஞ்சல் முகவரி', si: 'විද්‍යුත් තැපැල් ලිපිනය' },
  'Phone Number': { ta: 'தொலைபேசி எண்', si: 'දුරකථන අංකය' },
  'Phone': { ta: 'தொலைபேசி', si: 'දුරකථනය' },
  'Location / Base Office': { ta: 'அமைவிடம் / முதன்மை அலுவலகம்', si: 'ස්ථානය / ප්‍රධාන කාර්යාලය' },
  'Location': { ta: 'அமைவிடம்', si: 'ස්ථානය' },
  'Office / Location': { ta: 'அலுவலகம் / அமைவிடம்', si: 'කාර්යාලය / ස්ථානය' },
  'Department': { ta: 'துறை', si: 'දෙපාර්තමේන්තුව' },
  'Designation': { ta: 'பதவி', si: 'තනතුර' },
  'Designation *': { ta: 'பதவி *', si: 'තනතුර *' },
  'Designation / Title': { ta: 'பதவி / தலைப்பு', si: 'තනතුර / ශීර්ෂය' },
  'Bio & Summary': { ta: 'சுயவிவரச் சுருக்கம்', si: 'ජීව දත්ත සහ සාරාංශය' },
  'Bio': { ta: 'சுயவிவரம்', si: 'ජීව දත්ත' },
  'Status': { ta: 'நிலை', si: 'තත්ත්වය' },
  'Priority': { ta: 'முன்னுரிமை', si: 'ප්‍රමුඛතාවය' },
  'Due Date': { ta: 'கடைசி தேதி', si: 'නියමිත දිනය' },
  'Start Date': { ta: 'தொடக்க தேதி', si: 'ආරම්භක දිනය' },
  'End Date': { ta: 'முடிவு தேதி', si: 'අවසන් දිනය' },
  'Date': { ta: 'தேதி', si: 'දිනය' },
  'Reason': { ta: 'காரணம்', si: 'හේතුව' },
  'Duration': { ta: 'கால அளவு', si: 'කාලසීමාව' },
  'Days': { ta: 'நாட்கள்', si: 'දින' },
  'Hours': { ta: 'மணிநேரம்', si: 'පැය' },
  'Employee Profile Photo': { ta: 'ஊழியர் சுயவிவரப் படம்', si: 'සේවක පැතිකඩ ඡායාරූපය' },
  'Employee Profile Picture': { ta: 'ஊழியர் சுயவிவரப் படம்', si: 'සේවක පැතිකඩ ඡායාරූපය' },
  'Profile Photo': { ta: 'சுயவிவரப் படம்', si: 'පැතිකඩ ඡායාරූපය' },
  'Click the + badge on the avatar to upload an employee photo': {
    ta: 'சுயவிவரப் படத்தை பதிவேற்ற + குறியீட்டை அழுத்தவும்',
    si: 'සේවක ඡායාරූපයක් උඩුගත කිරීමට + ලාංඡනය ක්ලික් කරන්න'
  },
  'Click the + badge on the avatar to upload a photo (PNG, JPG, WebP)': {
    ta: 'புகைப்படத்தை பதிவேற்ற அவதாரில் உள்ள + குறியீட்டை அழுத்தவும் (PNG, JPG, WebP)',
    si: 'ඡායාරූපයක් උඩුගත කිරීමට + ලාංඡනය ක්ලික් කරන්න (PNG, JPG, WebP)'
  },

  // Statuses
  'Active': { ta: 'செயலில்', si: 'ක්‍රියාකාරී' },
  'Inactive': { ta: 'செயலற்றது', si: 'අක්‍රියයි' },
  'Pending': { ta: 'நிலுவையில்', si: 'පොරොත්තුවෙන්' },
  'Approved': { ta: 'அங்கீகரிக்கப்பட்டது', si: 'අනුමතයි' },
  'Rejected': { ta: 'நிராகரிக்கப்பட்டது', si: 'ප්‍රතික්ෂේපිතයි' },
  'Completed': { ta: 'முடிவடைந்தது', si: 'සම්පූර්ණයි' },
  'In Progress': { ta: 'செயலில் உள்ளது', si: 'සිදු වෙමින් පවතී' },
  'In Review': { ta: 'மதிப்பாய்வில்', si: 'සමාලෝචනයේ' },
  'Review': { ta: 'மதிப்பாய்வு', si: 'සමාලෝචනය' },
  'To Do': { ta: 'செய்ய வேண்டியவை', si: 'කළ යුතු දෑ' },
  'Done': { ta: 'முடிந்தது', si: 'අවසන්' },
  'Backlog': { ta: 'நிலுவை', si: 'පසුගිය වැඩ' },
  'Present': { ta: 'வருகை தந்தார்', si: 'පැමිණ සිටී' },
  'Late': { ta: 'தாமதம்', si: 'ප්‍රමාදයි' },
  'Absent': { ta: 'வரவில்லை', si: 'නොපැමිණි' },
  'On Leave': { ta: 'விடுமுறையில்', si: 'නිවාඩු මත' },
  'Half Day': { ta: 'அரை நாள்', si: 'අර්ධ දින' },
  'High': { ta: 'அதிகம்', si: 'ඉහළ' },
  'Medium': { ta: 'நடுத்தரம்', si: 'මධ්‍යම' },
  'Low': { ta: 'குறைவு', si: 'අඩු' },
  'Urgent': { ta: 'அவசரம்', si: 'හදිසි' },

  // Settings Sections & Options
  'Profile Settings': { ta: 'சுயவிவர அமைப்புகள்', si: 'පැතිකඩ සැකසීම්' },
  'Personal information and profile details visible to colleagues across AyiPM.': {
    ta: 'AyiPM முழுவதும் சக ஊழியர்களுக்குத் தெரியும் தனிப்பட்ட தகவல்கள் மற்றும் சுயவிவர விவரங்கள்.',
    si: 'AyiPM හරහා සගයන්ට පෙනෙන පුද්ගලික තොරතුරු සහ පැතිකඩ විස්තර.'
  },
  'Display & Theme': { ta: 'காட்சி & தீம்', si: 'දර්ශනය සහ තේමාව' },
  'Personalize visual appearance, contrast modes, and workspace interface scaling.': {
    ta: 'காட்சி தோற்றம், கான்ட்ராஸ்ட் மற்றும் பணியிட இடைமுகத்தை விருப்பத்திற்கேற்ப மாற்றவும்.',
    si: 'දෘශ්‍ය පෙනුම, තේමා මාදිලි සහ අතුරුමුහුණත පුද්ගලීකරණය කරන්න.'
  },
  'Dark Mode': { ta: 'இருண்ட பயன்முறை', si: 'අඳුරු මාදිලිය' },
  'Light Mode': { ta: 'வெளிச்ச பயன்முறை', si: 'ආලෝක මාදිලිය' },
  'Device Theme': { ta: 'சாதன தீம்', si: 'උපාංග තේමාව' },
  'High-contrast dark palette tailored for focus and reduced eye strain in low-light environments.': {
    ta: 'குறைந்த ஒளி சூழலில் கண் சோர்வைக் குறைக்கும் உயர்தர இருண்ட வண்ணத் திட்டம்.',
    si: 'අඩු ආලෝක තත්ත්ව යටතේ ඇස් වෙහෙස අඩු කරන අඳුරු වර්ණ පටිපාටිය.'
  },
  'Ultra-clean enterprise white theme with electric cyan and brand blue accents.': {
    ta: 'நேர்த்தியான நிறுவன வெள்ளை தீம் மற்றும் பிராண்ட் நீல நிற சிறப்பம்சங்கள்.',
    si: 'ඉතා පිරිසිදු ව්‍යාපාරික සුදු තේමාව සහ සන්නාම නිල් වර්ණ.'
  },
  'Synchronizes automatically with your operating system’s dark/light schedule.': {
    ta: 'உங்கள் கணினியின் இருண்ட/வெளிச்ச அமைப்பிற்கு ஏற்ப தானாக ஒத்திசையும்.',
    si: 'ඔබගේ මෙහෙයුම් පද්ධතියේ සැකසුම් සමඟ ස්වයංක්‍රීයව සමමුහුර්ත වේ.'
  },
  'Language & Regional Settings': { ta: 'மொழி & பிராந்திய அமைப்புகள்', si: 'භාෂාව සහ කලාපීය සැකසීම්' },
  'Configure your primary language, calendar date formats, and time display.': {
    ta: 'முதன்மை மொழி, நாள்காட்டி தேதி வடிவங்கள் மற்றும் நேர காட்சியை அமைக்கவும்.',
    si: 'ප්‍රාථමික භාෂාව, දින ආකෘතිය සහ වේලාව දර්ශනය සකසන්න.'
  },
  'Preferred Language': { ta: 'விருப்பமான மொழி', si: 'කැමති භාෂාව' },
  'Date Format': { ta: 'தேதி வடிவம்', si: 'දින ආකෘතිය' },
  'Time Format': { ta: 'நேர வடிவம்', si: 'වේලා ආකෘතිය' },
  'Week Starts On': { ta: 'வாரம் தொடங்கும் நாள்', si: 'සතිය ආරම්භ වන දිනය' },
  'Verification & Corporate Status': { ta: 'சரிபார்ப்பு & நிறுவன நிலை', si: 'සත්‍යාපනය සහ ආයතනික තත්ත්වය' },
  'Notification Preferences': { ta: 'அறிவிப்பு விருப்பத்தேர்வுகள்', si: 'දැනුම්දීම් මනාපයන්' },
  'Workspace Configuration': { ta: 'பணியிட கட்டமைப்பு', si: 'වැඩබිම් සැකසුම්' },
  'Security & Active Sessions': { ta: 'பாதுகாப்பு & செயலில் உள்ள அமர்வுகள்', si: 'ආරක්ෂාව සහ සක්‍රිය සැසි' },
  'Two-Factor Authentication (2FA)': { ta: 'இரண்டு காரணி அங்கீகாரம் (2FA)', si: 'ද්වි සාධක සත්‍යාපනය (2FA)' },
  'Current Password': { ta: 'தற்போதைய கடவுச்சொல்', si: 'වත්මන් මුරපදය' },
  'New Password': { ta: 'புதிய கடவுச்சொல்', si: 'නව මුරපදය' },
  'Confirm New Password': { ta: 'புதிய கடவுச்சொல்லை உறுதிப்படுத்தவும்', si: 'නව මුරපදය තහවුරු කරන්න' },
  'Company Name': { ta: 'நிறுவனத்தின் பெயர்', si: 'සමාගමේ නම' },
  'Timezone': { ta: 'நேர மண்டலம்', si: 'වේලා කලාපය' },
  'Work Day Start Time': { ta: 'வேலை தொடங்கும் நேரம்', si: 'වැඩ ආරම්භ වන වේලාව' },
  'Attendance Grace Period (mins)': { ta: 'வருகை சலுகைக் காலம் (நிமிடங்கள்)', si: 'පැමිණීමේ සහන කාලය (මිනිත්තු)' },
  'Annual Paid Leave Days': { ta: 'ஆண்டு சம்பள விடுமுறை நாட்கள்', si: 'වාර්ෂික වැටුප් සහිත නිවාඩු දින' },
  'Sick Leave Days': { ta: 'மருத்துவ விடுமுறை நாட்கள்', si: 'අසනීප නිවාඩු දින' },

  // Dashboard Specific
  'Perspective:': { ta: 'பார்வை:', si: 'දෘෂ්ටිකෝණය:' },
  '12-Week Delivery Sprint': { ta: '12 வார விநியோக ஸ்பிரிண்ட்', si: 'සති 12 ක බෙදාහැරීමේ ස්ප්‍රින්ට්' },
  'Company-wide operational metrics, employee headcount, and pending team approvals.': {
    ta: 'நிறுவன அளவிலான செயல்பாட்டு அளவீடுகள், ஊழியர் எண்ணிக்கை மற்றும் நிலுவையில் உள்ள ஒப்புதல்கள்.',
    si: 'සමාගම් පුරා මෙහෙයුම් මිතික, සේවක සංඛ්‍යාව සහ පොරොත්තුවෙන් පවතින අනුමැතීන්.'
  },
  'Project progress velocity, upcoming milestones, and task distribution.': {
    ta: 'திட்ட முன்னேற்ற வேகம், வரவிருக்கும் மைல்கற்கள் மற்றும் பணி பகிர்வு.',
    si: 'ව්‍යාපෘති ප්‍රගති වේගය, ඉදිරි ඉලක්ක සහ කාර්ය බෙදාහැරීම.'
  },
  'Personal tasks, attendance logs, and leave balances.': {
    ta: 'தனிப்பட்ட பணிகள், வருகை பதிவுகள் மற்றும் விடுமுறை நிலுவைகள்.',
    si: 'පුද්ගලික කාර්යයන්, පැමිණීමේ ලඝු-සටහන් සහ නිවාඩු ශේෂයන්.'
  },
  'Total Headcount': { ta: 'மொத்த ஊழியர்கள்', si: 'මුළු සේවක සංඛ්‍යාව' },
  'Active Projects': { ta: 'செயலில் உள்ள திட்டங்கள்', si: 'ක්‍රියාකාරී ව්‍යාපෘති' },
  'Attendance Today': { ta: 'இன்றைய வருகை', si: 'අද දින පැමිණීම' },
  'Pending Leaves': { ta: 'நிலுவை விடுமுறைகள்', si: 'පොරොත්තුවෙන් පවතින නිවාඩු' },
  'Tasks Completed': { ta: 'முடிக்கப்பட்ட பணிகள்', si: 'අවසන් කළ කාර්යයන්' },
  'Sprint Velocity': { ta: 'ஸ்பிரிண்ட் வேகம்', si: 'ස්ප්‍රින්ට් වේගය' },
  'Overdue Tasks': { ta: 'காலாவதியான பணிகள்', si: 'කල් ඉකුත් වූ කාර්යයන්' },
  'Personal Leave Balance': { ta: 'தனிப்பட்ட விடுமுறை இருப்பு', si: 'පුද්ගලික නිවාඩු ශේෂය' },
  'Monthly Attendance': { ta: 'மாதாந்திர வருகை', si: 'මාසික පැමිණීම' },
  'Tasks Assigned to You': { ta: 'உங்களுக்கு ஒதுக்கப்பட்ட பணிகள்', si: 'ඔබට පවරා ඇති කාර්යයන්' },
  'Pending Approvals & Leave Requests': { ta: 'நிலுவை ஒப்புதல்கள் & விடுமுறை கோரிக்கைகள்', si: 'පොරොත්තුවෙන් පවතින අනුමැතිය සහ නිවාඩු ඉල්ලීම්' },
  'Live Project Progress': { ta: 'நேரடி திட்ட முன்னேற்றம்', si: 'සජීවී ව්‍යාපෘති ප්‍රගතිය' },
  'Sprint Delivery Burndown': { ta: 'ஸ்பிரிண்ட் விநியோக விளக்கப்படம்', si: 'ස්ප්‍රින්ට් බෙදාහැරීමේ ප්‍රස්ථාරය' },
  'Team Department Distribution': { ta: 'குழு துறை விநியோகம்', si: 'දෙපාර්තමේන්තු අනුව කණ්ඩායම් බෙදීයාම' },
  'Recent System Audit Ledger': { ta: 'சமீபத்திய கணினி தணிக்கை பதிவேடு', si: 'මෑත පද්ධති විගණන ලේඛනය' },
  'View All Members': { ta: 'அனைத்து உறுப்பினர்களையும் பார்', si: 'සියලුම සාමාජිකයන් බලන්න' },
  'View All Projects': { ta: 'அனைத்து திட்டங்களையும் பார்', si: 'සියලුම ව්‍යාපෘති බලන්න' },
  'View Attendance Ledger': { ta: 'வருகை பதிவேட்டைப் பார்', si: 'පැමිණීමේ ලේඛනය බලන්න' },
  'View All Leave': { ta: 'அனைத்து விடுமுறைகளையும் பார்', si: 'සියලුම නිවාඩු බලන්න' },
  'Quick Actions': { ta: 'விரைவு நடவடிக்கைகள்', si: 'ක්ෂණික ක්‍රියාකාරකම්' },

  // Team Page
  'Team Management': { ta: 'குழு மேலாண்மை', si: 'කණ්ඩායම් කළමනාකරණය' },
  'Directory of employees, operational roles, and department allocations.': {
    ta: 'ஊழியர்கள், செயல்பாட்டு பாத்திரங்கள் மற்றும் துறை ஒதுக்கீடுகளின் அடைவு.',
    si: 'සේවකයින්ගේ නාමාවලිය, මෙහෙයුම් භූමිකාවන් සහ දෙපාර්තමේන්තු වෙන්කිරීම්.'
  },
  'Search team members by name, email, or role...': {
    ta: 'பெயர், மின்னஞ்சல் அல்லது பங்கு மூலம் உறுப்பினர்களைத் தேடுங்கள்...',
    si: 'නම, විද්‍යුත් තැපෑල හෝ තනතුර අනුව සොයන්න...'
  },
  'No team members match your criteria': {
    ta: 'உங்கள் நிபந்தனைகளுடன் பொருந்தும் உறுப்பினர்கள் இல்லை',
    si: 'ඔබගේ සෙවුමට ගැලපෙන සාමාජිකයන් හමු නොවීය'
  },
  'Try clearing search or filters to see all staff members': {
    ta: 'அனைத்து பணியாளர்களையும் காண தேடலை அழிக்கவும்',
    si: 'සියලුම සාමාජිකයන් බැලීමට සෙවුම් පෙරහන් ඉවත් කරන්න'
  },

  // Attendance Page
  'Daily Attendance': { ta: 'தினசரி வருகை', si: 'දෛනික පැමිණීම' },
  'Track attendance check-ins, punctuality, and work hours across the team.': {
    ta: 'குழுவின் வருகை, நேரந்தவறாமை மற்றும் வேலை நேரங்களைக் கண்காணிக்கவும்.',
    si: 'කණ්ඩායමේ පැමිණීම, වේලාවට වැඩ කිරීම සහ වැඩ කරන පැය ගණන නිරීක්ෂණය කරන්න.'
  },
  'Attendance Records': { ta: 'வருகை பதிவுகள்', si: 'පැමිණීමේ වාර්තා' },
  'Work Hours': { ta: 'வேலை நேரம்', si: 'වැඩ කරන පැය ගණන' },
  'Check-in Time': { ta: 'வருகை நேரம்', si: 'පැමිණි වේලාව' },
  'Check-out Time': { ta: 'வெளியேறும் நேரம்', si: 'පිටවූ වේලාව' },

  // Leave Page
  'Submit Leave Request': { ta: 'விடுமுறை கோரிக்கையைச் சமர்ப்பிக்கவும்', si: 'නිවාඩු ඉල්ලීම යොමු කරන්න' },
  'Annual Leave': { ta: 'ஆண்டு விடுமுறை', si: 'වාර්ෂික නිවාඩු' },
  'Sick Leave': { ta: 'மருத்துவ விடுமுறை', si: 'අසනීප නිවාඩු' },
  'Casual Leave': { ta: 'தற்செயல் விடுமுறை', si: 'හදිසි නිවාඩු' },
  'Leave Balances': { ta: 'விடுமுறை இருப்பு', si: 'නිවාඩු ශේෂයන්' },
  'Available': { ta: 'கிடைக்கக்கூடியவை', si: 'ඉතිරිව ඇති' },
  'Used': { ta: 'பயன்படுத்தப்பட்டது', si: 'භාවිතා කළ' },
  'Total': { ta: 'மொத்தம்', si: 'මුළු' },

  // Projects & Tasks
  'Projects & Initiatives': { ta: 'திட்டங்கள் & முன்முயற்சிகள்', si: 'ව්‍යාපෘති සහ මූලාරම්භයන්' },
  'Manage client deliverables, milestones, tech stacks, and team assignments.': {
    ta: 'வாடிக்கையாளர் திட்டங்கள், மைல்கற்கள் மற்றும் பணிகளை நிர்வகிக்கவும்.',
    si: 'සේවාදායක ව්‍යාපෘති, ඉලක්ක සහ කණ්ඩායම් පැවරුම් කළමනාකරණය කරන්න.'
  },
  'Tasks & Delivery Board': { ta: 'பணிகள் & விநியோக பலகை', si: 'කාර්යයන් සහ බෙදාහැරීම් පුවරුව' },
  'Kanban sprint workflows, task assignments, blockers, and backlog priorities.': {
    ta: 'கான்பன் ஸ்பிரிண்ட் பணிப்பாய்வு, பணி ஒதுக்கீடுகள் மற்றும் முன்னுரிமைகள்.',
    si: 'කාන්බන් වැඩ ප්‍රවාහ, කාර්ය පැවරුම් සහ ප්‍රමුඛතා.'
  },
  'Create New Project': { ta: 'புதிய திட்டத்தை உருவாக்கு', si: 'නව ව්‍යාපෘතියක් සාදන්න' },
  'Create Project': { ta: 'திட்டத்தை உருவாக்கு', si: 'ව්‍යාපෘතියක් සාදන්න' },
  'Project Title': { ta: 'திட்ட தலைப்பு', si: 'ව්‍යාපෘති නාමය' },
  'Project Name': { ta: 'திட்டத்தின் பெயர்', si: 'ව්‍යාපෘතියේ නම' },
  'Description': { ta: 'விளக்கம்', si: 'විස්තරය' },
  'Progress': { ta: 'முன்னேற்றம்', si: 'ප්‍රගතිය' },
  'Assignee': { ta: 'ஒதுக்கப்பட்டவர்', si: 'පවරන ලද පුද්ගලයා' },
  'Task Title': { ta: 'பணி தலைப்பு', si: 'කාර්යයේ නම' },
  'Comments': { ta: 'கருத்துக்கள்', si: 'අදහස්' },

  // Activity Page
  'Activity Audit Ledger': { ta: 'செயல்பாட்டு தணிக்கை பதிவேடு', si: 'ක්‍රියාකාරකම් විගණන ලේඛනය' },
  'Immutable ledger of every state change: onboarding, task transitions, attendance check-ins, and leave decisions.': {
    ta: 'ஒவ்வொரு மாற்றத்தின் நிரந்தர பதிவு: சேர்க்கை, பணிகள், வருகை மற்றும் விடுமுறை முடிவுகள்.',
    si: 'සෑම පද්ධති වෙනස්කමකම ස්ථිර ලේඛනය: බඳවා ගැනීම්, කාර්යයන්, පැමිණීම සහ නිවාඩු තීරණ.'
  },
  'Event': { ta: 'நிகழ்வு', si: 'සිදුවීම' },
  'Actor': { ta: 'செய்தவர்', si: 'ක්‍රියාකරු' },
  'Entity': { ta: 'பொருள்', si: 'අදාළ අංශය' },
  'Timestamp': { ta: 'நேரமுத்திரை', si: 'වේලාව' },
  'Details': { ta: 'விவரங்கள்', si: 'විස්තර' },

  // Toast / Feedback
  'All settings and account preferences saved successfully.': {
    ta: 'அனைத்து அமைப்புகளும் வெற்றிகரமாக சேமிக்கப்பட்டன.',
    si: 'සියලුම සැකසුම් සාර්ථකව සුරකින ලදී.'
  },
  'Profile picture updated successfully!': {
    ta: 'சுயவிவரப் படம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!',
    si: 'පැතිකඩ ඡායාරූපය සාර්ථකව යාවත්කාලීන කරන ලදී!'
  }
};

/**
 * Translates an English string into Tamil or Sinhala if available,
 * otherwise returns original string.
 */
export function t(text: string, lang: string = 'English'): string {
  if (!text || lang === 'English') return text;
  
  const trimmed = text.trim();
  const entry = DICTIONARY[trimmed];
  if (entry) {
    return lang === 'Tamil' ? entry.ta : lang === 'Sinhala' ? entry.si : text;
  }

  // Case-insensitive fallback
  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(DICTIONARY)) {
    if (key.toLowerCase() === lower) {
      return lang === 'Tamil' ? val.ta : lang === 'Sinhala' ? val.si : text;
    }
  }

  return text;
}
