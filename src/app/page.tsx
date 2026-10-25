'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Check, Trash2, Plus, Settings, X, ListTodo, Flame, BarChart3,
  User, Globe, Palette, Type, Calendar, Volume2, Sparkles, RotateCcw, Star,
  Download, Upload, Pencil, GripVertical, Bell
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

interface Task { id: string; text: string; completed: boolean; createdAt: string; }
interface Habit { id: string; name: string; icon: string; gradient: string; streak: number; history: boolean[]; days: boolean[]; }
type Language = 'en' | 'ru';
type Theme = 'light' | 'dark' | 'system';
type FontSize = 'small' | 'medium' | 'large';
type DateFormat = 'short' | 'medium' | 'long';
interface Settings { name: string; language: Language; theme: Theme; accentColor: string; fontSize: FontSize; dateFormat: DateFormat; sounds: boolean; animations: boolean; reminderTime: string; }
interface HistoryEntry { date: string; completedTasks: number; totalTasks: number; completedHabits: number; totalHabits: number; }

const HABIT_ICONS = [
  { emoji: '🏃', gradient: 'from-orange-400 to-red-500' }, { emoji: '💧', gradient: 'from-blue-400 to-cyan-500' },
  { emoji: '🧘', gradient: 'from-purple-400 to-pink-500' }, { emoji: '😴', gradient: 'from-indigo-400 to-purple-500' },
  { emoji: '💪', gradient: 'from-red-400 to-orange-500' }, { emoji: '🎯', gradient: 'from-green-400 to-emerald-500' },
  { emoji: '☕', gradient: 'from-amber-400 to-orange-500' }, { emoji: '📚', gradient: 'from-teal-400 to-cyan-500' },
  { emoji: '🎨', gradient: 'from-pink-400 to-rose-500' }, { emoji: '🌱', gradient: 'from-lime-400 to-green-500' },
];

const ACCENT_COLORS = [
  { name: 'Indigo', value: '#6366f1' }, { name: 'Blue', value: '#3b82f6' }, { name: 'Cyan', value: '#06b6d4' },
  { name: 'Emerald', value: '#10b981' }, { name: 'Lime', value: '#84cc16' }, { name: 'Amber', value: '#f59e0b' },
  { name: 'Orange', value: '#f97316' }, { name: 'Red', value: '#ef4444' }, { name: 'Pink', value: '#ec4899' }, { name: 'Purple', value: '#a855f7' },
];

