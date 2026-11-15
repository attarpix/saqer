/* ============================================================
   STORY — everything Saqer and Dana say lives in this one file.

   The lines below are DRAFTS so the game is playable today.
   Replace them with your own interactions whenever you like.

   HOW IT WORKS
   A scene is a list of pages. One page = one line of dialogue:

     { speaker: 'DANA', text: 'ENGLISH LINE', ar: 'السطر بالعربي', vo: 'assets/vo/dana-01.mp3' }

     speaker  'SAQER', 'DANA', or '' for the narrator. The speaker
              gets the arrow above their head and moves their mouth.
     text     English line (the pixel font is capitals only).
     ar       Arabic line, shown right-to-left under it (optional).
     vo       Voice-over file for this line (optional). Put the
              recordings in assets/vo/ and write the path here.
              One line plays at a time: moving to the next page
              stops the one before it, so voices never overlap.
     bg       Backdrop from here on: 'amman', 'petra' or 'rum'.
     cast     Who is on screen from here on: ['saqer', 'dana'],
              ['saqer'], ['dana'] or [].
     tent     true to show the family tent behind them.
     when     show this page only in one case:
              'allGold'  every gold lira in the game was found
              'someGold' at least one gold lira was found

   You only write bg / cast / tent on the page where they change.

   These are filled in for you inside any line:
     {goal}   the mahr Dana asks for          {mahr}  dinars collected so far
     {short}  dinars still missing            {gold}  gold liras found so far
     {goldAll} gold liras hidden in the game

   SCENES
     intro                 after START, before stage 1
     levels[id].before     before a stage      (ids are in levels.js)
     levels[id].after      after a stage — Dana tells Saqer what her family wants next
     ending                after the last stage, with the full mahr
     endingShort           after the last stage, without enough mahr

   Leave a scene as [] to skip it.
   The mahr itself (how many dinars) is MAHR_GOAL in config.js.
   ============================================================ */

/* Your own drawing of Dana: save one picture (facing LEFT, transparent
   background, about 46 x 58 pixels or any multiple of that) and put its
   path here, e.g. 'assets/sprites/dana.png'. null = the built-in Dana. */
export const DANA_ART = null;

