/* ============================================================
   LANGUAGE — the game speaks Arabic by default; ENGLISH on the title screen switches it.
   Every English line on screen goes through t(): in Arabic it is looked up in AR below
   (a line not listed stays English). The choice is saved with the high score.
   To change the Arabic font, change AR_FONT (and the Google Fonts link in index.html).
   ============================================================ */
import { loadSave, writeSave } from './storage.js';

export const AR_FONT = '"Changa", "Noto Kufi Arabic", "Segoe UI", sans-serif';
export const AR_WEIGHT = 700;

let lang = loadSave().lang || 'ar';
export const isAr = () => lang === 'ar';

const AR = {
  // score bar
  'SAQER': 'صقر', 'MAHR': 'المهر', 'DINARS': 'دنانير', 'STAGE': 'المرحلة', 'LIVES': 'الأرواح', 'TIME': 'الوقت',
  'HERCULES': 'هرقل', 'ATTAR10X': 'ATTAR10X',
  // stage names (the STAGE value)
  '1-1': '1-1', 'PHILADELPHIA': 'فيلادلفيا', 'THE TEMPLE': 'المعبد', 'THE VAULTS': 'الأقبية', 'THE THEATRE': 'المدرّج',
  // in the world
  'AKH!': 'آخ!', 'STOMP!': 'دوس!', 'NOT YET!': 'مش هسّا!', '1UP': '+1 روح',
  'GOLDEN JAMEED': 'الجميد الذهبي', 'GROWN FOR GOOD': 'كبير للأبد',
  'THEATRE': 'المدرّج', 'TEMPLE': 'المعبد',
  'AMMAN, ALMOST 1,900 YEARS EARLIER': 'عمّان، قبل حوالي 1900 سنة',
  'HERCULES YIELDS!': 'هرقل استسلم!', 'PRESS JUMP': 'اضغط قفز',
  // messages
  'HERCULES!': 'هرقل!', 'STOMP HIM WHILE HE CATCHES HIS BREATH.': 'دوس عليه وهو بياخد نفَسه.',
  'THE GATE IS BURIED.': 'البوابة انطمرت.', 'RIDE THE LIFT BACK OVER THE GREAT STAIR.': 'اركب المصعد وارجع فوق الدرج الكبير.',
  'THE GOLDEN JAMEED!': 'الجميد الذهبي!', 'SAQER STAYS GROWN FOR GOOD.': 'صقر بضلّه كبير للأبد.',
  'HE CAN TAKE 3 HITS NOW.': 'هسّا بيتحمّل 3 ضربات.', 'JAMEED AND MANSAF REFILL THEM.': 'الجميد والمنسف برجّعوهم.',
  'THE GATE IS OPEN.': 'البوابة انفتحت.', 'THE LIFT BEYOND IT CLIMBS TO THE THEATRE.': 'المصعد اللي وراها بطلع عالمدرّج.',
  'THE LIFT IS CHAINED.': 'المصعد مربوط بالجنازير.', 'THE BRONZE KEY IN THE VAULTS': 'المفتاح البرونزي اللي بالأقبية',
  'WILL FREE IT.': 'بفكّه.',
  'THE CHAINS FALL AWAY.': 'الجنازير وقعت.', 'RIDE THE LIFT UP TO THE TEMPLE OF HERCULES.': 'اركب المصعد واطلع على معبد هرقل.',
  'THE BRONZE KEY!': 'المفتاح البرونزي!', 'IT FREES THE CHAINED LIFT': 'بفكّ المصعد المربوط',
  'AT THE WEST END OF THE STREET.': 'بآخر الشارع من الغرب.',
  'THE KEY OF HERCULES!': 'مفتاح هرقل!', 'IT OPENS THE GATE IN THE EAST VAULT,': 'بفتح البوابة بالقبو الشرقي،',
  'ON THE WAY TO THE THEATRE.': 'عالطريق للمدرّج.',
  'LOCKED.': 'مسكّرة.', 'ITS KEY IS IN THE TEMPLE OF HERCULES,': 'مفتاحها بمعبد هرقل،', 'HIGH ABOVE THE CITY.': 'فوق المدينة بالعالي.',
  'THE BRONZE KEY IS IN ANOTHER VAULT.': 'المفتاح البرونزي بقبو ثاني.',
  'ATTAR10X: UNKILLABLE': 'ATTAR10X: ما بموت', 'NOTHING CAN HURT SAQER NOW.': 'ولا إشي بأذي صقر هسّا.',
  'ATTAR10X: OFF': 'ATTAR10X: انطفى', 'BACK TO NORMAL.': 'رجعنا عالطبيعي.',
  // menus (index.html)
  'A JOURNEY BACK IN TIME': 'رحلة عبر الزمن', 'START': 'ابدأ', 'INSTALL': 'ثبّت اللعبة',
  'PAUSED': 'استراحة', 'RESUME': 'كمّل', 'RESTART STAGE': 'أعد المرحلة', 'QUIT TO TITLE': 'للقائمة الرئيسية',
  'GAME OVER': 'انتهت اللعبة', 'TRY THIS STAGE AGAIN': 'جرّب المرحلة مرة ثانية', 'TITLE': 'القائمة الرئيسية',
  'SKIP': 'تخطّي', 'NEXT ▶': '◀ التالي', 'LOADING…': 'جاري التحميل…',
  '←→ MOVE · Z JUMP · X RUN · P PAUSE · M SOUND': '←→ مشي · Z قفز · P استراحة · M صوت',
  // story speakers
  'DANA': 'دانا',
};

export const t = s => (lang === 'ar' && AR[s] !== undefined ? AR[s] : s);

/* lines built from numbers */
export const tSound = muted => lang === 'ar' ? 'الصوت: ' + (muted ? 'مطفي' : 'شغّال') : 'SOUND: ' + (muted ? 'OFF' : 'ON');
export const tBest = n => (lang === 'ar' ? 'أفضل نتيجة ' : 'BEST ') + n;
export const tScore = n => (lang === 'ar' ? 'النتيجة ' : 'SCORE ') + n;
export const tStage = id => lang === 'ar' ? 'المرحلة ' + t(id) : 'STAGE ' + id;
export const tLiras = n => lang === 'ar' ? n + ' ليرات ذهب مخبّاية هون' : n + ' GOLD LIRAS HIDDEN HERE';
export const tVictory = (time, bonus, dinars, liras, score) => lang === 'ar'
  ? ['الوقت ' + time + '   مكافأة ' + bonus, 'دنانير ' + dinars, 'النتيجة ' + score]
  : ['TIME  ' + time + '   BONUS ' + bonus, 'DINARS  ' + dinars, 'SCORE  ' + score];

/* the menus in index.html: every element marked data-t keeps its English in data-en */
export function applyLang() {
  document.body.classList.toggle('ar', lang === 'ar');
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-t]').forEach(el => {
    if (!el.dataset.en) el.dataset.en = el.textContent.trim();
    el.textContent = t(el.dataset.en);
  });
  const sw = document.querySelector('[data-act="lang"]');
  if (sw) sw.textContent = lang === 'ar' ? 'ENGLISH' : 'عربي';
}
export function toggleLang() {
  lang = lang === 'ar' ? 'en' : 'ar';
  writeSave({ lang });
  applyLang();
}
