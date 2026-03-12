import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

const kSupabaseUrl = String.fromEnvironment(
  'SUPABASE_URL',
  defaultValue: 'https://your-project.supabase.co',
);
const kSupabaseAnonKey = String.fromEnvironment(
  'SUPABASE_ANON_KEY',
  defaultValue: 'your-anon-key',
);
const kSupabaseRedirectUri = String.fromEnvironment(
  'SUPABASE_REDIRECT_URI',
  defaultValue: 'flexmobile://login-callback',
); // also add to Supabase OAuth redirect URLs
const kDeepLinkScheme = 'flexmobile'; // used for mobile deep links

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: kSupabaseUrl,
    anonKey: kSupabaseAnonKey,
    authOptions: const AuthClientOptions(
      authFlowType: AuthFlowType.pkce,
    ),
    deepLinkScheme: kDeepLinkScheme,
  );

  runApp(
    ChangeNotifierProvider(
      create: (_) => AppState(),
      child: const FlexMobileApp(),
    ),
  );
}

class AppState extends ChangeNotifier {
  AppState() {
    _listenAuth();
  }

  final supabase = Supabase.instance.client;
  Session? session;
  bool isReady = false;
  bool showWalkthrough = true;
  String userName = 'Student';
  String examBoard = 'Cambridge IGCSE';

  final List<String> boards = [
    'Cambridge IGCSE',
    'Edexcel IGCSE',
    'AS / A Levels',
    'AP',
    'SAT',
    'IELTS',
    'HSK',
  ];

  final Map<String, List<String>> subjects = {
    'Cambridge IGCSE': ['Maths', 'Physics', 'Chemistry', 'Biology'],
    'AS / A Levels': ['Maths', 'Physics', 'Chemistry', 'Economics'],
    'AP': ['Calculus AB', 'Physics 1', 'Chemistry', 'Biology'],
    'SAT': ['Math', 'Reading', 'Writing'],
    'IELTS': ['Reading', 'Listening', 'Writing', 'Speaking'],
    'HSK': ['HSK 3', 'HSK 4', 'HSK 5', 'HSK 6'],
  };

  StreamSubscription<AuthState>? _authSub;

  void _listenAuth() async {
    final current = await supabase.auth.getSession();
    session = current.data?.session;
    isReady = true;
    notifyListeners();

    _authSub = supabase.auth.onAuthStateChange.listen((data) {
      session = data.session;
      isReady = true;
      notifyListeners();
    });
  }

  @override
  void dispose() {
    _authSub?.cancel();
    super.dispose();
  }

  void completeWalkthrough() {
    showWalkthrough = false;
    notifyListeners();
  }

  Future<void> signIn(String email, String password) async {
    final res = await supabase.auth.signInWithPassword(email: email, password: password);
    session = res.session;
    userName = email.split('@').first;
    notifyListeners();
  }

  Future<void> signUp(String email, String password, String name) async {
    final res = await supabase.auth.signUp(
      email: email,
      password: password,
      data: {'full_name': name},
      emailRedirectTo: kSupabaseRedirectUri,
    );
    session = res.session;
    userName = name.isNotEmpty ? name : email.split('@').first;
    notifyListeners();
  }

  Future<void> signInWithGoogle() async {
    await supabase.auth.signInWithOAuth(
      Provider.google,
      redirectTo: kSupabaseRedirectUri,
      authScreenLaunchMode: LaunchMode.externalApplication,
    );
  }

  Future<void> signOut() async {
    await supabase.auth.signOut();
    session = null;
    notifyListeners();
  }

  void setExamBoard(String board) {
    examBoard = board;
    notifyListeners();
  }

  Future<List<Map<String, dynamic>>> fetchTable(String table) async {
    final res = await supabase.from(table).select().limit(20);
    return (res as List<dynamic>).cast<Map<String, dynamic>>();
  }
}

class FlexMobileApp extends StatelessWidget {
  const FlexMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, state, _) {
        if (!state.isReady) {
          return const MaterialApp(
            home: Scaffold(body: Center(child: CircularProgressIndicator())),
          );
        }
        final home = state.showWalkthrough
            ? const WalkthroughScreen()
            : (state.session != null ? const HomeShell() : const AuthScreen());
        return MaterialApp(
          title: 'Flex Mobile',
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
            useMaterial3: true,
          ),
          home: home,
        );
      },
    );
  }
}

class WalkthroughScreen extends StatefulWidget {
  const WalkthroughScreen({super.key});

  @override
  State<WalkthroughScreen> createState() => _WalkthroughScreenState();
}

class _WalkthroughScreenState extends State<WalkthroughScreen> {
  final PageController _controller = PageController();
  int _page = 0;

