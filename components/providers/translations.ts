export type Locale = "en" | "mn";

const en = {
  common: {
    language: "Language",
  },
  home: {
    nav: {
      tracks: "Tracks",
      aiMarking: "AI Marking",
      features: "Features",
      resources: "Resources",
      login: "Log in",
      startFree: "Start free",
    },
    hero: {
      badge: "IGCSE · A Levels · AP · SAT · IELTS · HSK",
      title: "Exam practice, organized the way you'll actually use it.",
      subtitle:
        "Notes, topical questions, and a past papers library sorted by subject, year and session — built for students studying online, at their own pace.",
      cta: "Create free account",
      loginPrompt: "Already have an account?",
      loginLink: "Log in",
    },
    facts: {
      subjects: "Subjects covered",
      pastPapers: "Past paper sessions",
      free: "Free to start",
    },
    personas: {
      student: { title: "I'm a student", desc: "Sign up to start practicing" },
      tutor: { title: "I'm a tutor", desc: "Post notes and manage your profile" },
    },
    aiMarking: {
      badge: "AI-Powered",
      title: "AI Marking: write your answer, get graded in seconds.",
      desc: "Answer real free-response questions and get instant, AI-checked feedback against the official mark scheme — no waiting around for a tutor to grade it.",
      point1: "Instant scoring against real mark schemes",
      point2: "Works for every subject, every FRQ",
      point3: "See exactly where you lost marks",
      cta: "Try AI Marking free",
      mockQuestion: "Explain how enzymes lower activation energy.",
      mockScored: "Scored by AI",
      mockScore: "8 / 10",
      mockFeedback: "Great structure — mention the induced-fit model for full marks.",
    },
    featuresHeading: {
      badge: "More than practice questions",
      subtitle: "Everything a student needs, in one account.",
    },
    features: {
      pastPapers: { title: "Past Papers", desc: "Every subject, sorted by year and exam session." },
      tutors: { title: "Find a Tutor", desc: "Browse real tutors by subject, price and availability." },
      leaderboard: { title: "Leaderboard", desc: "Earn points and streaks as you study, and see how you rank." },
      blog: { title: "Blog", desc: "Study tips and exam strategy posted by our tutors." },
    },
    tracksHeading: "Built for the syllabi you sit",
    resourcesHeading: {
      badge: "What you get",
      subtitle: "Everything focused on learn → practice → ace it.",
    },
    resources: {
      notes: { badge: "Bite-sized", title: "Smart notes", desc: "High-yield summaries with diagrams, mnemonics, and exam hints." },
      practice: {
        badge: "Exam-style",
        title: "Practice bank",
        desc: "Timed questions by topic with instant mark schemes, mirroring real papers.",
      },
      flashcards: {
        badge: "Memory-proof",
        title: "Flashcards + streaks",
        desc: "Daily decks with streaks and adaptive spacing that lock facts in for good.",
      },
    },
    ctaSection: {
      eyebrow: "Ready?",
      title: "Join Examly and get exam-ready.",
      desc: "Modern and stress-free. Start free and keep your streak going.",
      createAccount: "Create account",
      login: "Log in",
    },
  },
  sidebar: {
    sections: {
      admin: "Admin",
      student: "Student",
      teacher: "Teacher",
    },
    items: {
      dashboard: "Dashboard",
      notes: "Notes",
      flashcards: "Flashcards",
      quizMcq: "Quiz MCQ",
      quizFrq: "Quiz FRQ",
      chapters: "Chapters",
      practice: "Practice",
      mockExams: "Mock Exams",
      pastPapers: "Past Papers",
      leaderboard: "Leaderboard",
      achievements: "Achievements",
      findTutor: "Find a Tutor",
      blog: "Blog",
      lessons: "Lessons",
      tutorProfile: "Tutor Profile",
      myBlog: "My Blog",
    },
  },
  topnav: {
    dashboard: "Dashboard",
    loggedIn: "Logged in",
    signOut: "Sign out",
  },
};

