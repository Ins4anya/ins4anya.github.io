/**
 * ══════════════════════════════════════════════════════════════════
 * SPIKE CHUNSOFT WAIFU SORTER — characters.js
 * 
 * Все данные о персонажах и играх хранятся здесь.
 * Чтобы добавить персонажа — просто скопируй блок и заполни поля.
 * Чтобы добавить новую игру — добавь запись в GAMES и персонажей в CHARACTERS.
 *
 * Структура персонажа:
 *   id:     string — уникальный slug (латиница, дефисы)
 *   name:   string — полное имя (отображается на карточке)
 *   game:   string — короткое название игры (для карточки)
 *   gameId: string — ID игры, должен совпадать с записью в GAMES
 *   img:    string — путь к картинке (локальный или URL)
 * ══════════════════════════════════════════════════════════════════
 */

const CHARACTERS = [
  // ── Danganronpa: Trigger Happy Havoc ──────────────────────
    {
    id: "makoto-naegi",
    name: "Makoto Naegi",
    game: "DR1",
    gameId: "dr1",
    img: "img/DR1/Makoto.webp"
  },
  {
    id: "sayaka-maizono",
    name: "Sayaka Maizono",
    game: "DR1",
    gameId: "dr1",
    img: "img/DR1/Sayaka.webp"
  },
  {
    id: "kyoko-kirigiri",
    name: "Kyoko Kirigiri",
    game: "DR1",
    gameId: "dr1",
    img: "img/DR1/Kyoko.webp"
  },
  {
    id: "leon-kuwata",
    name: "Leon Kuwata",
    game: "DR1",
    gameId: "dr1",
    img: "img/DR1/Leon.webp"
  },
  {
    id: "mondo-owada",
    name: "Mondo Owada",
    game: "DR1",
    gameId: "dr1",
    img: "img/DR1/Mondo.webp"
  },
  {
    id: "mukuro-ikusaba",
    name: "Mukuro Ikusaba",
    game: "DR1",
    gameId: "dr1",
    img: "img/DR1/Mukuro.webp"
  },
  {
    id: "aoi-asahina",
    name: "Aoi Asahina",
    game: "DR1",
    gameId: "dr1",
    img: "img/DR1/Aoi.webp"
  },
  {
    id: "byakuya-togami",
    name: "Byakuya Togami",
    game: "DR1",
    gameId: "dr1",
    img: "img/DR1/Byakuya.webp"
  },
  {
    id: "sakura-ogami",
    name: "Sakura Ogami",
    game: "DR1",
    gameId: "dr1",
    img: "img/DR1/Sakura.webp"
  },
  {
    id: "celestia-ludenberg",
    name: "Celestia Ludenberg",
    game: "DR1",
    gameId: "dr1",
    img: "img/DR1/Celestia.webp"
  },
  {
    id: "toko-fukawa",
    name: "Toko Fukawa",
    game: "DR1",
    gameId: "dr1",
    img: "img/DR1/Toko.webp"
  },
  {
    id: "chihiro-fujisaki",
    name: "Chihiro Fujisaki",
    game: "DR1",
    gameId: "dr1",
    img: "img/DR1/Chihiro.webp"
  },
  {
    id: "hifumi-yamada",
    name: "Hifumi Yamada",
    game: "DR1",
    gameId: "dr1",
    img: "img/DR1/Hifumi.webp"
  },
  {
    id: "junko-enoshima",
    name: "Junko Enoshima",
    game: "DR1",
    gameId: "dr1",
    img: "img/DR1/Junko_1.webp"
  },
  {
    id: "kiyotaka-ishimaru",
    name: "Kiyotaka Ishimaru",
    game: "DR1",
    gameId: "dr1",
    img: "img/DR1/Kiyotaka.webp"
  },
  {
    id: "yasuhiro-hagakure",
    name: "Yasuhiro Hagakure",
    game: "DR1",
    gameId: "dr1",
    img: "img/DR1/Yasuhiro.webp"
  },

  // ── Danganronpa 2: Goodbye Despair ────────────────────────
  {
    id: "hadjime-hinata",
    name: "Hadjime Hinata",
    game: "DR2",
    gameId: "dr2",
    img: "img/DR2/Hadjime.webp"
  },
  {
    id: "akane-owari",
    name: "Akane Owari",
    game: "DR2",
    gameId: "dr2",
    img: "img/DR2/Akane.webp"
  },
  {
    id: "byakuya-impostor",
    name: "Byakuya Imposter",
    game: "DR2",
    gameId: "dr2",
    img: "img/DR2/Impostor.webp"
  },
  {
    id: "gundham-tanaka",
    name: "Gundham Tanaka",
    game: "DR2",
    gameId: "dr2",
    img: "img/DR2/Gundham.webp"
  },
  {
    id: "kazuichi-soda",
    name: "Kazuichi Soda",
    game: "DR2",
    gameId: "dr2",
    img: "img/DR2/Kazuichi.webp"
  },
  {
    id: "nagito-komaeda",
    name: "Nagito Komaeda",
    game: "DR2",
    gameId: "dr2",
    img: "img/DR2/Nagito.webp"
  },
  {
    id: "nekomaru-nidai",
    name: "Nekomaru Nidai",
    game: "DR2",
    gameId: "dr2",
    img: "img/DR2/Nekomaru.webp"
  },
  {
    id: "teruteru-hanamura",
    name: "Teruteru Hanamura",
    game: "DR2",
    gameId: "dr2",
    img: "img/DR2/Teruteru.webp"
  },
  {
    id: "fuyuhiko-kuzuryu",
    name: "Fuyuhiko Kuzuryu",
    game: "DR2",
    gameId: "dr2",
    img: "img/DR2/Fuyuhiko.webp"
  },
  {
    id: "chiaki-nanami",
    name: "Chiaki Nanami",
    game: "DR2",
    gameId: "dr2",
    img: "img/DR2/Chiaki.webp"
  },
  {
    id: "peko-pekoyama",
    name: "Peko Pekoyama",
    game: "DR2",
    gameId: "dr2",
    img: "img/DR2/Peko.webp"
  },
  {
    id: "ibuki-mioda",
    name: "Ibuki Mioda",
    game: "DR2",
    gameId: "dr2",
    img: "img/DR2/Ibuki.webp"
  },
  {
    id: "mikan-tsumiki",
    name: "Mikan Tsumiki",
    game: "DR2",
    gameId: "dr2",
    img: "img/DR2/Mikan.webp"
  },
  {
    id: "sonia-nevermind",
    name: "Sonia Nevermind",
    game: "DR2",
    gameId: "dr2",
    img: "img/DR2/Sonia.webp"
  },
  {
    id: "mahiru-koizumi",
    name: "Mahiru Koizumi",
    game: "DR2",
    gameId: "dr2",
    img: "img/DR2/Mahiru.webp"
  },
  {
    id: "hiyoko-saionji",
    name: "Hiyoko Saionji",
    game: "DR2",
    gameId: "dr2",
    img: "img/DR2/Hiyoko.webp"
  },

  // ── Danganronpa V3: Killing Harmony ───────────────────────
  {
    id: "kaede-akamatsu",
    name: "Kaede Akamatsu",
    game: "DRV3",
    gameId: "drv3",
    img: "img/DRv3/Kaede.webp"
  },
  {
    id: "gonta-gokuhara",
    name: "Gonta Gokuhara",
    game: "DRV3",
    gameId: "drv3",
    img: "img/DRv3/Gonta.webp"
  },
  {
    id: "keebo-k1bo",
    name: "K1BO (Keebo)",
    game: "DRV3",
    gameId: "drv3",
    img: "img/DRv3/Keebo.webp"
  },
  {
    id: "kaito-momota",
    name: "Kaito Momota",
    game: "DRV3",
    gameId: "drv3",
    img: "img/DRv3/Kaito.webp"
  },
  {
    id: "kiyo-shinguji",
    name: "Korekiyo Shinguji",
    game: "DRV3",
    gameId: "drv3",
    img: "img/DRv3/Kiyo.webp"
  },
  {
    id: "maki-harukawa",
    name: "Maki Harukawa",
    game: "DRV3",
    gameId: "drv3",
    img: "img/DRv3/Maki.webp"
  },
  {
    id: "rantaro-amami",
    name: "Rantaro Amami",
    game: "DRV3",
    gameId: "drv3",
    img: "img/DRv3/Rantaro.webp"
  },
  {
    id: "ryoma-hoshi",
    name: "Ryoma Hoshi",
    game: "DRV3",
    gameId: "drv3",
    img: "img/DRv3/Ryoma.webp"
  },
  {
    id: "tsumugi-shirogane",
    name: "Tsumugi Shirogane",
    game: "DRV3",
    gameId: "drv3",
    img: "img/DRv3/Tsumugi.webp"
  },
  {
    id: "shuichi-saihara",
    name: "Shuichi Saihara",
    game: "DRV3",
    gameId: "drv3",
    img: "img/DRv3/Shuichi.webp"
  },
  {
    id: "miu-iruma",
    name: "Miu Iruma",
    game: "DRV3",
    gameId: "drv3",
    img: "img/DRv3/Miu.webp"
  },
  {
    id: "kirumi-tojo",
    name: "Kirumi Tojo",
    game: "DRV3",
    gameId: "drv3",
    img: "img/DRv3/Kirumi.webp"
  },
  {
    id: "angie-yonaga",
    name: "Angie Yonaga",
    game: "DRV3",
    gameId: "drv3",
    img: "img/DRv3/Angie.webp"
  },
  {
    id: "himiko-yumeno",
    name: "Himiko Yumeno",
    game: "DRV3",
    gameId: "drv3",
    img: "img/DRv3/Himiko.webp"
  },
  {
    id: "tenko-chabashira",
    name: "Tenko Chabashira",
    game: "DRV3",
    gameId: "drv3",
    img: "img/DRv3/Tenko.webp"
  },
  {
    id: "kokichi-oma",
    name: "Kokichi Oma",
    game: "DRV3",
    gameId: "drv3",
    img: "img/DRv3/Kokichi.webp"
  },

  // ── Master Detective Archives: RAIN CODE ──────────────────
  {
    id: "yuma-kokohead",
    name: "Yuma Kokohead",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Yuma.png"
  },
  {
    id: "shinigami",
    name: "Shinigami",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Shinigami.png"
  },
  {
    id: "aphex-logan",
    name: "Aphex Logan",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Aphex.jpg"
  },
  {
    id: "pucchi-lavmin",
    name: "Pucchi Lavmin",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Pucchi.jpg"
  },
  {
    id: "zilch-alexander",
    name: "Zilch Alexander",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Zilch.jpg"
  },
  {
    id: "melami-goldmine",
    name: "Melami Goldmine",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Melami.jpg"
  },
  {
    id: "zange-eraser",
    name: "Zange Eraser",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Zange.jpg"
  },
  {
    id: "halara-nightmare",
    name: "Halara Nightmare",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Halara.jpg"
  },
  {
    id: "desuhiko-thunderbolt",
    name: "Desuhiko Thunderbolt",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Desuhiko.jpg"
  },
  {
    id: "yakou-furio",
    name: "Yakou Furio",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Yakou.png"
  },
  {
    id: "fubuki-clockford",
    name: "Fubuki Clockford",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Fubuki.jpg"
  },
  {
    id: "vivia-twilight",
    name: "Vivia Twilight",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Vivia.jpg"
  },
  {
    id: "makoto-kagutsuchi",
    name: "Makoto Kagutsuchi",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Makoto.png"
  },
  {
    id: "yomi-hellsmile",
    name: "Yomi Hellsmile",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Yomi.png"
  },
  {
    id: "martina-electro",
    name: "Martina Electro",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Martina.png"
  },
  {
    id: "swank-catsonell",
    name: "Swank Catsonell",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Swank.png"
  },
  {
    id: "seth-burroughs",
    name: "Seth Burroughs",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Seth.png"
  },
  {
    id: "guillaume-hall",
    name: "Guillaume Hall",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Guillaume.png"
  },
  {
    id: "dominic-fulltank",
    name: "Dominic Fulltank",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Dominic.png"
  },
  {
    id: "dr-huesca",
    name: "Dr. Huesca",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Huesca.png"
  },
  {
    id: "nun-rc",
    name: "Nun (from Church)",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Nun.png"
  },
  {
    id: "servant-rc",
    name: "Servant",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Servant.png"
  },
  {
    id: "priest-rc",
    name: "Priest",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Priest.png"
  },
  {
    id: "worshipper-rc",
    name: "Worshipper",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Worshipper.png"
  },
  {
    id: "kurumi-wendy",
    name: "Kurumi Wendy",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Kurumi.png"
  },
  {
    id: "karen-rc",
    name: "Karen",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Karen.png"
  },
  {
    id: "aiko-rc",
    name: "Aiko",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Aiko.png"
  },
  {
    id: "waruna-rc",
    name: "Waruna",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Waruna.png"
  },
  {
    id: "yoshiko-rc",
    name: "Yoshiko",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Yoshiko.png"
  },
  {
    id: "kurane-rc",
    name: "Kurane",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Kurane.png"
  },
  {
    id: "hana-rc",
    name: "Hana",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Hana.png"
  },
  {
    id: "shachi-rc",
    name: "Shachi",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Shachi.png"
  },
  {
    id: "icardi-rc",
    name: "Icardi",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Icardi.png"
  },
  {
    id: "servan-rc",
    name: "Servan",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Servan.png"
  },
  {
    id: "margulaw-rc",
    name: "Margulaw",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Margulaw.png"
  },
  {
    id: "iruka-rc",
    name: "Iruka",
    game: "Rain Code",
    gameId: "raincode",
    img: "img/MDA_RC/Iruka.png"
  },

  // ── AI: The Somnium Files ──────────────────────────────────
  {
    id: "kaname-date",
    name: "Kaname Date",
    game: "AI: Somnium",
    gameId: "aisomnium",
    img: "img/AI_S/Kaname.webp"
  },
  {
    id: "pewter",
    name: "Pewter",
    game: "AI: Somnium",
    gameId: "aisomnium",
    img: "img/AI_S/Pewter.webp"
  },
  {
    id: "ota-matsushita",
    name: "Ota Matsushita",
    game: "AI: Somnium",
    gameId: "aisomnium",
    img: "img/AI_S/Ota.webp"
  },
  {
    id: "aiba",
    name: "Aiba",
    game: "AI: Somnium",
    gameId: "aisomnium",
    img: "img/AI_S/Aiba.webp"
  },
  {
    id: "mizuki-okiura",
    name: "Mizuki Okiura",
    game: "AI: Somnium",
    gameId: "aisomnium",
    img: "img/AI_S/Mizuki.webp"
  },
  {
    id: "moma-kumakura",
    name: "Moma Kumakura",
    game: "AI: Somnium",
    gameId: "aisomnium",
    img: "img/AI_S/Moma.webp"
  },
  {
    id: "iris-sagan",
    name: "Iris Sagan (A-Set)",
    game: "AI: Somnium",
    gameId: "aisomnium",
    img: "img/AI_S/Iris.webp"
  },
  {
    id: "boss-ais",
    name: "Boss",
    game: "AI: Somnium",
    gameId: "aisomnium",
    img: "img/AI_S/Boss.webp"
  },
  {
    id: "hitomi-sagan",
    name: "Hitomi Sagan",
    game: "AI: Somnium",
    gameId: "aisomnium",
    img: "img/AI_S/Hitomi.webp"
  },
  {
    id: "nadami-shoko",
    name: "Nadami Shoko",
    game: "AI: Somnium",
    gameId: "aisomnium",
    img: "img/AI_S/Nadami.webp"
  },
  {
    id: "mama-ais",
    name: "Mama",
    game: "AI: Somnium",
    gameId: "aisomnium",
    img: "img/AI_S/Mama.webp"
  },
  {
    id: "mayumi-matsushita",
    name: "Mayumi Matsushita",
    game: "AI: Somnium",
    gameId: "aisomnium",
    img: "img/AI_S/Mayumi.webp"
  },
  {
    id: "so-sejima",
    name: "So Sejima",
    game: "AI: Somnium",
    gameId: "aisomnium",
    img: "img/AI_S/So.webp"
  },
  {
    id: "ritsuko-enshu",
    name: "Ritsuko Enshu",
    game: "AI: Somnium",
    gameId: "aisomnium",
    img: "img/AI_S/Ritsuko.webp"
  },
  {
    id: "hanayo-nasu",
    name: "Hanayo Nasu",
    game: "AI: Somnium",
    gameId: "aisomnium",
    img: "img/AI_S/Hanayo.webp"
  },
  {
    id: "araya-kagami",
    name: "Hmm.. what's his name?",
    game: "AI: Somnium",
    gameId: "aisomnium",
    img: "img/AI_S/Araya.webp"
  },

  // ── AI: The Somnium Files – nirvanA Initiative ─────────────
  {
    id: "kuruto-ryuki",
    name: "Kuruto Ryuki",
    game: "AI: nirvanA",
    gameId: "ainirv",
    img: "img/AI_NI/Kuruto.webp"
  },
  {
    id: "mizuki-date",
    name: "Mizuki Date",
    game: "AI: nirvanA",
    gameId: "ainirv",
    img: "img/AI_NI/Mizuki.webp"
  },
  {
    id: "tama",
    name: "Tama",
    game: "AI: nirvanA",
    gameId: "ainirv",
    img: "img/AI_NI/Tama.webp"
  },
  {
    id: "masked-woman",
    name: "Masked Woman",
    game: "AI: nirvanA",
    gameId: "ainirv",
    img: "img/AI_NI/Masked.webp"
  },
  {
    id: "amame-doi",
    name: "Amame Doi",
    game: "AI: nirvanA",
    gameId: "ainirv",
    img: "img/AI_NI/Amame.webp"
  },
  {
    id: "andes-komeji",
    name: "Andes Komeji",
    game: "AI: nirvanA",
    gameId: "ainirv",
    img: "img/AI_NI/Andes.webp"
  },
  {
    id: "kizuna-chieda",
    name: "Kizuna Chieda",
    game: "AI: nirvanA",
    gameId: "ainirv",
    img: "img/AI_NI/Kizuna.webp"
  },
  {
    id: "lien-twining",
    name: "Lien Twining",
    game: "AI: nirvanA",
    gameId: "ainirv",
    img: "img/AI_NI/Lien.webp"
  },
  {
    id: "tokiko-shigure",
    name: "Tokiko Shigure",
    game: "AI: nirvanA",
    gameId: "ainirv",
    img: "img/AI_NI/Tokiko.webp"
  },
  {
    id: "shoma-enda",
    name: "Shoma Enda",
    game: "AI: nirvanA",
    gameId: "ainirv",
    img: "img/AI_NI/Shoma.webp"
  },
  {
    id: "chikara-horadori",
    name: "Chikara Horadori",
    game: "AI: nirvanA",
    gameId: "ainirv",
    img: "img/AI_NI/Chikara.webp"
  },
  {
    id: "gen-ishiyagane",
    name: "Gen Ishiyagane",
    game: "AI: nirvanA",
    gameId: "ainirv",
    img: "img/AI_NI/Gen.webp"
  },
  {
    id: "chinpei-wagai",
    name: "Chinpei Wagai",
    game: "AI: nirvanA",
    gameId: "ainirv",
    img: "img/AI_NI/Chinpei.webp"
  },
  {
    id: "mikoto-ushidera",
    name: "Mikoto Ushidera",
    game: "AI: nirvanA",
    gameId: "ainirv",
    img: "img/AI_NI/Mikoto.webp"
  },
];

// Метаданные игр для фильтров
const GAMES = [
  { id: "dr1",       label: "Danganronpa 1",   short: "DR1"        },
  { id: "dr2",       label: "Danganronpa 2",   short: "DR2"        },
  { id: "drv3",      label: "Danganronpa V3",  short: "DRV3"       },
  { id: "raincode",  label: "Rain Code",       short: "Rain Code"  },
  { id: "aisomnium", label: "AI: Somnium Files",short: "AI: SF"   },
  { id: "ainirv",    label: "AI: nirvanA Init.","short": "AI: NI"  },
];
