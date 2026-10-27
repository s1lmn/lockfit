import type { LanguagePreference } from '../types/lockfit';

export type SupportedLanguage = Exclude<LanguagePreference, 'system'>;

export const languageOptions: { id: LanguagePreference; label: string }[] = [
  { id: 'system', label: 'System / Системный' },
  { id: 'en', label: 'English' },
  { id: 'ru', label: 'Русский' },
  { id: 'es', label: 'Español' },
  { id: 'fr', label: 'Français' },
  { id: 'de', label: 'Deutsch' },
  { id: 'pt', label: 'Português' },
  { id: 'zh', label: '中文' },
  { id: 'ja', label: '日本語' },
  { id: 'ko', label: '한국어' },
  { id: 'hi', label: 'हिन्दी' },
  { id: 'ar', label: 'العربية' },
];

const en = {
  'nav.auth': 'Sign in to LockFit', 'nav.onboarding': 'Getting started', 'nav.apps': 'Apps and limits',
  'nav.permissions': 'Android permissions', 'nav.home': 'LockFit', 'nav.menu': 'Menu',
  'nav.account': 'Account', 'nav.settings': 'Settings', 'nav.lock': 'Blocked',
  'nav.activity': 'Movement and rewards', 'nav.exercise': 'Exercise unlock', 'nav.battery': 'Battery settings',
  'settings.language': 'App language', 'settings.languageHint': 'System follows your phone language. A manual choice applies immediately.',
  'settings.systemLanguage': 'System language',
  'activity.eyebrow': 'TIME THROUGH MOVEMENT', 'activity.title': 'Choose the activity that fits right now.',
  'activity.description': 'The camera checks exercise form, while Android counts everyday walking. Used activity cannot be claimed twice.',
  'activity.exercise': 'Exercise', 'activity.exerciseDescription': 'Push-ups or squats with pose verification.',
  'activity.steps': 'Steps', 'activity.stepRule': '{steps} new steps for +{minutes} min.',
  'activity.openCamera': 'Open camera', 'activity.stepsToday': 'steps today',
  'activity.nextReward': 'Next reward', 'activity.progress': '{current} of {target} new steps',
  'activity.unsupported': 'This device has no hardware step counter. Camera exercises will still work.',
  'activity.permission': 'Allow physical activity', 'activity.refresh': 'Refresh steps', 'activity.syncing': 'Refreshing…',
  'activity.claim': 'Get +{minutes} min', 'activity.needMore': 'Walk a little more',
  'activity.last7': 'Last 7 days', 'activity.activeDays': '{count} active days',
  'activity.stepsUnit': 'steps', 'activity.repsUnit': 'reps', 'activity.workoutsUnit': 'workouts',
  'home.todayFor': 'Today for {nickname}', 'home.baseLimit': 'Base limit {limit}. Movement bonus today {bonus}.',
  'home.appsControlled': 'apps under control', 'home.limitReached': 'reached the limit',
  'home.week': 'Your week', 'home.activeOutOf7': '{count} active days out of 7', 'home.openActivity': 'Open movement and rewards',
  'common.minutesShort': 'min',
} as const;

type TranslationKey = keyof typeof en;
type Dictionary = Partial<Record<TranslationKey, string>>;

