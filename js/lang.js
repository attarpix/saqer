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
  'THE GATE TO THE THEATRE.': 'بوابة المدرّج.', 'IT IS LOCKED: GET ITS KEY': 'مسكّرة: جيب مفتاحها', 'FROM THE TEMPLE IN THE SKY.': 'من المعبد اللي بالسما.',
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
  'CHOOSE DIFFICULTY': 'اختار الصعوبة', 'EASY': 'سهل', 'NORMAL': 'عادي', 'HARD': 'صعب',
  'THE MAP': 'الخريطة', 'TEMPLE IN THE SKY': 'المعبد بالسما', 'THE THEATRE': 'المدرّج', 'THE STREET': 'الشارع', 'YOU ARRIVE': 'بتوصل هون',
  'WEST VAULT': 'القبو الغربي', 'MIDDLE VAULT': 'القبو الأوسط', 'EAST VAULT': 'القبو الشرقي',
  'THE BRONZE KEY IS IN THE MIDDLE VAULT.': 'المفتاح البرونزي بالقبو الأوسط.',
  'IT FREES THE CHAINED LIFT AT THE WEST END OF THE STREET.': 'بفكّ المصعد المربوط بآخر الشارع من الغرب.',
  "THE LIFT CLIMBS TO THE TEMPLE: HERCULES' KEY IS AT ITS DOOR.": 'المصعد بطلع عالمعبد: مفتاح هرقل عند بابه.',
  'HIS KEY OPENS THE GATE IN THE EAST VAULT.': 'مفتاحه بفتح البوابة بالقبو الشرقي.',
  'BEHIND IT, A LIFT CLIMBS TO THE THEATRE.': 'ووراها مصعد بطلع عالمدرّج.',
  // the end of stage one, and the hall
  'BACK IN AMMAN, TODAY.': 'رجعنا لعمّان، اليوم.', 'THE GATE BY THE FLAG LEADS ON.': 'البوابة اللي جنب العلم بتوخذك لقدّام.',
  'STAGE ONE COMPLETE!': 'خلصت المرحلة الأولى!', 'PRESS ▼ BY ANYTHING THAT GLOWS.': 'اضغط ▼ جنب أي إشي بلمع.',
  'STAGE 1': 'المرحلة 1', 'STAGE 2': 'المرحلة 2', 'OPENS ON 21.11.': 'بتفتح 21.11.', 'COMING SOON.': 'قريباً.',
  'THE GAME IS STILL BEING MADE.': 'اللعبة لسّا قيد التطوير.',
  'PLAY AGAIN': 'العب من جديد', 'SAVE SCORE': 'سجّل نتيجتك', 'THANK YOU': 'شكراً', 'TOP 10': 'أفضل 10', 'BE THE FIRST!': 'كون الأول!', 'SOON': 'قريباً',
  'YOUR SCORE': 'نتيجتك', 'POINTS': 'النقاط', 'FINAL SCORE': 'النتيجة النهائية', 'CHEATER': 'غشاش', 'YOUR NAME (OPTIONAL)': 'اسمك (اختياري)', 'SAVED AS': 'انسجلت باسم', 'YOUR SCORE IS ON THE BOARD.': 'نتيجتك انسجلت عاللوحة.', 'NO SCORE WITH THE CHEAT ON.': 'ما في نتيجة مع الغش.', 'SAVE': 'سجّل', 'NAME': 'اسمك', 'SAVED!': 'انسجلت!', 'NOT WITH THE CHEAT ON.': 'ما بنسجّل مع الغش.',
  'SAVED ON THIS PHONE FOR NOW.': 'هلّق بتنحفظ على هالجهاز بس.', 'NO SCORES YET: BE THE FIRST!': 'لسّا ما في نتائج: كون الأول!',
  'COULD NOT SAVE. TRY AGAIN.': 'ما زبطت. جرّب كمان مرة.',
  'THANK YOU FOR PLAYING MY GAME!': 'شكراً إنك لعبت لعبتي!',
  'STAGE 2 OPENS ON 21.11. STAGES 3, 4 AND 5 ARE COMING SOON: THE GAME IS STILL BEING MADE.': 'المرحلة الثانية بتفتح بـ 21.11، والمراحل 3 و4 و5 قريباً: اللعبة لسّا قيد التطوير.',
  'WANT TO HELP DESIGN THE NEXT STAGES, OR BECOME A CHARACTER IN THE GAME? TALK TO ATTAR.': 'بدك تساعد بتصميم المراحل الجاية، أو تصير شخصية باللعبة؟ احكي مع attar10x.',
  'PLAY STAGE 1 AGAIN?': 'تلعب المرحلة الأولى من جديد؟', 'ON HARD: ALL THE ENEMIES, AND THE THORNS. AMMAN AT SUNSET.': 'على الصعب: كل الأعداء والشوك، وعمّان وقت الغروب.',
  'YES, ON HARD': 'يلّا، على الصعب',
  'INFO': 'عن اللعبة', 'ABOUT SAQER': 'عن صقر', 'BACK': 'رجوع', 'A GAME BY': 'لعبة من تصميم',
  "SAQER IS A GAME DESIGNED BY ATTAR10X TO RAISE AWARENESS OF JORDAN'S HISTORIC SITES, AND OF WHY THEY ARE WORTH PROTECTING.": 'صقر لعبة من تصميم attar10x، هدفها التوعية بأهمية المواقع التاريخية في الأردن، وليش لازم نحافظ عليها.',
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
  ? ['الوقت ' + time, 'دنانير ' + dinars, 'النقاط ' + score]
  : ['TIME  ' + time, 'DINARS  ' + dinars, 'POINTS  ' + score];   // the final score comes in the hall

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