  final List<_WalkthroughPage> pages = const [
    _WalkthroughPage(
      title: 'Study faster',
      body: 'Concise notes, flashcards, and quizzes for IGCSE, A Levels, AP, SAT, IELTS, and HSK.',
      icon: Icons.speed,
    ),
    _WalkthroughPage(
      title: 'Practice smart',
      body: 'Timed quizzes and past exams with instant feedback to find weak spots.',
      icon: Icons.check_circle,
    ),
    _WalkthroughPage(
      title: 'Stay organized',
      body: 'Track boards, subjects, and topics in one hub. Keep streaks alive.',
      icon: Icons.view_kanban,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final state = context.read<AppState>();
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => state.completeWalkthrough(),
                child: const Text('Skip'),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: pages.length,
                onPageChanged: (index) => setState(() => _page = index),
                itemBuilder: (context, index) {
                  final page = pages[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(page.icon, size: 80, color: Theme.of(context).colorScheme.primary),
                        const SizedBox(height: 24),
                        Text(page.title, style: Theme.of(context).textTheme.headlineSmall),
                        const SizedBox(height: 12),
                        Text(page.body, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyLarge),
                      ],
                    ),
                  );
                },
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                pages.length,
                (i) => Container(
                  margin: const EdgeInsets.all(6),
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: i == _page ? Theme.of(context).colorScheme.primary : Colors.grey.shade300,
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    if (_page == pages.length - 1) {
                      state.completeWalkthrough();
                    } else {
                      _controller.nextPage(duration: const Duration(milliseconds: 400), curve: Curves.easeOut);
                    }
                  },
                  child: Text(_page == pages.length - 1 ? 'Start learning' : 'Next'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WalkthroughPage {
  final String title;
  final String body;
  final IconData icon;
  const _WalkthroughPage({required this.title, required this.body, required this.icon});
}

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final TextEditingController _email = TextEditingController();
  final TextEditingController _password = TextEditingController();
  final TextEditingController _name = TextEditingController();
  bool _isRegister = false;
  bool _busy = false;
  String? _error;

  @override
  Widget build(BuildContext context) {
    final state = context.read<AppState>();
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 24),
              Text(_isRegister ? 'Create account' : 'Sign in', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 16),
              if (_isRegister)
                TextField(
                  controller: _name,
                  decoration: const InputDecoration(labelText: 'Name'),
                ),
              TextField(
                controller: _email,
                decoration: const InputDecoration(labelText: 'Email'),
                keyboardType: TextInputType.emailAddress,
              ),
              TextField(
                controller: _password,
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
              ),
              const SizedBox(height: 12),
              if (_error != null) Text(_error!, style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: _busy
                    ? null
                    : () async {
                        setState(() {
                          _busy = true;
                          _error = null;
                        });
                        try {
                          if (_isRegister) {
                            await state.signUp(_email.text.trim(), _password.text.trim(), _name.text.trim());
                          } else {
                            await state.signIn(_email.text.trim(), _password.text.trim());
                          }
                        } catch (e) {
                          setState(() => _error = e.toString());
                        } finally {
                          setState(() => _busy = false);
                        }
                      },
                child: Text(_isRegister ? 'Register & continue' : 'Sign in'),
              ),
              TextButton(
                onPressed: _busy
                    ? null
                    : () {
                        state.signInWithGoogle();
                      },
                child: const Text('Continue with Google'),
              ),
              TextButton(
                onPressed: () => setState(() => _isRegister = !_isRegister),
                child: Text(_isRegister ? 'Have an account? Sign in' : 'New here? Create account'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _tab = 0;
  final tabs = const [
    _NavTab(label: 'Home', icon: Icons.home),
    _NavTab(label: 'Notes', icon: Icons.note),
    _NavTab(label: 'Flashcards', icon: Icons.style),
    _NavTab(label: 'Quizzes', icon: Icons.quiz),
    _NavTab(label: 'Past exams', icon: Icons.archive),
  ];

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    final pages = [
      const HomeDashboard(),
      const NotesScreen(),
      const FlashcardsScreen(),
      const QuizScreen(),
      const PastExamsScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Flex Mobile'),
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) {
              state.setExamBoard(value);
            },
            itemBuilder: (context) => state.boards
                .map((b) => PopupMenuItem<String>(
                      value: b,
                      child: Text(b),
                    ))
                .toList(),
            child: Row(
              children: [
                Text(state.examBoard, style: const TextStyle(fontSize: 14)),
                const SizedBox(width: 4),
                const Icon(Icons.expand_more),
                const SizedBox(width: 12),
              ],
            ),
          ),
          IconButton(
            onPressed: () => state.signOut(),
            icon: const Icon(Icons.logout),
            tooltip: 'Sign out',
          ),
        ],
      ),
      body: pages[_tab],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: tabs
            .map(
              (t) => NavigationDestination(
                icon: Icon(t.icon),
                label: t.label,
              ),
            )
            .toList(),
      ),
    );
  }
}