const ru: Dictionary = {
  'nav.auth': 'Вход в LockFit', 'nav.onboarding': 'Первый запуск', 'nav.apps': 'Приложения и лимиты',
  'nav.permissions': 'Разрешения Android', 'nav.home': 'LockFit', 'nav.menu': 'Меню', 'nav.account': 'Аккаунт',
  'nav.settings': 'Настройки', 'nav.lock': 'Блокировка', 'nav.activity': 'Движение и награды',
  'nav.exercise': 'Разблокировка упражнением', 'nav.battery': 'Настройки батареи',
  'settings.language': 'Язык приложения', 'settings.languageHint': 'Системный язык следует настройке телефона. Ручной выбор применяется сразу.',
  'settings.systemLanguage': 'Системный язык', 'activity.eyebrow': 'ВРЕМЯ ЧЕРЕЗ ДВИЖЕНИЕ',
  'activity.title': 'Выбери активность, которая подходит сейчас.',
  'activity.description': 'Камера проверяет технику упражнения, а Android считает обычную ходьбу. Уже обменённую активность нельзя использовать дважды.',
  'activity.exercise': 'Упражнение', 'activity.exerciseDescription': 'Отжимания или приседания с проверкой позы.',
  'activity.steps': 'Шаги', 'activity.stepRule': '{steps} новых шагов за +{minutes} мин.',
  'activity.openCamera': 'Открыть камеру', 'activity.stepsToday': 'шагов сегодня', 'activity.nextReward': 'Следующая награда',
  'activity.progress': '{current} из {target} новых шагов', 'activity.unsupported': 'На устройстве нет аппаратного шагомера. Упражнения с камерой продолжат работать.',
  'activity.permission': 'Разрешить физическую активность', 'activity.refresh': 'Обновить шаги', 'activity.syncing': 'Обновляем…',
  'activity.claim': 'Получить +{minutes} мин', 'activity.needMore': 'Нужно ещё пройти', 'activity.last7': 'Последние 7 дней',
  'activity.activeDays': '{count} активных дней', 'activity.stepsUnit': 'шагов', 'activity.repsUnit': 'повторов',
  'activity.workoutsUnit': 'тренировок', 'home.todayFor': 'Сегодня для {nickname}',
  'home.baseLimit': 'Базовый лимит {limit}. Бонус за движение сегодня {bonus}.', 'home.appsControlled': 'приложения под контролем',
  'home.limitReached': 'дошли до лимита', 'home.week': 'Твоя неделя', 'home.activeOutOf7': '{count} активных дней из 7',
  'home.openActivity': 'Открыть движение и награды', 'common.minutesShort': 'мин',
};

const es: Dictionary = {
  'nav.auth': 'Entrar en LockFit', 'nav.onboarding': 'Primeros pasos', 'nav.apps': 'Apps y límites', 'nav.permissions': 'Permisos de Android',
  'nav.menu': 'Menú', 'nav.account': 'Cuenta', 'nav.settings': 'Ajustes', 'nav.lock': 'Bloqueado', 'nav.activity': 'Movimiento y recompensas',
  'nav.exercise': 'Desbloqueo con ejercicio', 'nav.battery': 'Ajustes de batería', 'settings.language': 'Idioma de la aplicación',
  'settings.languageHint': 'Sistema usa el idioma del teléfono. El cambio manual se aplica al instante.', 'settings.systemLanguage': 'Idioma del sistema',
  'activity.eyebrow': 'TIEMPO CON MOVIMIENTO', 'activity.title': 'Elige la actividad que te convenga ahora.',
  'activity.description': 'La cámara comprueba la técnica y Android cuenta tus pasos. Una actividad usada no se puede canjear dos veces.',
  'activity.exercise': 'Ejercicio', 'activity.exerciseDescription': 'Flexiones o sentadillas con verificación de postura.', 'activity.steps': 'Pasos',
  'activity.stepRule': '{steps} pasos nuevos por +{minutes} min.', 'activity.openCamera': 'Abrir cámara', 'activity.stepsToday': 'pasos hoy',
  'activity.nextReward': 'Próxima recompensa', 'activity.progress': '{current} de {target} pasos nuevos', 'activity.permission': 'Permitir actividad física',
  'activity.refresh': 'Actualizar pasos', 'activity.syncing': 'Actualizando…', 'activity.claim': 'Obtener +{minutes} min', 'activity.needMore': 'Camina un poco más',
  'activity.last7': 'Últimos 7 días', 'activity.activeDays': '{count} días activos', 'activity.stepsUnit': 'pasos', 'activity.repsUnit': 'repeticiones',
  'activity.workoutsUnit': 'entrenamientos', 'home.week': 'Tu semana', 'home.openActivity': 'Abrir movimiento y recompensas', 'common.minutesShort': 'min',
};