const TRANSLATIONS = {
  en: {
    tasks: 'Tasks', habits: 'Habits', stats: 'Stats', goodMorning: 'Good morning', goodAfternoon: 'Good afternoon', goodEvening: 'Good evening',
    taskProgress: 'Task Progress', newTask: 'New task', addTask: 'Add task', taskPlaceholder: 'What needs to be done?', cancel: 'Cancel', add: 'Add',
    yourHabits: 'Your habits', newHabit: 'New habit', habitPlaceholder: 'Habit name', chooseIcon: 'Choose icon', days: 'days', noHabits: 'No habits yet',
    noTasks: 'No tasks yet', settings: 'Settings', profile: 'Profile', yourName: 'Your name', language: 'Language', theme: 'Theme',
    light: 'Light', dark: 'Dark', system: 'System', accentColor: 'Accent color', fontSize: 'Font size', small: 'Small', medium: 'Medium', large: 'Large',
    dateFormat: 'Date format', short: 'Short', long: 'Long', sounds: 'Sounds', animations: 'Animations', resetAll: 'Reset all data',
    resetConfirm: 'Are you sure? All data will be deleted.', confirm: 'Confirm', saved: 'Saved ✓', statistics: 'Statistics', tasksCompleted: 'Tasks done',
    bestStreak: 'Best streak', avgCompletion: 'Avg. completion', last7Days: 'Last 7 days', habitCompletion: 'Habit completion', today: 'Today',
    completed: 'Completed', remaining: 'Remaining', days7: 'last 7 days', tasksChart: 'Task completion', habitPie: 'Habits today',
    perfectDays: 'Perfect Days', heatmap: 'Activity Heatmap', perfectDayHint: 'Days with all tasks & habits done', less: 'Less', more: 'More',
    exportData: 'Export Data (JSON)', importData: 'Import Data (JSON)', backup: 'Backup', editTask: 'Edit Task', editHabit: 'Edit Habit', delete: 'Delete', save: 'Save',
    schedule: 'Schedule', everyDay: 'Every day', daysShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    reminders: 'Reminders', reminderTime: 'Reminder time', enableReminders: 'Enable reminders'
  },
  ru: {
    tasks: 'Задачи', habits: 'Привычки', stats: 'Статистика', goodMorning: 'Доброе утро', goodAfternoon: 'Добрый день', goodEvening: 'Добрый вечер',
    taskProgress: 'Прогресс задач', newTask: 'Новая задача', addTask: 'Добавить задачу', taskPlaceholder: 'Что нужно сделать?', cancel: 'Отмена', add: 'Добавить',
    yourHabits: 'Ваши привычки', newHabit: 'Новая привычка', habitPlaceholder: 'Название привычки', chooseIcon: 'Выберите иконку', days: 'дн.', noHabits: 'Пока нет привычек',
    noTasks: 'Пока нет задач', settings: 'Настройки', profile: 'Профиль', yourName: 'Ваше имя', language: 'Язык', theme: 'Тема',
    light: 'Светлая', dark: 'Тёмная', system: 'Системная', accentColor: 'Акцентный цвет', fontSize: 'Размер шрифта', small: 'Маленький', medium: 'Средний', large: 'Большой',
    dateFormat: 'Формат даты', short: 'Короткий', long: 'Длинный', sounds: 'Звуки', animations: 'Анимации', resetAll: 'Сбросить все данные',
    resetConfirm: 'Вы уверены? Все данные будут удалены.', confirm: 'Подтвердить', saved: 'Сохранено ✓', statistics: 'Статистика', tasksCompleted: 'Задач выполнено',
    bestStreak: 'Лучший стрик', avgCompletion: 'Средний %', last7Days: 'Последние 7 дней', habitCompletion: 'Выполнение привычек', today: 'Сегодня',
    completed: 'Выполнено', remaining: 'Осталось', days7: 'за 7 дней', tasksChart: 'Выполнение задач', habitPie: 'Привычки сегодня',
    perfectDays: 'Идеальные дни', heatmap: 'Карта активности', perfectDayHint: 'Дни, когда сделано всё', less: 'Меньше', more: 'Больше',
    exportData: 'Экспорт данных (JSON)', importData: 'Импорт данных (JSON)', backup: 'Резервная копия', editTask: 'Редактировать задачу', editHabit: 'Редактировать привычку', delete: 'Удалить', save: 'Сохранить',
    schedule: 'Расписание', everyDay: 'Каждый день', daysShort: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    reminders: 'Напоминания', reminderTime: 'Время напоминания', enableReminders: 'Включить напоминания'
  },
};

const DEFAULT_SETTINGS: Settings = {
  name: 'Друг', language: 'ru', theme: 'light', accentColor: '#6366f1',
  fontSize: 'medium', dateFormat: 'medium', sounds: true, animations: true,
  reminderTime: '20:00',
};

const fontSizeMap: Record<FontSize, string> = { small: 'text-sm', medium: 'text-base', large: 'text-lg' };
const TAB_ORDER = ['tasks', 'habits', 'stats'];