class _NavTab {
  final String label;
  final IconData icon;
  const _NavTab({required this.label, required this.icon});
}

class HomeDashboard extends StatelessWidget {
  const HomeDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final subjects = state.subjects[state.examBoard] ?? ['General Studies', 'Maths'];
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Welcome, ${state.userName}', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 8),
        Text('Exam board: ${state.examBoard}', style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: 16),
        Text('Subjects', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: subjects
              .map(
                (s) => Chip(
                  label: Text(s),
                  backgroundColor: Colors.indigo.shade50,
                ),
              )
              .toList(),
        ),
        const SizedBox(height: 16),
        Text('Quick links', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        _QuickLinkGrid(
          items: const [
            QuickLink(label: 'Notes', icon: Icons.note),
            QuickLink(label: 'Flashcards', icon: Icons.style),
            QuickLink(label: 'Topic quizzes', icon: Icons.quiz),
            QuickLink(label: 'Past exams', icon: Icons.archive),
          ],
        ),
      ],
    );
  }
}

class QuickLink {
  final String label;
  final IconData icon;
  const QuickLink({required this.label, required this.icon});
}

class _QuickLinkGrid extends StatelessWidget {
  final List<QuickLink> items;
  const _QuickLinkGrid({required this.items});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 1.5,
      children: items
          .map(
            (item) => Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: Colors.indigo.shade50,
              ),
              padding: const EdgeInsets.all(12),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(item.icon, color: Colors.indigo),
                  const SizedBox(height: 8),
                  Text(item.label, style: const TextStyle(fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          )
          .toList(),
    );
  }
}

class NotesScreen extends StatelessWidget {
  const NotesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final supabase = context.read<AppState>().supabase;
    return SupabaseList(
      title: 'Notes',
      subtitle: 'High-yield summaries per subject',
      future: supabase.from('revision_notes').select().limit(20),
      titleKey: 'title',
      subtitleKey: 'subject',
      fallbackLabel: 'No notes yet',
    );
  }
}

class FlashcardsScreen extends StatelessWidget {
  const FlashcardsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final supabase = context.read<AppState>().supabase;
    return SupabaseList(
      title: 'Flashcards',
      subtitle: 'Spaced repetition decks',
      future: supabase.from('flashcards').select().limit(20),
      titleKey: 'front',
      subtitleKey: 'subject',
      fallbackLabel: 'No flashcards yet',
    );
  }
}

class QuizScreen extends StatelessWidget {
  const QuizScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final supabase = context.read<AppState>().supabase;
    return SupabaseList(
      title: 'Topic quizzes',
      subtitle: 'Timed practice with instant feedback',
      future: supabase.from('quizzes').select().limit(20),
      titleKey: 'title',
      subtitleKey: 'subject',
      fallbackLabel: 'No quizzes yet',
    );
  }
}

class PastExamsScreen extends StatelessWidget {
  const PastExamsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final supabase = context.read<AppState>().supabase;
    return SupabaseList(
      title: 'Past exams',
      subtitle: 'Previous papers and solutions',
      future: supabase.from('past_exams').select().limit(20),
      titleKey: 'title',
      subtitleKey: 'year',
      fallbackLabel: 'No past exams yet',
    );
  }
}

class SupabaseList extends StatelessWidget {
  final String title;
  final String subtitle;
  final PostgrestFilterBuilder future;
  final String titleKey;
  final String? subtitleKey;
  final String fallbackLabel;

  const SupabaseList({
    super.key,
    required this.title,
    required this.subtitle,
    required this.future,
    required this.titleKey,
    this.subtitleKey,
    required this.fallbackLabel,
  });

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: future,
      builder: (context, snapshot) {
        final theme = Theme.of(context);
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}'));
        }
        final data = snapshot.data ?? [];
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(title, style: theme.textTheme.headlineSmall),
            const SizedBox(height: 6),
            Text(subtitle, style: theme.textTheme.bodyMedium),
            const SizedBox(height: 12),
            if (data.isEmpty)
              Text(fallbackLabel, style: theme.textTheme.bodyMedium)
            else
              ...data.map(
                (item) => Card(
                  child: ListTile(
                    title: Text(item[titleKey]?.toString() ?? 'Untitled'),
                    subtitle: subtitleKey != null ? Text(item[subtitleKey!]?.toString() ?? '') : null,
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