const fr: Dictionary = {
  'nav.auth': 'Connexion à LockFit', 'nav.onboarding': 'Premiers pas', 'nav.apps': 'Apps et limites', 'nav.permissions': 'Autorisations Android',
  'nav.menu': 'Menu', 'nav.account': 'Compte', 'nav.settings': 'Réglages', 'nav.lock': 'Bloqué', 'nav.activity': 'Mouvement et récompenses',
  'nav.exercise': 'Déblocage par exercice', 'nav.battery': 'Réglages batterie', 'settings.language': "Langue de l’application",
  'settings.languageHint': 'Système suit la langue du téléphone. Un choix manuel est appliqué immédiatement.', 'settings.systemLanguage': 'Langue du système',
  'activity.eyebrow': 'DU TEMPS PAR LE MOUVEMENT', 'activity.title': 'Choisis l’activité adaptée au moment.',
  'activity.description': 'La caméra vérifie la posture et Android compte la marche. Une activité utilisée ne peut pas être réclamée deux fois.',
  'activity.exercise': 'Exercice', 'activity.exerciseDescription': 'Pompes ou squats avec vérification de posture.', 'activity.steps': 'Pas',
  'activity.stepRule': '{steps} nouveaux pas pour +{minutes} min.', 'activity.openCamera': 'Ouvrir la caméra', 'activity.stepsToday': 'pas aujourd’hui',
  'activity.nextReward': 'Prochaine récompense', 'activity.progress': '{current} sur {target} nouveaux pas', 'activity.permission': 'Autoriser l’activité physique',
  'activity.refresh': 'Actualiser les pas', 'activity.syncing': 'Actualisation…', 'activity.claim': 'Obtenir +{minutes} min', 'activity.needMore': 'Marche encore un peu',
  'activity.last7': '7 derniers jours', 'activity.activeDays': '{count} jours actifs', 'activity.stepsUnit': 'pas', 'activity.repsUnit': 'répétitions',
  'activity.workoutsUnit': 'entraînements', 'home.week': 'Ta semaine', 'home.openActivity': 'Ouvrir mouvement et récompenses', 'common.minutesShort': 'min',
};

const de: Dictionary = {
  'nav.auth': 'Bei LockFit anmelden', 'nav.onboarding': 'Erste Schritte', 'nav.apps': 'Apps und Limits', 'nav.permissions': 'Android-Berechtigungen',
  'nav.menu': 'Menü', 'nav.account': 'Konto', 'nav.settings': 'Einstellungen', 'nav.lock': 'Gesperrt', 'nav.activity': 'Bewegung und Belohnungen',
  'nav.exercise': 'Mit Übung entsperren', 'nav.battery': 'Akku-Einstellungen', 'settings.language': 'App-Sprache',
  'settings.languageHint': 'System folgt der Handysprache. Eine manuelle Auswahl gilt sofort.', 'settings.systemLanguage': 'Systemsprache',
  'activity.eyebrow': 'ZEIT DURCH BEWEGUNG', 'activity.title': 'Wähle die Aktivität, die jetzt passt.',
  'activity.description': 'Die Kamera prüft Übungen, Android zählt Schritte. Verwendete Aktivität kann nicht doppelt eingelöst werden.',
  'activity.exercise': 'Übung', 'activity.exerciseDescription': 'Liegestütze oder Kniebeugen mit Posenerkennung.', 'activity.steps': 'Schritte',
  'activity.stepRule': '{steps} neue Schritte für +{minutes} Min.', 'activity.openCamera': 'Kamera öffnen', 'activity.stepsToday': 'Schritte heute',
  'activity.nextReward': 'Nächste Belohnung', 'activity.progress': '{current} von {target} neuen Schritten', 'activity.permission': 'Aktivität erlauben',
  'activity.refresh': 'Schritte aktualisieren', 'activity.syncing': 'Wird aktualisiert…', 'activity.claim': '+{minutes} Min erhalten', 'activity.needMore': 'Noch etwas gehen',
  'activity.last7': 'Letzte 7 Tage', 'activity.activeDays': '{count} aktive Tage', 'activity.stepsUnit': 'Schritte', 'activity.repsUnit': 'Wiederholungen',
  'activity.workoutsUnit': 'Trainings', 'home.week': 'Deine Woche', 'home.openActivity': 'Bewegung und Belohnungen öffnen', 'common.minutesShort': 'Min.',
};