const mn: typeof en = {
  common: {
    language: "Хэл",
  },
  home: {
    nav: {
      tracks: "Хөтөлбөрүүд",
      aiMarking: "AI Шалгалт",
      features: "Онцлогууд",
      resources: "Нөөц",
      login: "Нэвтрэх",
      startFree: "Үнэгүй эхлэх",
    },
    hero: {
      badge: "IGCSE · A Levels · AP · SAT · IELTS · HSK",
      title: "Шалгалтын дадлага, таны хэрэгцээг үнэхээр зохион байгуулав.",
      subtitle:
        "Онлайнаар өөрийн хурдаараа суралцаж буй сурагчдад зориулсан тэмдэглэл, сэдэвчилсэн дасгал, жил, ба улиралаар эрэмбэгдсэн өмнөх шалгалтын сан.",
      cta: "Үнэгүй бүртгүүлэх",
      loginPrompt: "Бүртгэлтэй хэрэглэгч үү?",
      loginLink: "Нэвтрэх",
    },
    facts: {
      subjects: "Хамрагдсан хичээл",
      pastPapers: "Өмнөх шалгалтын жилүүд",
      free: "Үнэгүй эхлэх",
    },
    personas: {
      student: { title: "Би сурагч", desc: "Дадлага хийж эхлэхийн тулд бүртгүүлээрэй" },
      tutor: { title: "Би багш", desc: "Тэмдэглэл нийтэлж, профайлаа удирдаарай" },
    },
    aiMarking: {
      badge: "Хиймэл оюун ухаантай",
      title: "AI Шалгалт: бич, илгээ, секундын дотор үнэлгээ ав.",
      desc: "Жинхэнэ чөлөөт хариулттай асуултад хариулж, албан ёсны дүгнэх шалгуураар (mark scheme) хиймэл оюун ухаанаас шууд санал хүсэлт аваарай — багш дүгнэх хүртэл хүлээх шаардлагагүй.",
      point1: "Жинхэнэ дүгнэх шалгуураар шууд оноо авах",
      point2: "Бүх хичээл, бүх чөлөөт хариултын асуултад ажиллана",
      point3: "Хаана оноо алдсанаа тодорхой харах",
      cta: "AI Шалгалтыг үнэгүй туршиж үзэх",
      mockQuestion: "Ферментүүд идэвхжлийн энергийг хэрхэн бууруулдгийг тайлбарла.",
      mockScored: "AI дүгнэсэн",
      mockScore: "8 / 10",
      mockFeedback: "Бүтэц сайн байна — бүрэн оноо авахын тулд “induced-fit” загварыг дурдаарай.",
    },
    featuresHeading: {
      badge: "Дасгалын асуултаас илүү",
      subtitle: "Сурагчдад хэрэгтэй бүх зүйл нэг бүртгэлд.",
    },
    features: {
      pastPapers: { title: "Өмнөх шалгалтууд", desc: "Бүх хичээл, жил, шалгалтын улиралаар эрэмбэгдэгдсэн." },
      tutors: { title: "Багш олох", desc: "Хичээл, үнэ, боломжтой цагаар жинхэнэ багш нараас хайж олоорой." },
      leaderboard: { title: "Тэргүүлэгчдийн жагсаалт", desc: "Суралцах явцдаа оноо, дараалал цуглуулж, байраа хараарай." },
      blog: { title: "Блог", desc: "Багш нарын нийтэлсэн суралцах зөвлөмгөө, шалгалтын стратеги." },
    },
    tracksHeading: "Таны суралцаж буй хөтөлбөрүүдэд зориулав",
    resourcesHeading: {
      badge: "Юу авах вэ",
      subtitle: "Сурах → дадлагажих → давах гэсэн бүхэлд төвлөрсөн.",
    },
    resources: {
      notes: {
        badge: "Товч бөгөөд ойлгомжтой",
        title: "Ухаалаг тэмдэглэл",
        desc: "Диаграм, тогтоох арга, шалгалтын зөвлөмж бүхий өндөр үр дүнтэй хураангуй.",
      },
      practice: {
        badge: "Шалгалтын хэв маягтай",
        title: "Дасгалын сан",
        desc: "Сэдэв бүрээр цаг хугацаатай асуулт, шууд дүгнэх шалгуурын хамт, жинхэнэ шалгалтыг санагуулна.",
      },
      flashcards: {
        badge: "Санах ойд бат",
        title: "Флэшкарт + дараалал",
        desc: "Өдөр тутмын багц, дараалал, зохицуулагдсан давталгаагаар мэдлэлээ бат бат болгоно.",
      },
    },
    ctaSection: {
      eyebrow: "Бэлэн үү?",
      title: "Examly-д нэгдэж, шалгалтад бэлэн бол.",
      desc: "Орчин үеийн бөгөөд стрессгүй. Үнэгүй эхэлж, дараалаа тасалдуулгүй үргэлжлүүл.",
      createAccount: "Бүртгэл үүсгэх",
      login: "Нэвтрэх",
    },
  },
  sidebar: {
    sections: {
      admin: "Админ",
      student: "Сурагч",
      teacher: "Багш",
    },
    items: {
      dashboard: "Хяналтын самбар",
      notes: "Тэмдэглэл",
      flashcards: "Флэшкарт",
      quizMcq: "Сорил (MCQ)",
      quizFrq: "Сорил (Чөлөөт хариулт)",
      chapters: "Бүлүгүүд",
      practice: "Дадлага",
      mockExams: "Дадлага шалгалт",
      pastPapers: "Өмнөх шалгалтууд",
      leaderboard: "Тэргүүлэгчид",
      achievements: "Амжилтууд",
      findTutor: "Багш олох",
      blog: "Блог",
      lessons: "Хичээлүүд",
      tutorProfile: "Багшийн профайл",
      myBlog: "Миний блог",
    },
  },
  topnav: {
    dashboard: "Хяналтын самбар",
    loggedIn: "Нэвтэрсэн",
    signOut: "Гарах",
  },
};

export const dictionaries: Record<Locale, typeof en> = { en, mn };
export type Dictionary = typeof en;