export const STORY = {
  intro: [
    { bg: 'amman', cast: ['saqer', 'dana'],
      speaker: '', text: 'AMMAN. THE SUN SETS OVER THE SEVEN HILLS.', ar: 'عمّان. الشمس تغيب خلف الجبال السبعة.' },
    { speaker: 'SAQER', text: 'DANA, I WANT TO ASK YOUR FAMILY FOR YOUR HAND.', ar: 'دانا، بدّي أطلب إيدك من أهلك.' },
    { speaker: 'DANA', text: 'GET MY MAHR BEFORE YOU TALK TO MY FAMILY, SAQER.', ar: 'جيب مهري قبل ما تحكي مع أهلي يا صقر.' },
    { speaker: 'SAQER', text: 'OKAY! HOW MUCH IS IT?', ar: 'ماشي! قدّيش المهر؟' },
    { speaker: 'DANA', text: '{goal} DINARS. NOT ONE DINAR LESS.', ar: '{goal} دينار. ولا دينار أقل.' },
    { speaker: 'SAQER', text: 'THEN I WILL COLLECT EVERY DINAR IN JORDAN. YALLA!', ar: 'رح ألمّ كل دينار بالأردن. يلّا!' },
  ],

  levels: {
    '1-1': {
      before: [],
      after: [
        { bg: 'amman', cast: ['saqer', 'dana'],
          speaker: 'DANA', text: '{mahr} DINARS ALREADY? NOT BAD, SAQER.', ar: '{mahr} دينار من أولها؟ مش قليل يا صقر.' },
        { speaker: 'DANA', text: 'MY MOTHER SAYS: NO WEDDING WITHOUT GOLD. FIND THE HIDDEN GOLD LIRAS.', ar: 'أمي بتقول: ما في عرس بدون ذهب. دوّر على ليرات الذهب المخبّاية.' },
        { speaker: 'SAQER', text: 'GOLD LIRAS. I WILL LOOK IN EVERY CORNER.', ar: 'ليرات ذهب. رح أدوّر بكل زاوية.' },
      ],
    },
    '1-2': {
      before: [
        { bg: 'amman', cast: ['saqer'],
          speaker: '', text: "JABAL AL-QAL'A. THE CITADEL WATCHES OVER OLD AMMAN.", ar: 'جبل القلعة يطلّ على عمّان القديمة.' },
      ],
      after: [
        { bg: 'amman', cast: ['saqer', 'dana'],
          speaker: 'DANA', text: 'YOU CLIMBED THE WHOLE CITADEL FOR ME?', ar: 'طلعت القلعة كلها عشاني؟' },
        { speaker: 'DANA', text: 'MY FATHER WANTS A MAN WHO KNOWS ALL OF JORDAN. GO SOUTH, TO PETRA.', ar: 'أبوي بدّه زلمة بعرف الأردن كلها. انزل عالجنوب، عالبترا.' },
        { speaker: 'SAQER', text: 'PETRA IT IS. KEEP COUNTING, DANA.', ar: 'عالبترا. ضلّي عدّي يا دانا.' },
      ],
    },
    '1-3': {
      before: [
        { bg: 'petra', cast: ['saqer'],
          speaker: '', text: 'PETRA. THE ROSE-RED CITY, CARVED FROM THE MOUNTAIN.', ar: 'البترا. المدينة الوردية المنحوتة بالصخر.' },
      ],
      after: [
        { bg: 'petra', cast: ['saqer', 'dana'],
          speaker: 'DANA', text: '{mahr} OF {goal}. YOU ARE CLOSE.', ar: '{mahr} من {goal}. قرّبت.' },
        { speaker: 'DANA', text: 'LAST THING. MY GRANDFATHER WAITS IN OUR TENT IN WADI RUM.', ar: 'آخر إشي. جدّي بستنّاك ببيت الشعر بوادي رم.' },
        { speaker: 'DANA', text: 'HE IS THE ONE WHO POURS THE COFFEE.', ar: 'هو اللي بصبّ القهوة.' },
        { speaker: 'SAQER', text: 'TELL HIM TO KEEP IT HOT.', ar: 'قوليله يخلّيها سخنة.' },
      ],
    },
    '1-4': {
      before: [
        { bg: 'rum', cast: ['saqer'],
          speaker: '', text: 'WADI RUM. THE VALLEY OF THE MOON.', ar: 'وادي رم. وادي القمر.' },
      ],
      after: [],
    },
  },

  ending: [
    { bg: 'rum', cast: ['saqer', 'dana'], tent: true,
      speaker: '', text: 'THE FAMILY TENT GLOWS UNDER THE STARS OF WADI RUM.', ar: 'بيت الشعر مضوّي تحت نجوم وادي رم.' },
    { speaker: 'SAQER', text: 'DANA! {mahr} DINARS. YOUR MAHR, IN FULL.', ar: 'دانا! {mahr} دينار. مهرك كامل.' },
    { when: 'allGold',
      speaker: 'DANA', text: 'AND ALL {goldAll} GOLD LIRAS! MY MOTHER LOVES YOU ALREADY.', ar: 'وكل ليرات الذهب الـ{goldAll}! أمي حبّتك من هسّا.' },
    { speaker: 'DANA', text: 'YOU REALLY DID IT. NOW GO IN. MY FAMILY IS WAITING.', ar: 'عن جد عملتها. فوت هسّا، أهلي بستنّوك.' },
    { cast: ['dana'],
      speaker: '', text: 'SAQER DRANK THE COFFEE. HER FATHER SMILED: MABROOK!', ar: 'شرب صقر القهوة. ابتسم أبوها وقال: مبروك!' },
    { cast: ['saqer', 'dana'],
      speaker: '', text: 'AND ALL OF JORDAN WAS INVITED TO THE MANSAF. THE END.', ar: 'وانعزمت الأردن كلها عالمنسف. النهاية.' },
  ],

  endingShort: [
    { bg: 'rum', cast: ['saqer', 'dana'], tent: true,
      speaker: '', text: 'THE FAMILY TENT GLOWS UNDER THE STARS OF WADI RUM.', ar: 'بيت الشعر مضوّي تحت نجوم وادي رم.' },
    { speaker: 'DANA', text: 'ONLY {mahr}? YOU ARE {short} DINARS SHORT, SAQER.', ar: 'بس {mahr}؟ ناقصك {short} دينار يا صقر.' },
    { speaker: 'DANA', text: 'JORDAN IS FULL OF DINARS AND HIDDEN GOLD. GO AGAIN. I WILL WAIT.', ar: 'الأردن مليانة دنانير وذهب مخبّى. ارجع كمان مرة. أنا بستنّاك.' },
  ],
};