const pt: Dictionary = {
  'nav.auth': 'Entrar no LockFit', 'nav.onboarding': 'Primeiros passos', 'nav.apps': 'Apps e limites', 'nav.permissions': 'Permissões Android',
  'nav.menu': 'Menu', 'nav.account': 'Conta', 'nav.settings': 'Definições', 'nav.lock': 'Bloqueado', 'nav.activity': 'Movimento e recompensas',
  'nav.exercise': 'Desbloquear com exercício', 'nav.battery': 'Definições de bateria', 'settings.language': 'Idioma da aplicação',
  'settings.languageHint': 'Sistema segue o idioma do telefone. A escolha manual é aplicada imediatamente.', 'settings.systemLanguage': 'Idioma do sistema',
  'activity.eyebrow': 'TEMPO COM MOVIMENTO', 'activity.title': 'Escolhe a atividade certa para agora.',
  'activity.description': 'A câmara verifica a técnica e o Android conta passos. A atividade usada não pode ser resgatada duas vezes.',
  'activity.exercise': 'Exercício', 'activity.exerciseDescription': 'Flexões ou agachamentos com verificação de pose.', 'activity.steps': 'Passos',
  'activity.stepRule': '{steps} passos novos por +{minutes} min.', 'activity.openCamera': 'Abrir câmara', 'activity.stepsToday': 'passos hoje',
  'activity.nextReward': 'Próxima recompensa', 'activity.progress': '{current} de {target} passos novos', 'activity.permission': 'Permitir atividade física',
  'activity.refresh': 'Atualizar passos', 'activity.syncing': 'A atualizar…', 'activity.claim': 'Receber +{minutes} min', 'activity.needMore': 'Caminha mais um pouco',
  'activity.last7': 'Últimos 7 dias', 'activity.activeDays': '{count} dias ativos', 'activity.stepsUnit': 'passos', 'activity.repsUnit': 'repetições',
  'activity.workoutsUnit': 'treinos', 'home.week': 'A tua semana', 'home.openActivity': 'Abrir movimento e recompensas', 'common.minutesShort': 'min',
};

const zh: Dictionary = {
  'nav.auth': '登录 LockFit', 'nav.onboarding': '开始使用', 'nav.apps': '应用与限额', 'nav.permissions': 'Android 权限', 'nav.menu': '菜单',
  'nav.account': '账户', 'nav.settings': '设置', 'nav.lock': '已锁定', 'nav.activity': '运动与奖励', 'nav.exercise': '运动解锁', 'nav.battery': '电池设置',
  'settings.language': '应用语言', 'settings.languageHint': '系统选项会跟随手机语言，手动选择会立即生效。', 'settings.systemLanguage': '系统语言',
  'activity.eyebrow': '用运动换时间', 'activity.title': '选择现在适合你的活动。', 'activity.description': '相机会检查动作，Android 会记录步行。已兑换的活动不能重复使用。',
  'activity.exercise': '锻炼', 'activity.exerciseDescription': '通过姿势检测完成俯卧撑或深蹲。', 'activity.steps': '步数', 'activity.stepRule': '每 {steps} 个新步数奖励 +{minutes} 分钟。',
  'activity.openCamera': '打开相机', 'activity.stepsToday': '今日步数', 'activity.nextReward': '下一个奖励', 'activity.progress': '{current} / {target} 新步数',
  'activity.permission': '允许身体活动', 'activity.refresh': '刷新步数', 'activity.syncing': '正在刷新…', 'activity.claim': '领取 +{minutes} 分钟', 'activity.needMore': '再走一会儿',
  'activity.last7': '最近 7 天', 'activity.activeDays': '{count} 个活跃日', 'activity.stepsUnit': '步', 'activity.repsUnit': '次', 'activity.workoutsUnit': '次训练',
  'home.week': '本周成果', 'home.openActivity': '打开运动与奖励', 'common.minutesShort': '分钟',
};