export default function PlannerPage() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [todayIndex, setTodayIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'tasks' | 'habits' | 'stats'>('tasks');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toast, setToast] = useState<string | undefined>(undefined);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState('');
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState(0);
  const [newHabitDays, setNewHabitDays] = useState<boolean[]>([true, true, true, true, true, true, true]);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[settings.language];

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(undefined), 1800); };
  const updateSettings = (patch: Partial<Settings>) => { setSettings((s) => ({ ...s, ...patch })); showToast(t.saved); };

  const requestNotificationPermission = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const perm = await LocalNotifications.requestPermissions();
        if (perm.display === 'granted') { scheduleReminder(); showToast(settings.language === 'ru' ? 'Напоминания включены!' : 'Reminders enabled!'); }
      } catch (e) { console.error(e); }
    } else { showToast(settings.language === 'ru' ? 'Доступно только в APK' : 'Available only in APK'); }
  };

  const scheduleReminder = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
      const [hours, minutes] = settings.reminderTime.split(':').map(Number);
      const now = new Date();
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);
      if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
      await LocalNotifications.schedule({
        notifications: [{ id: 1, title: settings.language === 'ru' ? 'Планировщик' : 'Planner', body: settings.language === 'ru' ? 'Не забудь проверить свои задачи и привычки!' : 'Don\'t forget to check your tasks and habits!', schedule: { at: target, repeats: true, every: 'day' }, sound: null }],
      });
      showToast(settings.language === 'ru' ? 'Напоминание установлено!' : 'Reminder set!');
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    setMounted(true);
    const d = new Date();
    setNow(d);
    setTodayIndex(d.getDay() === 0 ? 6 : d.getDay() - 1);
    try {
      const st = localStorage.getItem('planner-tasks'); if (st) setTasks(JSON.parse(st));
      const sh = localStorage.getItem('planner-habits'); if (sh) setHabits(JSON.parse(sh).map((h: any) => ({ ...h, history: h.history ?? [false, false, false, false, false, false, false], days: h.days ?? [true, true, true, true, true, true, true] })));
      const ss = localStorage.getItem('planner-settings'); if (ss) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(ss) });
      const shi = localStorage.getItem('planner-history'); if (shi) setHistory(JSON.parse(shi));
    } catch {}
    const timer = setInterval(() => {
      const newD = new Date(); setNow(newD); setTodayIndex(newD.getDay() === 0 ? 6 : newD.getDay() - 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { if (mounted) localStorage.setItem('planner-tasks', JSON.stringify(tasks)); }, [tasks, mounted]);
  useEffect(() => { if (mounted) localStorage.setItem('planner-habits', JSON.stringify(habits)); }, [habits, mounted]);
  useEffect(() => { if (mounted) localStorage.setItem('planner-settings', JSON.stringify(settings)); }, [settings, mounted]);
  useEffect(() => { if (mounted) localStorage.setItem('planner-history', JSON.stringify(history)); }, [history, mounted]);

  useEffect(() => { if (mounted && Capacitor.isNativePlatform()) scheduleReminder(); }, [settings.reminderTime, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const today = new Date().toISOString().split('T')[0];
    const ct = tasks.filter((x) => x.completed).length;
    const ch = habits.filter((h) => h.history && h.history[6] && h.days[todayIndex]).length;
    const tht = habits.filter(h => h.days[todayIndex]).length;
    setHistory((prev) => [...prev.filter((h) => h.date !== today), { date: today, completedTasks: ct, totalTasks: tasks.length, completedHabits: ch, totalHabits: tht }].slice(-90));
  }, [tasks, habits, mounted, todayIndex]);

  const openNewTaskModal = () => { setEditingTaskId(null); setNewTaskText(''); setShowTaskModal(true); };
  const openEditTaskModal = (task: Task) => { setEditingTaskId(task.id); setNewTaskText(task.text); setShowTaskModal(true); };
  const saveTask = () => { if (!newTaskText.trim()) return; if (editingTaskId) setTasks((p) => p.map(t => t.id === editingTaskId ? { ...t, text: newTaskText.trim() } : t)); else setTasks((p) => [...p, { id: Date.now().toString(), text: newTaskText.trim(), completed: false, createdAt: new Date().toISOString() }]); setNewTaskText(''); setShowTaskModal(false); };
  const toggleTask = (id: string) => setTasks((p) => p.map((x) => x.id === id ? { ...x, completed: !x.completed } : x));
  const deleteTask = (id: string) => setTasks((p) => p.filter((x) => x.id !== id));

  const openNewHabitModal = () => { setEditingHabitId(null); setNewHabitName(''); setNewHabitIcon(0); setNewHabitDays([true, true, true, true, true, true, true]); setShowHabitModal(true); };
  const openEditHabitModal = (habit: Habit) => { setEditingHabitId(habit.id); setNewHabitName(habit.name); setNewHabitIcon(HABIT_ICONS.findIndex(i => i.emoji === habit.icon) >= 0 ? HABIT_ICONS.findIndex(i => i.emoji === habit.icon) : 0); setNewHabitDays(habit.days || [true, true, true, true, true, true, true]); setShowHabitModal(true); };
  const saveHabit = () => { if (!newHabitName.trim()) return; const icon = HABIT_ICONS[newHabitIcon]; if (editingHabitId) setHabits((p) => p.map(h => h.id === editingHabitId ? { ...h, name: newHabitName.trim(), icon: icon.emoji, gradient: icon.gradient, days: newHabitDays } : h)); else setHabits((p) => [...p, { id: Date.now().toString(), name: newHabitName.trim(), icon: icon.emoji, gradient: icon.gradient, streak: 0, history: [false, false, false, false, false, false, false], days: newHabitDays }]); setNewHabitName(''); setNewHabitIcon(0); setShowHabitModal(false); };
  const deleteHabit = (id: string) => { setHabits((p) => p.filter((h) => h.id !== id)); setShowHabitModal(false); };
  const toggleHabitDay = (id: string, dayIndex: number) => { setHabits((p) => p.map((h) => { if (h.id !== id || !h.days[dayIndex]) return h; const nh = [...(h.history || [])]; nh[dayIndex] = !nh[dayIndex]; let s = 0; for (let i = 0; i < 7; i++) if (h.days[i] && nh[i]) s++; return { ...h, history: nh, streak: s }; })); };

  const completedCount = tasks.filter((x) => x.completed).length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const totalStreak = habits.reduce((acc, h) => acc + h.streak, 0);
  const bestStreak = habits.length ? Math.max(...habits.map((h) => h.streak)) : 0;
  const isDark = settings.theme === 'dark';
  const bgClass = isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900';
  const cardClass = isDark ? 'bg-gray-800 border border-gray-700 rounded-2xl shadow-sm' : 'bg-white border border-gray-100 rounded-2xl shadow-sm';
  const greeting = (() => { if (!now) return ''; const h = now.getHours(); if (h < 12) return t.goodMorning; if (h < 18) return t.goodAfternoon; return t.goodEvening; })();
  const formatDate = (d: Date) => { const loc = settings.language === 'ru' ? 'ru-RU' : 'en-US'; if (settings.dateFormat === 'short') return d.toLocaleDateString(loc, { day: '2-digit', month: '2-digit' }); if (settings.dateFormat === 'long') return d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); return d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' }); };

  const chartData = (() => { if (!mounted) return []; const last7: any[] = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const key = d.toISOString().split('T')[0]; const f = history.find((h) => h.date === key); last7.push({ label: d.toLocaleDateString(settings.language === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short' }), completed: f?.completedTasks ?? 0 }); } return last7; })();
  const pieData = (() => { if (!mounted) return []; const ht = habits.filter(h => h.days[todayIndex]); const th = ht.length; const ct = ht.filter((h) => h.history && h.history[6]).length; if (th === 0) return []; return [{ name: t.completed, value: ct, color: settings.accentColor }, { name: t.remaining, value: th - ct, color: isDark ? '#374151' : '#e5e7eb' }]; })();
  const totalTasksCompleted = history.reduce((acc, h) => acc + h.completedTasks, 0);
  const avgCompletion = history.length ? Math.round(history.reduce((acc, h) => acc + (h.totalTasks ? (h.completedTasks / h.totalTasks) * 100 : 0), 0) / history.length) : 0;
  const perfectDays = history.filter(h => h.totalTasks > 0 && h.completedTasks === h.totalTasks && h.totalHabits > 0 && h.completedHabits === h.totalHabits).length;
  const heatmapData = (() => { if (!mounted) return []; const days = []; for (let i = 27; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const key = d.toISOString().split('T')[0]; const f = history.find(h => h.date === key); let int = 0; if (f) { const tot = f.totalTasks + f.totalHabits; const done = f.completedTasks + f.completedHabits; if (done > 0) int = Math.min(4, Math.ceil((done / (tot || 1)) * 4)); } days.push({ date: key, intensity: int }); } return days; })();
  const handleDragEnd = (event: any, info: any) => { const st = 50; const ci = TAB_ORDER.indexOf(activeTab); if (info.offset.x < -st && ci < TAB_ORDER.length - 1) setActiveTab(TAB_ORDER[ci + 1] as any); else if (info.offset.x > st && ci > 0) setActiveTab(TAB_ORDER[ci - 1] as any); };

  if (!mounted) return <div className={`min-h-screen ${bgClass}`} />;

  return (
    <div className={`min-h-screen ${bgClass} ${fontSizeMap[settings.fontSize]} transition-colors duration-300 overflow-x-hidden`}>
      <div className="max-w-md mx-auto px-5 pt-8 pb-32">
        {/* Шапка */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{greeting}, {settings.name} 👋</p>
            <h1 className="text-2xl font-semibold mt-1">{now ? formatDate(now) : ''}</h1>
          </div>
          <button onClick={() => setShowSettings(true)} className={`p-3 rounded-full ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50 border border-gray-100'} transition`}>
            <Settings size={20} className={isDark ? 'text-gray-300' : 'text-gray-600'} />
          </button>
        </div>

        <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={handleDragEnd} className="touch-pan-y">
          {activeTab === 'tasks' && (
            <motion.div key="tasks" initial={settings.animations ? { opacity: 0, y: 12 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className={`${cardClass} p-5 mb-5`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t.taskProgress}</span>
                  <span className="text-sm font-semibold" style={{ color: settings.accentColor }}>{progress}%</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: settings.accentColor }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
                </div>
              </div>
              {tasks.length === 0 ? <p className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t.noTasks}</p> : (
                <Reorder.Group axis="y" values={tasks} onReorder={setTasks} className="space-y-3">
                  {tasks.map((task) => (
                    <Reorder.Item key={task.id} value={task}>
                      <motion.div layout onMouseEnter={() => setHoveredTask(task.id)} onMouseLeave={() => setHoveredTask(null)} className={`${cardClass} p-4 flex items-center gap-3 group`}>
                        <div className="cursor-grab text-gray-300 hover:text-gray-500 transition"><GripVertical size={18} /></div>
                        <button onClick={() => toggleTask(task.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0`} style={{ borderColor: task.completed ? settings.accentColor : (isDark ? '#4b5563' : '#d1d5db'), backgroundColor: task.completed ? settings.accentColor : 'transparent' }}>
                          {task.completed && <Check size={14} className="text-white" />}
                        </button>
                        <span onClick={() => openEditTaskModal(task)} className={`flex-1 cursor-pointer ${task.completed ? 'line-through opacity-50' : ''}`}>{task.text}</span>
                        {hoveredTask === task.id && <button onClick={() => openEditTaskModal(task)} className="text-gray-400 hover:text-blue-500 transition" title={t.editTask}><Pencil size={16} /></button>}
                        {hoveredTask === task.id && <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-500 transition"><Trash2 size={18} /></button>}
                      </motion.div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}
            </motion.div>
          )}

          {activeTab === 'habits' && (
            <motion.div key="habits" initial={settings.animations ? { opacity: 0, y: 12 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{t.yourHabits}</h2>
                {habits.length > 0 && <div className="flex items-center gap-1 text-sm font-medium" style={{ color: settings.accentColor }}><Flame size={16} />{totalStreak} {t.days}</div>}
              </div>
              {habits.length === 0 ? <p className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t.noHabits}</p> : (
                <Reorder.Group axis="y" values={habits} onReorder={setHabits} className="space-y-3">
                  {habits.map((habit) => (
                    <Reorder.Item key={habit.id} value={habit}>
                      <motion.div layout className={`${cardClass} p-4 relative overflow-hidden cursor-pointer`} style={{ boxShadow: habit.streak >= 10 ? '0 0 0 2px #fbbf24, 0 4px 12px rgba(251,191,36,0.3)' : undefined }} onClick={() => openEditHabitModal(habit)}>
                        <div className="flex items-center gap-3 pointer-events-none">
                          <div className="cursor-grab text-gray-300 hover:text-gray-500 transition pointer-events-auto"><GripVertical size={18} /></div>
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${habit.gradient} flex items-center justify-center text-2xl shadow-md flex-shrink-0`}>{habit.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-medium truncate">{habit.name}</h3>
                              <span className="text-xs font-semibold whitespace-nowrap" style={{ color: settings.accentColor }}>🔥 {habit.streak}</span>
                            </div>
                            <div className="flex gap-1 mt-1 mb-1">{t.daysShort.map((d, i) => <span key={i} className={`text-[9px] ${habit.days && habit.days[i] ? 'opacity-100' : 'opacity-30'}`} style={{ color: settings.accentColor }}>{d}</span>)}</div>
                            <div className="flex gap-1.5 mt-2 pointer-events-auto">
                              {(habit.history || Array(7).fill(false)).map((done, i) => {
                                const isScheduled = habit.days && habit.days[i];
                                return <button key={i} disabled={!isScheduled} onClick={(e) => { e.stopPropagation(); toggleHabitDay(habit.id, i); }} className={`w-6 h-6 rounded-full border-2 transition-all ${done ? 'border-transparent' : (isDark ? 'border-gray-600' : 'border-gray-200')} ${!isScheduled ? 'opacity-20 cursor-not-allowed' : ''}`} style={{ backgroundColor: done ? settings.accentColor : 'transparent' }} />;
                              })}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div key="stats" initial={settings.animations ? { opacity: 0, y: 12 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <h2 className="text-xl font-semibold mb-4">{t.statistics}</h2>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className={`${cardClass} p-3 text-center flex flex-col items-center justify-center`}><p className="text-2xl font-bold" style={{ color: settings.accentColor }}>{totalTasksCompleted}</p><p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.tasksCompleted}</p></div>
                <div className={`${cardClass} p-3 text-center flex flex-col items-center justify-center`}><p className="text-2xl font-bold" style={{ color: settings.accentColor }}>{bestStreak}</p><p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.bestStreak}</p></div>
                <div className={`${cardClass} p-3 text-center flex flex-col items-center justify-center`}><p className="text-2xl font-bold" style={{ color: settings.accentColor }}>{avgCompletion}%</p><p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.avgCompletion}</p></div>
                <div className={`${cardClass} p-3 text-center flex flex-col items-center justify-center`}><div className="flex items-center gap-1"><Star size={18} style={{ color: settings.accentColor }} /><p className="text-2xl font-bold" style={{ color: settings.accentColor }}>{perfectDays}</p></div><p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.perfectDays}</p></div>
              </div>
              <div className={`${cardClass} p-5 mb-5`}>
                <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-medium">{t.heatmap}</h3><span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>28 дней</span></div>
                <div className="grid grid-cols-7 gap-1.5">{heatmapData.map((day, i) => { let bgColor = isDark ? '#374151' : '#f3f4f6'; if (day.intensity === 1) bgColor = settings.accentColor + '40'; if (day.intensity === 2) bgColor = settings.accentColor + '70'; if (day.intensity === 3) bgColor = settings.accentColor + 'A0'; if (day.intensity === 4) bgColor = settings.accentColor; return <div key={i} title={day.date} className="aspect-square rounded-sm transition-all hover:scale-110" style={{ backgroundColor: bgColor }} />; })}</div>
                <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-gray-400"><span>{t.less}</span><div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }} /><div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: settings.accentColor + '70' }} /><div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: settings.accentColor }} /><span>{t.more}</span></div>
              </div>
              <div className={`${cardClass} p-5 mb-5`}><h3 className="text-sm font-medium mb-3">{t.tasksChart} — {t.last7Days}</h3><div className="w-full h-48"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f3f4f6'} /><XAxis dataKey="label" tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }} /><YAxis tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }} /><Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, borderRadius: '8px', fontSize: '12px', color: isDark ? '#f3f4f6' : '#111827' }} /><Line type="monotone" dataKey="completed" stroke={settings.accentColor} strokeWidth={2.5} dot={{ r: 4, fill: settings.accentColor }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div></div>
              <div className={`${cardClass} p-5`}><h3 className="text-sm font-medium mb-3">{t.habitPie}</h3>{pieData.length === 0 ? <p className={`text-center py-8 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t.noHabits}</p> : <div className="w-full h-48"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>{pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}</Pie><Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, borderRadius: '8px', fontSize: '12px', color: isDark ? '#f3f4f6' : '#111827' }} /><Legend wrapperStyle={{ fontSize: '12px' }} /></PieChart></ResponsiveContainer></div>}</div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {activeTab !== 'stats' && (
        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={{ scale: 0.9 }} onClick={() => activeTab === 'tasks' ? openNewTaskModal() : openNewHabitModal()} className="fixed bottom-24 right-6 w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center z-40" style={{ backgroundColor: settings.accentColor }}><Plus size={26} /></motion.button>
      )}

      <div className={`fixed bottom-0 left-0 right-0 z-30 ${isDark ? 'bg-gray-800 border-t border-gray-700' : 'bg-white border-t border-gray-100'}`}>
        <div className="max-w-md mx-auto flex">
          {([ { key: 'tasks', icon: ListTodo, label: t.tasks }, { key: 'habits', icon: Flame, label: t.habits }, { key: 'stats', icon: BarChart3, label: t.stats } ] as const).map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setActiveTab(key)} className="flex-1 flex flex-col items-center py-3 relative transition-colors" style={{ color: activeTab === key ? settings.accentColor : (isDark ? '#9ca3af' : '#9ca3af') }}>
              {activeTab === key && <motion.div layoutId="navIndicator" className="absolute top-0 h-0.5 w-8 rounded-b" style={{ backgroundColor: settings.accentColor }} />}
              <Icon size={20} /><span className="text-xs mt-1">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showTaskModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowTaskModal(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className={`w-full max-w-md mx-auto rounded-t-3xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className="text-lg font-semibold mb-4">{editingTaskId ? t.editTask : t.newTask}</h3>
              <input autoFocus value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveTask()} placeholder={t.taskPlaceholder} className={`w-full px-4 py-3 rounded-xl outline-none mb-4 ${isDark ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 placeholder-gray-400'}`} />
              <div className="flex gap-3">
                {editingTaskId && <button onClick={() => { deleteTask(editingTaskId); setShowTaskModal(false); }} className={`px-4 py-3 rounded-xl font-medium flex items-center justify-center ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}><Trash2 size={20} /></button>}
                <button onClick={() => setShowTaskModal(false)} className={`flex-1 py-3 rounded-xl font-medium ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>{t.cancel}</button>
                <button onClick={saveTask} className="flex-1 py-3 rounded-xl font-medium text-white" style={{ backgroundColor: settings.accentColor }}>{editingTaskId ? t.save : t.add}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHabitModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowHabitModal(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className={`w-full max-w-md mx-auto rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className="text-lg font-semibold mb-4">{editingHabitId ? t.editHabit : t.newHabit}</h3>
              <input autoFocus value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} placeholder={t.habitPlaceholder} className={`w-full px-4 py-3 rounded-xl outline-none mb-4 ${isDark ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 placeholder-gray-400'}`} />
              <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.chooseIcon}</p>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {HABIT_ICONS.map((ic, i) => (
                  <button key={i} onClick={() => setNewHabitIcon(i)} className={`aspect-square rounded-xl bg-gradient-to-br ${ic.gradient} flex items-center justify-center text-2xl transition-all ${newHabitIcon === i ? 'ring-2 ring-offset-2 scale-105' : 'opacity-70'}`} style={{ '--tw-ring-color': settings.accentColor, '--tw-ring-offset-color': isDark ? '#1f2937' : '#ffffff' } as React.CSSProperties}>{ic.emoji}</button>
                ))}
              </div>
              <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.schedule}</p>
              <div className="flex gap-1 mb-4">
                {t.daysShort.map((day, i) => (
                  <button key={i} onClick={() => { const nd = [...newHabitDays]; nd[i] = !nd[i]; setNewHabitDays(nd); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${newHabitDays[i] ? 'text-white' : (isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500')}`} style={{ backgroundColor: newHabitDays[i] ? settings.accentColor : undefined }}>{day}</button>
                ))}
              </div>
              <p className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{newHabitDays.every(Boolean) ? t.everyDay : ''}</p>
              <div className="flex gap-3">
                {editingHabitId && <button onClick={() => deleteHabit(editingHabitId)} className={`px-4 py-3 rounded-xl font-medium flex items-center justify-center ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}><Trash2 size={20} /></button>}
                <button onClick={() => setShowHabitModal(false)} className={`flex-1 py-3 rounded-xl font-medium ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>{t.cancel}</button>
                <button onClick={saveHabit} className="flex-1 py-3 rounded-xl font-medium text-white" style={{ backgroundColor: settings.accentColor }}>{editingHabitId ? t.save : t.add}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowSettings(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className={`w-full max-w-md mx-auto rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">{t.settings}</h3><button onClick={() => setShowSettings(false)} className={isDark ? 'text-gray-400' : 'text-gray-500'}><X size={20} /></button></div>
              <div className="mb-4"><label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}><User size={16} /> {t.yourName}</label><input value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} className={`w-full px-4 py-2.5 rounded-xl outline-none ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100'}`} /></div>
              <div className="mb-4"><label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}><Globe size={16} /> {t.language}</label><div className="flex gap-2">{(['en', 'ru'] as const).map((lang) => <button key={lang} onClick={() => updateSettings({ language: lang })} className={`flex-1 py-2 rounded-xl text-sm font-medium transition`} style={{ backgroundColor: settings.language === lang ? settings.accentColor : (isDark ? '#374151' : '#f3f4f6'), color: settings.language === lang ? '#fff' : (isDark ? '#e5e7eb' : '#374151') }}>{lang === 'en' ? 'English' : 'Русский'}</button>)}</div></div>
              <div className="mb-4"><label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}><Palette size={16} /> {t.theme}</label><div className="flex gap-2">{[{ key: 'light', label: t.light }, { key: 'dark', label: t.dark }, { key: 'system', label: t.system }].map(({ key, label }) => <button key={key} onClick={() => updateSettings({ theme: key as any })} className="flex-1 py-2 rounded-xl text-sm font-medium transition" style={{ backgroundColor: settings.theme === key ? settings.accentColor : (isDark ? '#374151' : '#f3f4f6'), color: settings.theme === key ? '#fff' : (isDark ? '#e5e7eb' : '#374151') }}>{label}</button>)}</div></div>
              <div className="mb-4"><label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}><Palette size={16} /> {t.accentColor}</label><div className="flex flex-wrap gap-2">{ACCENT_COLORS.map((c) => <button key={c.value} onClick={() => updateSettings({ accentColor: c.value })} className="w-9 h-9 rounded-full transition-transform hover:scale-110" style={{ backgroundColor: c.value, outline: settings.accentColor === c.value ? `2px solid ${c.value}` : 'none', outlineOffset: '2px' }} />)}</div></div>
              <div className="mb-4"><label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}><Type size={16} /> {t.fontSize}</label><div className="flex gap-2">{[{ key: 'small', label: t.small }, { key: 'medium', label: t.medium }, { key: 'large', label: t.large }].map(({ key, label }) => <button key={key} onClick={() => updateSettings({ fontSize: key as any })} className="flex-1 py-2 rounded-xl text-sm font-medium transition" style={{ backgroundColor: settings.fontSize === key ? settings.accentColor : (isDark ? '#374151' : '#f3f4f6'), color: settings.fontSize === key ? '#fff' : (isDark ? '#e5e7eb' : '#374151') }}>{label}</button>)}</div></div>
              <div className="mb-4"><label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}><Calendar size={16} /> {t.dateFormat}</label><div className="flex gap-2">{[{ key: 'short', label: t.short }, { key: 'medium', label: t.medium }, { key: 'long', label: t.long }].map(({ key, label }) => <button key={key} onClick={() => updateSettings({ dateFormat: key as any })} className="flex-1 py-2 rounded-xl text-sm font-medium transition" style={{ backgroundColor: settings.dateFormat === key ? settings.accentColor : (isDark ? '#374151' : '#f3f4f6'), color: settings.dateFormat === key ? '#fff' : (isDark ? '#e5e7eb' : '#374151') }}>{label}</button>)}</div></div>
              <div className="mb-4 flex items-center justify-between"><label className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}><Volume2 size={16} /> {t.sounds}</label><button onClick={() => updateSettings({ sounds: !settings.sounds })} className="w-12 h-6 rounded-full relative transition-colors" style={{ backgroundColor: settings.sounds ? settings.accentColor : (isDark ? '#4b5563' : '#d1d5db') }}><motion.div layout className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow" style={{ left: settings.sounds ? 'calc(100% - 22px)' : '2px' }} /></button></div>
              <div className="mb-4 flex items-center justify-between"><label className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}><Sparkles size={16} /> {t.animations}</label><button onClick={() => updateSettings({ animations: !settings.animations })} className="w-12 h-6 rounded-full relative transition-colors" style={{ backgroundColor: settings.animations ? settings.accentColor : (isDark ? '#4b5563' : '#d1d5db') }}><motion.div layout className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow" style={{ left: settings.animations ? 'calc(100% - 22px)' : '2px' }} /></button></div>
              
              <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Bell size={16}/> {t.reminders}</h4>
                <div className="flex items-center justify-between mb-2"><span className="text-sm">{t.reminderTime}</span><input type="time" value={settings.reminderTime} onChange={(e) => setSettings({...settings, reminderTime: e.target.value})} className={`px-2 py-1 rounded ${isDark ? 'bg-gray-600 text-white' : 'bg-white border'}`} /></div>
                <button onClick={requestNotificationPermission} className="w-full py-2 rounded-xl text-sm font-medium text-white mt-2" style={{ backgroundColor: settings.accentColor }}>{t.enableReminders}</button>
              </div>

              <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}><h4 className="text-sm font-medium mb-3">{t.backup}</h4><div className="flex gap-2"><button onClick={() => { const data = { tasks, habits, settings, history }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `planner-backup-${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url); showToast(settings.language === 'ru' ? 'Файл сохранен!' : 'File saved!'); }} className={`flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}><Download size={16} /> {t.exportData.split(' ')[0]}</button><button onClick={() => fileInputRef.current?.click()} className={`flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}><Upload size={16} /> {t.importData.split(' ')[0]}</button></div><input type="file" accept=".json" ref={fileInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { try { const content = ev.target?.result as string; const data = JSON.parse(content); if (data.tasks && data.habits && data.settings) { setTasks(data.tasks); setHabits(data.habits); setSettings({ ...DEFAULT_SETTINGS, ...data.settings }); if (data.history) setHistory(data.history); showToast(settings.language === 'ru' ? 'Данные загружены!' : 'Data loaded!'); } else { showToast('Invalid file format'); } } catch (err) { showToast('Error reading file'); } }; reader.readAsText(file); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="hidden" /></div>
              <button onClick={() => setShowResetConfirm(true)} className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}><RotateCcw size={16} /> {t.resetAll}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResetConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-6" onClick={() => setShowResetConfirm(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className={`w-full max-w-sm rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className="font-semibold mb-2">{t.resetAll}</h3><p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.resetConfirm}</p>
              <div className="flex gap-3"><button onClick={() => setShowResetConfirm(false)} className={`flex-1 py-2.5 rounded-xl font-medium ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>{t.cancel}</button><button onClick={() => { localStorage.clear(); setTasks([]); setHabits([]); setHistory([]); setSettings(DEFAULT_SETTINGS); setShowResetConfirm(false); setShowSettings(false); }} className="flex-1 py-2.5 rounded-xl font-medium bg-red-500 text-white">{t.confirm}</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg" style={{ backgroundColor: settings.accentColor }}>{toast}</motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}