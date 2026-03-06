/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Sparkles, 
  MessageSquare, 
  Calendar, 
  Users, 
  Send, 
  Plus, 
  History,
  Menu,
  X,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Bell,
  Share2,
  Zap,
  LayoutDashboard,
  Settings,
  LogOut,
  Search,
  ArrowUpRight,
  AlertTriangle,
  Database,
  Save,
  Loader2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Message, TASK_TYPES, SYSTEM_INSTRUCTION, TaskType } from './constants';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [aiKnowledge, setAiKnowledge] = useState<string[]>([]);
  const [googleSheetData, setGoogleSheetData] = useState<any>(null);
  const [isMemoryLoading, setIsMemoryLoading] = useState(false);
  const [isSheetLoading, setIsSheetLoading] = useState(false);
  const [isSaving, setIsSaving] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadKnowledge();
    loadGoogleSheetData();
  }, []);

  const loadGoogleSheetData = async () => {
    setIsSheetLoading(true);
    try {
      const res = await fetch("https://script.google.com/macros/s/AKfycbwPcCkjNETO_qzS5pYdZfTWE1c_nkLOsnbXxZlHBe6r81r5on2t47qKG_kUUDakb9Bk/exec");
      const data = await res.json();
      setGoogleSheetData(data);
    } catch (e) {
      console.error("Google Sheet loading error:", e);
    } finally {
      setIsSheetLoading(false);
    }
  };

  const loadKnowledge = async () => {
    setIsMemoryLoading(true);
    try {
      const res = await fetch("/api/github/knowledge");
      const data = await res.json();
      setAiKnowledge(data.knowledge || []);
    } catch (e) {
      console.error("Knowledge loading error:", e);
    } finally {
      setIsMemoryLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const enhancedInstruction = `Bạn là Trợ lý Bí thư Đảng ủy.
      
      ${SYSTEM_INSTRUCTION}
      
      Kiến thức và quy tắc từ bộ nhớ AI (Knowledge Base):
      ${aiKnowledge.length > 0 ? aiKnowledge.map((k, i) => `${i + 1}. ${k}`).join('\n') : "Chưa có dữ liệu kiến thức đặc thù."}
      
      Dữ liệu từ hệ thống quản lý (Google Sheet):
      ${googleSheetData ? JSON.stringify(googleSheetData) : "Đang tải dữ liệu hoặc không có dữ liệu."}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          ...messages.map(m => ({
            role: m.role,
            parts: [{ text: m.content }]
          })),
          { role: 'user', parts: [{ text: `Câu hỏi:\n${text}` }] }
        ],
        config: {
          systemInstruction: enhancedInstruction,
        },
      });

      const modelMessage: Message = {
        role: 'model',
        content: response.text || "Xin lỗi, tôi không thể xử lý yêu cầu này lúc này.",
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, {
        role: 'model',
        content: "Đã xảy ra lỗi khi kết nối với hệ thống. Vui lòng thử lại sau.",
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
      setSelectedTask(null);
    }
  };

  const handleTaskClick = (task: TaskType) => {
    setSelectedTask(task);
    setInput(task.promptPrefix);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
    inputRef.current?.focus();
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareToZalo = (text: string) => {
    const summary = text.length > 200 ? text.substring(0, 200) + "..." : text;
    const zaloText = `[THAM MƯU ĐẢNG ỦY] - Nội dung: ${summary}`;
    navigator.clipboard.writeText(zaloText);
    alert("Đã tối ưu nội dung và sao chép để gửi qua Zalo cho lãnh đạo!");
  };

  const saveToKnowledge = async (content: string, idx: number) => {
    setIsSaving(idx);
    try {
      const response = await fetch('/api/github/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Đã lưu thành công vào bộ nhớ GitHub!");
        loadKnowledge(); // Refresh knowledge
      } else {
        alert("Lỗi: " + (data.error || "Không thể lưu"));
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Đã xảy ra lỗi khi kết nối với máy chủ.");
    } finally {
      setIsSaving(null);
    }
  };

  const deleteKnowledge = async (index: number) => {
    if (!confirm("Đồng chí có chắc chắn muốn xóa kiến thức này?")) return;
    setIsDeleting(index);
    try {
      const response = await fetch('/api/github/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ index }),
      });

      const data = await response.json();
      if (data.success) {
        loadKnowledge();
      } else {
        alert("Lỗi: " + (data.error || "Không thể xóa"));
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Đã xảy ra lỗi khi kết nối với máy chủ.");
    } finally {
      setIsDeleting(null);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileText': return <FileText size={18} />;
      case 'Sparkles': return <Sparkles size={18} />;
      case 'MessageSquare': return <MessageSquare size={18} />;
      case 'Calendar': return <Calendar size={18} />;
      case 'Users': return <Users size={18} />;
      case 'TrendingUp': return <TrendingUp size={18} />;
      case 'Bell': return <Bell size={18} />;
      case 'AlertTriangle': return <AlertTriangle size={18} />;
      default: return <FileText size={18} />;
    }
  };

  return (
    <div className="flex h-screen bg-brand-primary text-slate-300 overflow-hidden font-sans data-grid">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-slate-950/80 backdrop-blur-2xl border-r border-white/5 transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          !isSidebarOpen && "-translate-x-full md:hidden"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 animate-pulse-subtle">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="font-bold text-white leading-tight tracking-tight">TRUNG TÂM ĐIỀU HÀNH</h1>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">TRỢ LÝ THAM MƯU v3.0</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input 
                type="text" 
                placeholder="Search protocols..."
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-3 space-y-6">
            <div className="space-y-1">
              <button 
                onClick={() => { setMessages([]); setShowDashboard(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 group"
              >
                <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                <span className="font-semibold text-sm">Hội thoại mới</span>
              </button>
              
              <button 
                onClick={() => setShowDashboard(!showDashboard)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all",
                  showDashboard ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white"
                )}
              >
                <LayoutDashboard size={18} />
                <span className="font-medium text-sm">Bảng điều khiển</span>
              </button>

              <div className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all border",
                googleSheetData ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" : "border-white/5 bg-white/5 text-slate-500"
              )}>
                <ArrowUpRight size={18} className={cn(isSheetLoading && "animate-spin")} />
                <span className="font-medium text-sm">
                  {isSheetLoading ? "Đang tải Sheet..." : googleSheetData ? "Sheet: Đã kết nối" : "Sheet: Lỗi kết nối"}
                </span>
              </div>
            </div>

            <div>
              <h2 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Nhiệm vụ trọng tâm</h2>
              <div className="space-y-0.5">
                {TASK_TYPES.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all group",
                      selectedTask?.id === task.id 
                        ? "bg-white/10 text-white" 
                        : "hover:bg-white/5 text-slate-500 hover:text-slate-200"
                    )}
                  >
                    <div className={cn(
                      "transition-colors",
                      selectedTask?.id === task.id ? "text-blue-500" : "group-hover:text-blue-500"
                    )}>
                      {getIcon(task.icon)}
                    </div>
                    <span className="font-medium text-sm truncate">{task.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="p-4 bg-black/20 border-t border-white/5">
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-xs">
                MH
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">Nguyễn Minh Huy</p>
                <p className="text-[10px] text-slate-500 truncate">Chánh Văn phòng Đảng uỷ</p>
              </div>
              <button className="text-slate-600 hover:text-slate-400">
                <Settings size={14} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-brand-primary">
        {/* Header */}
        <header className="h-16 bg-slate-950/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg text-slate-500 md:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">GIAO DIỆN ĐIỀU HÀNH</span>
              <ChevronRight size={14} className="text-slate-700" />
              <span className="text-xs text-slate-500 font-mono">
                {showDashboard ? "TỔNG_QUAN" : messages.length === 0 ? "KHỞI_TẠO" : "ĐANG_XỬ_LÝ"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <Zap size={14} className="fill-blue-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Kết nối Neural Link</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {showDashboard ? (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-7xl mx-auto p-8 space-y-8"
              >
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-4xl font-bold text-white tracking-tighter">TRUNG TÂM ĐIỀU HÀNH</h2>
                    <p className="text-slate-500 mt-1 font-mono text-xs">TRẠNG_THÁI: TỐI_ƯU | HOẠT_ĐỘNG: 99.9% | ĐỒNG_BỘ: ĐANG_CHẠY</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">Xuất Nhật ký</button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-500">Đồng bộ Core</button>
                  </div>
                </div>

                {/* Bento Grid Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-2 p-6 glass-panel group hover:border-blue-500/30 transition-all">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center border border-blue-500/20">
                        <Zap size={24} />
                      </div>
                      <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-md tracking-tighter">+12.4% EFFICIENCY</span>
                    </div>
                    <h3 className="text-4xl font-bold text-white tracking-tighter">94.2%</h3>
                    <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Neural Network Alignment</p>
                    <div className="mt-6 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[94.2%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    </div>
                  </div>

                  <div className="p-6 glass-panel hover:border-blue-500/30 transition-all">
                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-500/20 mb-4">
                      <Users size={20} />
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tighter">STABLE</h3>
                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">User Sentiment</p>
                    <div className="mt-4 flex items-center gap-1 text-emerald-500 font-bold text-[10px]">
                      <ArrowUpRight size={14} />
                      <span className="tracking-widest">POSITIVE_TREND</span>
                    </div>
                  </div>

                  <div className="p-6 glass-panel hover:border-blue-500/30 transition-all">
                    <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20 mb-4">
                      <Bell size={20} />
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tighter">04</h3>
                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Pending Protocols</p>
                    <div className="mt-4 text-amber-500 font-bold text-[10px] tracking-widest animate-pulse">URGENT_ACTION_REQUIRED</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 p-8 glass-panel border-blue-500/20 relative overflow-hidden group">
                    <div className="absolute -right-20 -bottom-20 opacity-5 group-hover:scale-110 transition-transform duration-700 text-blue-500">
                      <TrendingUp size={400} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="px-2 py-1 bg-blue-600 text-[10px] font-bold uppercase tracking-widest rounded">AI_FORECAST</div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Strategic Objectives Q2_2026</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-all">
                          <p className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-widest">Protocol Alpha</p>
                          <p className="text-[11px] text-slate-400 leading-relaxed">Systematic review of organizational hierarchy. Optimization required by 15/04.</p>
                        </div>
                        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-all">
                          <p className="text-xs font-bold text-emerald-400 mb-2 uppercase tracking-widest">Protocol Beta</p>
                          <p className="text-[11px] text-slate-400 leading-relaxed">Neural link training for 100% of new personnel. Target saturation 98%.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setShowDashboard(false); handleTaskClick(TASK_TYPES.find(t => t.id === 'forecast')!); }}
                        className="mt-8 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20"
                      >
                        Detailed Analysis
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="p-8 glass-panel">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center justify-between uppercase tracking-widest">
                      Knowledge Core
                      <button 
                        onClick={loadKnowledge}
                        className="p-2 hover:bg-white/5 rounded-lg text-slate-500"
                        title="Sync Core"
                      >
                        <History size={16} className={isMemoryLoading ? "animate-spin" : ""} />
                      </button>
                    </h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {aiKnowledge.length === 0 ? (
                        <p className="text-xs text-slate-600 italic text-center py-4">Core memory empty.</p>
                      ) : (
                        aiKnowledge.map((k, i) => (
                          <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 group relative hover:border-blue-500/20 transition-all">
                            <p className="text-[11px] text-slate-400 leading-relaxed">{k}</p>
                            <button 
                              onClick={() => deleteKnowledge(i)}
                              disabled={isDeleting === i}
                              className="absolute top-2 right-2 p-1.5 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              {isDeleting === i ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="p-8 glass-panel">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
                      <AlertTriangle size={18} className="text-amber-500" />
                      Risk Mitigation
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Communication Protocol</p>
                        <p className="text-[11px] text-slate-600 italic">"Detected inconsistencies in administrative terminology..."</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Procedural Sequence</p>
                        <p className="text-[11px] text-slate-600 italic">"Potential bottleneck in personnel onboarding sequence..."</p>
                      </div>
                      <button 
                        onClick={() => { setShowDashboard(false); handleTaskClick(TASK_TYPES.find(t => t.id === 'mistakes')!); }}
                        className="w-full py-2.5 text-[10px] font-bold text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500/5 transition-all uppercase tracking-widest"
                      >
                        Update Risk Log
                      </button>
                    </div>
                  </div>

                  <div className="p-8 glass-panel">
                    <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">System Notifications</h3>
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex gap-4 group cursor-pointer">
                          <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-600 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
                            <FileText size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate group-hover:text-blue-500 transition-colors">Directive_0{i}_NQ_DU.sys</p>
                            <p className="text-[10px] text-slate-600 mt-0.5 font-mono">TIMESTAMP: 08:30:00</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : messages.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center max-w-5xl mx-auto p-8 text-center"
              >
                <div className="w-24 h-24 bg-blue-600/10 border border-blue-600/20 rounded-[2.5rem] flex items-center justify-center text-blue-500 shadow-2xl shadow-blue-500/10 mb-10 animate-pulse-subtle">
                  <ShieldCheck size={48} />
                </div>
                <h2 className="text-5xl font-bold text-white tracking-tighter mb-4">HỆ THỐNG SẴN SÀNG</h2>
                <p className="text-slate-500 text-lg max-w-xl mx-auto mb-12 font-medium">
                  Kết nối Neural Link đã thiết lập. Đang chờ tham số nhiệm vụ để tối ưu hóa chiến lược.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                  {TASK_TYPES.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className="p-6 glass-panel text-left hover:border-blue-500/50 hover:bg-white/5 transition-all group relative overflow-hidden"
                    >
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-blue-500/10 group-hover:text-blue-500 mb-4 transition-colors">
                        {getIcon(task.icon)}
                      </div>
                      <h3 className="font-bold text-white text-sm mb-1 flex items-center gap-2 uppercase tracking-widest">
                        {task.label}
                        {['forecast', 'reminder'].includes(task.id) && (
                          <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[8px] font-bold uppercase rounded-md border border-blue-500/20">ADVANCED</span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{task.description}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="max-w-4xl mx-auto p-8 space-y-10 pb-32">
                {messages.map((msg, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "flex gap-6",
                      msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-lg border",
                      msg.role === 'user' 
                        ? "bg-slate-800 text-white border-white/10" 
                        : "bg-blue-600 text-white border-blue-400/30 shadow-blue-600/20"
                    )}>
                      {msg.role === 'user' ? 'USR' : <ShieldCheck size={20} />}
                    </div>
                    
                    <div className={cn(
                      "flex flex-col max-w-[85%]",
                      msg.role === 'user' ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "px-6 py-4 rounded-2xl shadow-xl relative group backdrop-blur-md border",
                        msg.role === 'user' 
                          ? "bg-slate-800/80 text-white border-white/10 rounded-tr-none" 
                          : "bg-slate-900/80 border-white/5 text-slate-200 rounded-tl-none"
                      )}>
                        {msg.role === 'model' ? (
                          <div className="markdown-body">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                            <div className="absolute -right-14 top-0 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                              <button 
                                onClick={() => copyToClipboard(msg.content, idx)}
                                className="p-2.5 text-slate-400 hover:text-white bg-slate-800 border border-white/10 rounded-xl shadow-2xl hover:bg-slate-700 transition-all"
                                title="Copy Protocol"
                              >
                                {copiedId === idx ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                              </button>
                              <button 
                                onClick={() => saveToKnowledge(msg.content, idx)}
                                disabled={isSaving !== null}
                                className={cn(
                                  "p-2.5 bg-slate-800 border border-white/10 rounded-xl shadow-2xl transition-all",
                                  isSaving === idx ? "text-slate-600" : "text-blue-400 hover:text-blue-300 hover:bg-slate-700"
                                )}
                                title="Sync to Core"
                              >
                                {isSaving === idx ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-600 mt-2 font-mono uppercase tracking-widest">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex gap-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 border border-blue-400/30">
                      <ShieldCheck size={20} />
                    </div>
                    <div className="bg-slate-900/80 border border-white/5 px-6 py-4 rounded-2xl rounded-tl-none flex items-center gap-3 backdrop-blur-md">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                      </div>
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">Processing Neural Link</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        {!showDashboard && (
          <div className="p-6 bg-slate-950/80 backdrop-blur-2xl border-t border-white/5 sticky bottom-0 z-40">
            <div className="max-w-4xl mx-auto">
              <div className="relative group">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Input mission parameters..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all shadow-inner text-sm min-h-[60px] max-h-[200px] text-slate-200 placeholder:text-slate-600 font-mono"
                  rows={1}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "absolute right-3 bottom-3 p-3 rounded-xl transition-all shadow-lg",
                    input.trim() && !isLoading 
                      ? "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20" 
                      : "bg-white/5 text-slate-700 cursor-not-allowed border border-white/5"
                  )}
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] font-mono">
                  Neural_Link: ESTABLISHED | Encryption: AES-256
                </p>
                <div className="flex gap-4">
                  <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">Shift + Enter for multiline</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