/* ============================================================
   THE THEATRE — what is said before and after the Hercules fight.
   These are placeholders: your cinematic goes here. A page works
   the same way as above; use speaker 'HERCULES' or 'SAQER',
   bg 'theater', and cast ['saqer', 'hercules'].
   Leave a list empty ( [] ) to skip it.
   ============================================================ */
STORY.beforeBoss = [
  { bg: 'theater', cast: ['saqer', 'hercules'], speaker: '',
    text: 'PHILADELPHIA. THE THEATRE IS FULL: SIX THOUSAND SEATS, AND EVERY ONE TAKEN.',
    ar: 'فيلادلفيا. المدرّج مليان: ستة آلاف مقعد.' },
  { speaker: 'HERCULES', text: 'A STRANGER IN MY CITY. THEY BUILT ME A TEMPLE ON THAT HILL. WHAT DID THEY BUILD FOR YOU?',
    ar: 'غريب بمدينتي. بنولي معبد على هذاك الجبل. وإنت شو بنولك؟' },
  { speaker: 'SAQER', text: 'NOTHING YET. GIVE ME A MINUTE.', ar: 'ولا إشي لسّا. أعطيني دقيقة.' },
];
STORY.afterBoss = [
  { bg: 'theater', cast: ['saqer', 'hercules'], speaker: 'HERCULES', text: 'GG BRO.', ar: 'GG BRO.' },   // the owner's line: the first thing he says, beaten
  { speaker: 'HERCULES',
    text: 'ENOUGH. THE CROWD HAS CHOSEN. THE CITY IS YOURS TO WALK, SAQER OF AMMAN.',
    ar: 'بكفّي. الناس اختاروا. المدينة إلك تمشي فيها يا صقر عمّان.' },
];

/* ============================================================
   PHILADELPHIA — after the time jump, before Saqer is free to go.
   The narrator introduces the old city; the reader moves on with NEXT,
   so there is time to read. The last page warns that the city is a
   little maze.
   ============================================================ */
STORY.philadelphia = [
  { bg: 'phila', cast: ['saqer'], speaker: '',
    text: 'PHILADELPHIA, 150 AD. THE ROMAN CITY AT THE HEART OF WHAT WILL ONE DAY BE AMMAN.',
    ar: 'فيلادلفيا، سنة 150 م. المدينة الرومانية اللي رح تصير قلب عمّان القديم.' },
  { speaker: '',
    text: 'IT TOOK ITS NAME FROM KING PTOLEMY II PHILADELPHUS, AND IT IS ONE OF THE TEN CITIES OF THE DECAPOLIS.',
    ar: 'أخذت اسمها من الملك بطليموس الثاني فيلادلفوس، وهي وحدة من المدن العشر، الديكابوليس.' },
  { speaker: '',
    text: 'A STREET OF COLUMNS RUNS BETWEEN WHAT IS NOW DOWNTOWN AND THE CITADEL, AND THE GREAT THEATRE SEATS SIX THOUSAND PEOPLE.',
    ar: 'شارع أعمدة بيمشي باللي بين البلد والقلعة، والمدرّج الكبير بيتّسع لستة آلاف واحد.' },
  { speaker: '',
    text: 'HIGH ON THE CITADEL HILL, THE CITY HONOURS HERCULES WITH A TEMPLE.',
    ar: 'وفوق على جبل القلعة، المدينة بتكرّم هرقل بمعبد.' },
  { speaker: 'SAQER', text: 'WHERE AM I? AND HOW DO I GET BACK HOME?', ar: 'وين أنا؟ وكيف بدّي أرجع عالبيت؟' },
  { speaker: '',
    text: 'THE OLD CITY IS A LITTLE MAZE: A STREET, VAULTS BELOW IT, A TEMPLE IN THE SKY. LOOK CAREFULLY.',
    ar: 'المدينة القديمة متاهة صغيرة: شارع، وأقبية تحته، ومعبد بالسما. دوّر منيح.' },
];