const ja: Dictionary = {
  'nav.auth': 'LockFit にログイン', 'nav.onboarding': 'はじめに', 'nav.apps': 'アプリと制限', 'nav.permissions': 'Android の権限', 'nav.menu': 'メニュー',
  'nav.account': 'アカウント', 'nav.settings': '設定', 'nav.lock': 'ブロック中', 'nav.activity': '運動と報酬', 'nav.exercise': '運動で解除', 'nav.battery': 'バッテリー設定',
  'settings.language': 'アプリの言語', 'settings.languageHint': 'システムは端末の言語に従います。手動変更はすぐに反映されます。', 'settings.systemLanguage': 'システム言語',
  'activity.eyebrow': '動いて時間を獲得', 'activity.title': '今に合うアクティビティを選ぼう。', 'activity.description': 'カメラがフォームを確認し、Android が歩数を数えます。使用済みの活動は再利用できません。',
  'activity.exercise': 'エクササイズ', 'activity.exerciseDescription': '姿勢確認付きの腕立て伏せまたはスクワット。', 'activity.steps': '歩数', 'activity.stepRule': '新しい {steps} 歩で +{minutes} 分。',
  'activity.openCamera': 'カメラを開く', 'activity.stepsToday': '今日の歩数', 'activity.nextReward': '次の報酬', 'activity.progress': '新しい歩数 {current} / {target}',
  'activity.permission': '身体活動を許可', 'activity.refresh': '歩数を更新', 'activity.syncing': '更新中…', 'activity.claim': '+{minutes} 分を受け取る', 'activity.needMore': 'もう少し歩こう',
  'activity.last7': '過去 7 日', 'activity.activeDays': 'アクティブ {count} 日', 'activity.stepsUnit': '歩', 'activity.repsUnit': '回', 'activity.workoutsUnit': '回の運動',
  'home.week': '今週の成果', 'home.openActivity': '運動と報酬を開く', 'common.minutesShort': '分',
};

const ko: Dictionary = {
  'nav.auth': 'LockFit 로그인', 'nav.onboarding': '시작하기', 'nav.apps': '앱과 제한', 'nav.permissions': 'Android 권한', 'nav.menu': '메뉴',
  'nav.account': '계정', 'nav.settings': '설정', 'nav.lock': '차단됨', 'nav.activity': '움직임과 보상', 'nav.exercise': '운동으로 잠금 해제', 'nav.battery': '배터리 설정',
  'settings.language': '앱 언어', 'settings.languageHint': '시스템은 휴대폰 언어를 따릅니다. 수동 선택은 즉시 적용됩니다.', 'settings.systemLanguage': '시스템 언어',
  'activity.eyebrow': '움직여서 시간 얻기', 'activity.title': '지금 맞는 활동을 선택하세요.', 'activity.description': '카메라는 운동 자세를 확인하고 Android는 걸음을 셉니다. 사용한 활동은 다시 받을 수 없습니다.',
  'activity.exercise': '운동', 'activity.exerciseDescription': '자세 확인이 포함된 팔굽혀펴기 또는 스쿼트.', 'activity.steps': '걸음', 'activity.stepRule': '새 {steps}걸음당 +{minutes}분.',
  'activity.openCamera': '카메라 열기', 'activity.stepsToday': '오늘 걸음', 'activity.nextReward': '다음 보상', 'activity.progress': '새 걸음 {current} / {target}',
  'activity.permission': '신체 활동 허용', 'activity.refresh': '걸음 새로고침', 'activity.syncing': '새로고침 중…', 'activity.claim': '+{minutes}분 받기', 'activity.needMore': '조금 더 걸으세요',
  'activity.last7': '최근 7일', 'activity.activeDays': '활동일 {count}일', 'activity.stepsUnit': '걸음', 'activity.repsUnit': '회', 'activity.workoutsUnit': '운동',
  'home.week': '이번 주', 'home.openActivity': '움직임과 보상 열기', 'common.minutesShort': '분',
};

