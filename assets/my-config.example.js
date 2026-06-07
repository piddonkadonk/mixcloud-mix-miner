// Example real-world CONFIG for mixcloud_playlist_builder.user.js
// Copy the three blocks below into the userscript's CONFIG section to replace the
// neutral starter lists. This is a full working example (open-format / re-edit taste).

const FOLLOWS = [
  "djmatman","paulofutura","obliveus","SpecialEd","dj-gehoervoyeur","lebrosk",
  "francoponticelli","djwonder","swedishshef","djztrip","djmrlob","MrLob",
  "Jorun_Bombay","djlittlefever","gilbertlefunk","SoulCoolRecords","TomShowtime",
  "cockneynutjob","djmaars","djjazzyjeff","mickboogie90","djpaulmaster",
  "Jasondjwhutrivera","santero","djmakala","fajitafunk","djajamu","therub",
  "DJ_Clairvo","Radio_RapTz","TheFourtyFiveKings","funkafied","leehardwickartsound",
  "timewarpmusic","Frenzie"
];

const PLAYLISTS = {
  "Re-Edit Mayhem": [
    "https://www.mixcloud.com/djmatman/throwback-kingz-90s-rnb-the-og-remixes/",
    "https://www.mixcloud.com/paulofutura/futuramix-09/",
    "https://www.mixcloud.com/SpecialEd/dj-special-eds-classsic-rock-mashup-mixtape/",
    "https://www.mixcloud.com/dj-gehoervoyeur/geh%C3%B6rvoyeur-mix-no-200-selection-of-my-style-series/",
    "https://www.mixcloud.com/lebrosk/the-funk-sessions-on-ramp-fm-sept-2009-guestmix-by-the-basement-freaks/",
    "https://www.mixcloud.com/francoponticelli/funky-cakes-203-w-dj-fsoul/",
    "https://www.mixcloud.com/djwonder/dj-wonder-live-from-a-roosevelt-jawn/"
  ],
  "Reggae + Global Re-Edits": [
    "https://www.mixcloud.com/djmatman/the-hotline-mix/",
    "https://www.mixcloud.com/paulofutura/jazzin/",
    "https://www.mixcloud.com/obliveus/obs-juke-joints-45s-mixtape-jan-2024/",
    "https://www.mixcloud.com/SpecialEd/dj-special-eds-sand-in-my-boots-tropical-house-country-mashup-mix/",
    "https://www.mixcloud.com/dj-gehoervoyeur/geh%C3%B6rvoyeur-summer-vibes-groove-afro-latin-house-mix/",
    "https://www.mixcloud.com/francoponticelli/funky-cakes-200-w-dj-fsoul-afrobeat-special-part-1/"
  ],
  "Genre-Collision Party": [
    "https://www.mixcloud.com/djmatman/freshly-baked-004-future-hip-hop-rnb-beats-whatever-mixed-by-djmatman/",
    "https://www.mixcloud.com/paulofutura/samba-rock-soul-funk/",
    "https://www.mixcloud.com/obliveus/obs-90s-house-45s-mix-feb-2026/",
    "https://www.mixcloud.com/dj-gehoervoyeur/geh%C3%B6rvoyeur-meine-auslese-sp%C3%A4tsommer-2021/",
    "https://www.mixcloud.com/lebrosk/the-funk-sessions-on-ramp-fm-april-2011-guestmixes-by-marc-hype-the-gemini-bros/",
    "https://www.mixcloud.com/djlittlefever/7-new-bruno-mars-dj-edits-debut-live-afro-house-ghetto-funk-dnb-baltimore-club-mix/"
  ],
  "Workout Bangers": [
    "https://www.mixcloud.com/SpecialEd/dj-special-eds-70s-2010s-pop-rocks-mixtape-vol-2/",
    "https://www.mixcloud.com/SpecialEd/dj-special-eds-yacht-rocked-workout-mashup-mix/",
    "https://www.mixcloud.com/SpecialEd/dj-special-eds-2021-this-is-what-you-came-for-workout-mashup-mix/",
    "https://www.mixcloud.com/SpecialEd/dj-special-eds-indepen-dance-day-mashup-workout-mix/",
    "https://www.mixcloud.com/djlittlefever/funklectic-294-uk-garage-heat-bassline-pressure-high-energy-vibes/",
    "https://www.mixcloud.com/SpecialEd/dj-special-eds-i-feel-good-mashup-workout-mixtape/"
  ],
  "Marathon Flow": [
    "https://www.mixcloud.com/paulofutura/young-holt-unlimited/",
    "https://www.mixcloud.com/paulofutura/fut-massage-10/",
    "https://www.mixcloud.com/lebrosk/the-funk-sessions-on-ramp-fm-april-2011-guestmixes-by-marc-hype-the-gemini-bros/",
    "https://www.mixcloud.com/djwonder/dj-wonder-vs-dj-ka5-live-from-blackbird-ordinary/",
    "https://www.mixcloud.com/MrLob/the-classic-sunshine-sounds-of-brazil-recorded-live-at-afloat-melbourne/",
    "https://www.mixcloud.com/djlittlefever/the-brig-funk-n-shtuff-april-4th-2026/"
  ]
};

const ARTIST_PLAYLISTS = [
  { name: "Paulo Futura - Best Of", user: "paulofutura", count: 8, minMinutes: 60 },
  { name: "DJ Matman - Best Of", user: "djmatman", count: 8, minMinutes: 45 },
  { name: "DJ Special Ed - Best Of", user: "SpecialEd", count: 8, minMinutes: 45 },
  { name: "OBLIVEUS - Best Of", user: "obliveus", count: 8, minMinutes: 45 },
  { name: "Lebrosk - Best Of", user: "lebrosk", count: 8, minMinutes: 45 },
  { name: "Gehörvoyeur - Best Of", user: "dj-gehoervoyeur", count: 8, minMinutes: 45 },
  { name: "DJ F@SOUL - Best Of", user: "francoponticelli", count: 8, minMinutes: 45 },
  { name: "DJ Wonder - Best Of", user: "djwonder", count: 6, minMinutes: 45 },
  { name: "Mr Lob - Best Of", user: "MrLob", count: 8, minMinutes: 45 },
  { name: "DJ Little Fever - Best Of", user: "djlittlefever", count: 8, minMinutes: 45 }
];
