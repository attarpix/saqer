VOICE-OVER
==========
Put your recordings in this folder (mp3, ogg or wav), for example:

  assets/vo/intro-01-narrator.mp3
  assets/vo/intro-02-saqer.mp3
  assets/vo/intro-03-dana.mp3

Then open js/story.js and add the file to the line it belongs to:

  { speaker: 'DANA', text: 'GET MY MAHR ...', ar: '...', vo: 'assets/vo/intro-03-dana.mp3' },

One recording per line of dialogue. The game plays one at a time:
going to the next line stops the one before, so Saqer and Dana never
talk over each other. Lines without a recording just show the text.