const hi: Dictionary = {
  'nav.auth': 'LockFit में साइन इन', 'nav.onboarding': 'शुरू करें', 'nav.apps': 'ऐप और सीमाएँ', 'nav.permissions': 'Android अनुमतियाँ', 'nav.menu': 'मेन्यू',
  'nav.account': 'खाता', 'nav.settings': 'सेटिंग्स', 'nav.lock': 'ब्लॉक किया गया', 'nav.activity': 'गतिविधि और इनाम', 'nav.exercise': 'व्यायाम से अनलॉक', 'nav.battery': 'बैटरी सेटिंग्स',
  'settings.language': 'ऐप की भाषा', 'settings.languageHint': 'सिस्टम फ़ोन की भाषा अपनाता है। मैन्युअल चुनाव तुरंत लागू होता है।', 'settings.systemLanguage': 'सिस्टम भाषा',
  'activity.eyebrow': 'चलकर समय पाएँ', 'activity.title': 'अभी सही गतिविधि चुनें।', 'activity.description': 'कैमरा व्यायाम की मुद्रा जाँचता है और Android कदम गिनता है। उपयोग की गई गतिविधि दोबारा नहीं मिलती।',
  'activity.exercise': 'व्यायाम', 'activity.exerciseDescription': 'मुद्रा जाँच के साथ पुश-अप या स्क्वैट।', 'activity.steps': 'कदम', 'activity.stepRule': '{steps} नए कदम पर +{minutes} मिनट।',
  'activity.openCamera': 'कैमरा खोलें', 'activity.stepsToday': 'आज के कदम', 'activity.nextReward': 'अगला इनाम', 'activity.progress': '{target} में से {current} नए कदम',
  'activity.permission': 'शारीरिक गतिविधि की अनुमति दें', 'activity.refresh': 'कदम अपडेट करें', 'activity.syncing': 'अपडेट हो रहा है…', 'activity.claim': '+{minutes} मिनट पाएँ', 'activity.needMore': 'थोड़ा और चलें',
  'activity.last7': 'पिछले 7 दिन', 'activity.activeDays': '{count} सक्रिय दिन', 'activity.stepsUnit': 'कदम', 'activity.repsUnit': 'रेप', 'activity.workoutsUnit': 'वर्कआउट',
  'home.week': 'आपका सप्ताह', 'home.openActivity': 'गतिविधि और इनाम खोलें', 'common.minutesShort': 'मिनट',
};

const ar: Dictionary = {
  'nav.auth': 'تسجيل الدخول إلى LockFit', 'nav.onboarding': 'البدء', 'nav.apps': 'التطبيقات والحدود', 'nav.permissions': 'أذونات Android', 'nav.menu': 'القائمة',
  'nav.account': 'الحساب', 'nav.settings': 'الإعدادات', 'nav.lock': 'محظور', 'nav.activity': 'الحركة والمكافآت', 'nav.exercise': 'فتح بالتمرين', 'nav.battery': 'إعدادات البطارية',
  'settings.language': 'لغة التطبيق', 'settings.languageHint': 'يتبع خيار النظام لغة الهاتف. يطبق الاختيار اليدوي فوراً.', 'settings.systemLanguage': 'لغة النظام',
  'activity.eyebrow': 'وقت مقابل الحركة', 'activity.title': 'اختر النشاط المناسب الآن.', 'activity.description': 'تتحقق الكاميرا من التمرين ويحسب Android الخطوات. لا يمكن استخدام النشاط المصروف مرتين.',
  'activity.exercise': 'تمرين', 'activity.exerciseDescription': 'تمارين ضغط أو قرفصاء مع التحقق من الوضعية.', 'activity.steps': 'الخطوات', 'activity.stepRule': '{steps} خطوة جديدة مقابل +{minutes} دقيقة.',
  'activity.openCamera': 'فتح الكاميرا', 'activity.stepsToday': 'خطوات اليوم', 'activity.nextReward': 'المكافأة التالية', 'activity.progress': '{current} من {target} خطوة جديدة',
  'activity.permission': 'السماح بالنشاط البدني', 'activity.refresh': 'تحديث الخطوات', 'activity.syncing': 'جارٍ التحديث…', 'activity.claim': 'احصل على +{minutes} دقيقة', 'activity.needMore': 'امشِ قليلاً بعد',
  'activity.last7': 'آخر 7 أيام', 'activity.activeDays': '{count} أيام نشطة', 'activity.stepsUnit': 'خطوة', 'activity.repsUnit': 'تكرار', 'activity.workoutsUnit': 'تمارين',
  'home.week': 'أسبوعك', 'home.openActivity': 'فتح الحركة والمكافآت', 'common.minutesShort': 'دقيقة',
};

export const translations: Record<SupportedLanguage, Dictionary> = {
  en, ru, es, fr, de, pt, zh, ja, ko, hi, ar,
};

export type { TranslationKey };
