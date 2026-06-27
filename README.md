# 💍 החתונה שלנו — אפליקציית תכנון חתונה

אפליקציית **PWA** בעברית מלאה (RTL), **mobile-first**, לתכנון חתונה מקצה לקצה — מוזמנים ואישורי הגעה, תקציב, ספקים, משימות, מתנות, לוח זמנים ליום האירוע וגלריית השראה. כולל **התחברות עם Google**, **עריכה משותפת** עם בן/בת הזוג, ושמירה בזמן אמת ל-**Firebase**.

> עוצב בהשראת סגנון מודרני, חמים וצבעוני — כרטיסים מעוגלים, טקסט גדול, וטבעות התקדמות, עם אנימציות חלקות (Framer Motion) לאורך כל האפליקציה.

---

## ✨ מה יש באפליקציה

| מודול | תיאור |
|------|-------|
| 🏠 **דשבורד** | ספירה לאחור ליום החתונה + טבעות התקדמות לכל תחום |
| 👰 **מוזמנים + RSVP** | רשימת מוזמנים, צד/קבוצה, כמות, אישורי הגעה, חיפוש וסינון |
| 💰 **תקציב** | תקציב כולל, שולם/נותר, סעיפי הוצאה — כולל עלויות הספקים |
| 📸 **ספקים** | קטגוריות (אולם, צלם, די.ג׳יי…), סטטוס, מחיר ותשלום, חיוג מהיר |
| ✅ **משימות** | צ׳קליסט לפי שלבים (12 חודשים → יום האירוע), עם משימות ברירת מחדל |
| 🎁 **מתנות וכספים** | מעקב אחרי מתנות וסכומים שהתקבלו |
| ⏰ **לו״ז יום האירוע** | טיימליין מסודר של היום הגדול עם אחראים ומיקומים |
| 🖼️ **השראה ומסמכים** | העלאת תמונות וקבצי PDF ל-Firebase Storage |
| 🤝 **שיתוף ועריכה משותפת** | הזמנת שותף לפי אימייל — עריכה משותפת בזמן אמת |

---

## 🧱 טכנולוגיות

- **React 18 + TypeScript + Vite 6**
- **Tailwind CSS** (מוגדר ל-RTL ופלטת צבעים מותאמת)
- **Framer Motion** — אנימציות ומעברי עמודים
- **Firebase** — Authentication (Google), Firestore, Storage
- **vite-plugin-pwa** — Service Worker, מניפסט, התקנה למסך הבית
- **React Router**, **react-hot-toast**, **lucide-react**

---

## 🚀 הרצה מהירה

```bash
# 1. התקנת תלויות
npm install

# 2. הגדרת Firebase (ראו מדריך למטה) — צרו קובץ .env
cp .env.example .env
#    ומלאו את הערכים שלכם

# 3. הרצה בפיתוח
npm run dev

# 4. בנייה לפרודקשן
npm run build && npm run preview
```

האפליקציה תפעל גם בלי Firebase ותציג מסך הסבר, אך לשמירת נתונים והתחברות צריך להגדיר פרויקט.

---

## 🔥 מדריך הקמת Firebase (כ-5 דקות)

### 1. יצירת פרויקט
1. היכנסו ל-[console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. תנו שם (למשל `our-wedding`) וסיימו את האשף.

### 2. הוספת אפליקציית Web
1. בפרויקט → ⚙️ **Project settings** → **Your apps** → אייקון `</>` (Web).
2. רשמו את האפליקציה. תקבלו אובייקט `firebaseConfig` — אלו הערכים ל-`.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. הפעלת התחברות עם Google
1. **Build → Authentication → Get started**.
2. בלשונית **Sign-in method** → הפעילו **Google** → שמרו.
3. ב-**Settings → Authorized domains** ודאו שמופיע `localhost` (ובהמשך הדומיין של ה-Hosting).

### 4. הפעלת Firestore
1. **Build → Firestore Database → Create database** → בחרו אזור (למשל `eur3`/`europe-west`).
2. התחילו ב-**Production mode** (הכללים שלנו ידרסו את ברירת המחדל).

### 5. הפעלת Storage
1. **Build → Storage → Get started** → אשרו את האזור.

### 6. פריסת חוקי האבטחה (Rules)
הקבצים `firestore.rules` ו-`storage.rules` כבר בריפו. כדי לפרוס אותם:

```bash
npm i -g firebase-tools
firebase login
firebase use --add        # בחרו את הפרויקט שיצרתם
firebase deploy --only firestore:rules,storage
```

> **מודל ההרשאות:** רק חברי החתונה (`memberIds`) קוראים/כותבים לנתונים שלה. הזמנה לעריכה מתבצעת לפי אימייל; מי שמוזמן רואה את ההזמנה אחרי התחברות עם Google באותה כתובת, ויכול לצרף את עצמו כעורך.

---

## ☁️ פריסה ל-Firebase Hosting

```bash
firebase init hosting     # אם עוד לא — בחרו dist כתיקיית public, SPA: כן
npm run build
firebase deploy           # פורס Hosting + Rules
```

הקובץ `firebase.json` כבר מוגדר (תיקיית `dist`, ניתוב SPA, וכותרות Cache).

---

## 📁 מבנה הפרויקט

```
src/
├── components/
│   ├── ui/          # רכיבי בסיס: Button, Input, Select, BottomSheet, ProgressRing...
│   └── layout/      # AppShell, BottomNav, PageHeader
├── context/         # AuthContext, WeddingContext (מצב גלובלי + Firestore)
├── hooks/           # useWeddingCollection (CRUD בזמן אמת), usePWAInstall
├── firebase/        # אתחול Firebase
├── lib/             # types, utils, constants, motion (וריאנטים של אנימציה)
└── pages/           # מסך לכל מודול
```

### מודל הנתונים (Firestore)
```
users/{uid}
weddings/{weddingId}
  ├── guests/{id}
  ├── vendors/{id}
  ├── budget/{id}
  ├── tasks/{id}
  ├── gifts/{id}
  ├── schedule/{id}
  └── inspiration/{id}
```

---

## 🛠️ סקריפטים

| פקודה | תיאור |
|------|-------|
| `npm run dev` | שרת פיתוח |
| `npm run build` | בדיקת טייפים + בנייה לפרודקשן |
| `npm run preview` | תצוגה מקדימה של ה-build |
| `npm run deploy` | בנייה + פריסה מלאה ל-Firebase |
| `npm run firebase:rules` | פריסת חוקי Firestore + Storage בלבד |

---

## 📲 התקנה כאפליקציה (PWA)
פתחו את הכתובת בנייד → תפריט הדפדפן → **הוספה למסך הבית**. בתוך האפליקציה יש גם כפתור "התקנת האפליקציה" (מסך "עוד").

---

עשוי באהבה 💛 — שיהיה במזל טוב!
