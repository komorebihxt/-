/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, RefreshCw, Share2, Info, Droplets, Activity, Sun, Moon, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';
import { AppState, AnalysisResult } from './types';
import { analyzeInput, generateArtToyImage } from './services/geminiService';

export default function App() {
  const posterRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('poop_history');
    return {
      view: 'home',
      inputs: {
        food: '',
        drink: '',
        sleep: '',
        location: '',
      },
      history: saved ? JSON.parse(saved) : [],
    };
  });

  const handleStart = async () => {
    const combinedText = [
      state.inputs.food && `食物: ${state.inputs.food}`,
      state.inputs.drink && `饮品: ${state.inputs.drink}`,
      state.inputs.sleep && `睡眠: ${state.inputs.sleep}`,
      state.inputs.location && `位置: ${state.inputs.location}`
    ].filter(Boolean).join('; ');

    if (!state.inputs.food.trim() && !state.inputs.drink.trim()) return;

    // Save to history
    const newHistory = [combinedText, ...state.history.filter(h => h !== combinedText)].slice(0, 10);
    localStorage.setItem('poop_history', JSON.stringify(newHistory));
    
    setState(prev => ({ ...prev, view: 'analyzing', history: newHistory, error: undefined }));

    try {
      const result = await analyzeInput(combinedText);
      setState(prev => ({ ...prev, view: 'result', result, imageUrl: undefined }));

      try {
        const imageUrl = await generateArtToyImage(result);
        setState(prev => ({ ...prev, imageUrl }));
      } catch (imgErr) {
        console.error("Image generation failed:", imgErr);
      }
    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, view: 'home', error: '分析失败，请检查网络或重试。' }));
    }
  };

  const handleExport = async () => {
    if (!posterRef.current || isExporting) return;
    
    setIsExporting(true);
    try {
      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        backgroundColor: '#f5f2ed',
        pixelRatio: 2,
      });
      
      const link = document.createElement('a');
      link.download = `便便主理人-艺术海报-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d4a373', '#2d1b14', '#f5f2ed']
      });
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setState(prev => ({
      ...prev,
      view: 'home',
      inputs: {
        food: '',
        drink: '',
        sleep: '',
        location: '',
      }
    }));
  };

  const loadHistory = (text: string) => {
    const parts = text.split('; ');
    const newInputs = { food: '', drink: '', sleep: '', location: '' };
    parts.forEach(p => {
      if (p.startsWith('食物: ')) newInputs.food = p.replace('食物: ', '');
      if (p.startsWith('饮品: ')) newInputs.drink = p.replace('饮品: ', '');
      if (p.startsWith('睡眠: ')) newInputs.sleep = p.replace('睡眠: ', '');
      if (p.startsWith('位置: ')) newInputs.location = p.replace('位置: ', '');
    });
    setState(prev => ({ ...prev, inputs: newInputs }));
  };

  const isInputValid = state.inputs.food.trim() || state.inputs.drink.trim();
  
  // Logical search: check if any of the typed words (2+ chars) exist in history
  const activeInput = Object.values(state.inputs).find(v => (v as string).trim().length >= 2) as string | undefined;
  const filteredHistory = activeInput 
    ? state.history.filter(h => h.includes(activeInput)) 
    : [];

  return (
    <div className="min-h-screen bg-paper text-dark font-sans selection:bg-brand selection:text-white flex flex-col overflow-x-hidden">
      <AnimatePresence mode="wait">
        {state.view === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 max-w-5xl mx-auto px-6 py-20 flex flex-col items-center text-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-12"
            >
              <div className="w-24 h-24 bg-dark rounded-full flex items-center justify-center mb-10 mx-auto shadow-2xl relative">
                <span className="text-4xl">💩</span>
                <div className="absolute -inset-2 border border-brand rounded-full animate-[spin_10s_linear_infinite]" />
              </div>
              <h1 className="text-7xl md:text-9xl font-cute tracking-tight mb-6 leading-none">
                便便<br />
                <span className="text-brand">主理人</span>
              </h1>
              <p className="font-mono text-xs uppercase tracking-[0.3em] opacity-50">BY POOP ART LAB v2.0</p>
            </motion.div>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative">
              {[
                { id: 'food', label: 'Food / 食物', placeholder: '火锅、鸡腿、沙拉...', icon: '🍱' },
                { id: 'drink', label: 'Drink / 饮品', placeholder: '冰可乐、美式、酒...', icon: '🥤' },
                { id: 'sleep', label: 'Sleep / 睡眠', placeholder: '凌晨4点睡、睡得很香...', icon: '🌙' },
                { id: 'location', label: 'Location / 地理位置', placeholder: '北京、深圳、佛山...', icon: '📍' },
              ].map((input) => (
                <div key={input.id} className="bg-white/40 backdrop-blur-md rounded-[2rem] p-6 shadow-sm flex flex-col items-start transition-all focus-within:shadow-md focus-within:bg-white/60">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{input.icon}</span>
                    <label className="font-sans text-[14px] font-bold uppercase tracking-[0.1em] text-brand">
                      {input.label}
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    value={(state.inputs as any)[input.id]}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      inputs: { ...prev.inputs, [input.id]: e.target.value }
                    }))}
                    placeholder={input.placeholder}
                    className="w-full bg-transparent border border-brand/20 rounded-2xl focus:border-yellow-500 focus:outline-none focus:ring-0 text-[14px] font-sans placeholder:text-gray-300 caret-brand pl-[3px] py-1.5 resize-none overflow-y-auto scrollbar-hide transition-colors"
                  />
                </div>
              ))}
            </div>

            {/* Smart History Dropdown/List */}
            <AnimatePresence>
              {filteredHistory.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-4xl mb-10 overflow-hidden"
                >
                  <div className="flex items-center gap-3 mb-4 px-4">
                    <div className="h-px flex-1 bg-brand/20" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-brand font-bold">历史匹配信号</span>
                    <div className="h-px flex-1 bg-brand/20" />
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    {filteredHistory.map((h, i) => (
                      <button
                        key={i}
                        onClick={() => loadHistory(h)}
                        className="px-6 py-3 bg-white/60 backdrop-blur-md rounded-2xl text-[13px] font-sans text-dark/70 hover:text-dark hover:bg-white hover:shadow-xl transition-all border border-white/50 flex items-center gap-3 group"
                      >
                        <RefreshCw className="w-3 h-3 text-brand opacity-0 group-hover:opacity-100 transition-opacity" />
                        {h.replace(/食物: |饮品: |睡眠: |位置: /g, '').slice(0, 30)}...
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-center w-full max-w-4xl">
              <button
                onClick={handleStart}
                disabled={!isInputValid}
                className="bg-dark text-white px-16 py-6 rounded-full font-bold text-lg tracking-widest flex items-center gap-3 hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed group shadow-2xl uppercase"
              >
                开始炼成 <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>

            {state.error && (
              <p className="mt-8 text-red-800 font-mono text-[10px] uppercase tracking-widest bg-red-50 px-6 py-3 rounded-full border border-red-100">
                Data Error: {state.error}
              </p>
            )}
          </motion.div>
        )}

        {state.view === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-paper flex flex-col items-center justify-center text-center p-6 overflow-hidden"
          >
            {/* Stage Light Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/10 rounded-full blur-[80px] animate-stage-light" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[100px] animate-stage-light" style={{ animationDelay: '1s' }} />
            
            <div className="relative">
              <div className="absolute -inset-32 border border-brand/20 rounded-full animate-pulse" />
              <div className="w-64 h-64 relative z-10 flex items-center justify-center">
                <motion.div
                  animate={{ 
                    y: [0, -60, 0],
                    scaleY: [1, 0.8, 1, 1.1, 1],
                    scaleX: [1, 1.1, 1, 0.9, 1],
                    rotate: [0, -5, 5, 0]
                  }}
                  transition={{ 
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-[12rem] filter drop-shadow-[0_20px_50px_rgba(45,27,20,0.4)]"
                >
                  💩
                </motion.div>
                <motion.div 
                  animate={{
                    scale: [0.8, 1.6, 0.8],
                    opacity: [0.1, 0.3, 0.1]
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -bottom-8 w-24 h-4 bg-dark rounded-full blur-xl"
                />
              </div>
            </div>
            <h2 className="text-6xl font-cute mt-32 mb-6 tracking-tighter">炼成中...</h2>
            <p className="font-mono text-[12px] uppercase tracking-[0.5em] text-brand">主理人正在进行生物分析</p>
          </motion.div>
        )}

        {state.view === 'result' && state.result && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-screen overflow-hidden"
            ref={posterRef}
          >
            {/* Theme Header */}
            <header className="p-8 pb-4 flex justify-between items-start z-10">
              <div>
                <button
                  onClick={handleReset}
                  className="group flex items-center gap-2 text-dark font-mono text-[10px] uppercase tracking-[0.2em] mb-4 hover:text-brand transition-colors"
                >
                  <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" /> 开启新篇章
                </button>
                <h1 className="text-4xl font-cute tracking-tight leading-none">
                  便便<br />
                  <span className="text-brand">主理人</span>
                </h1>
                <p className="font-mono text-[10px] mt-2 uppercase tracking-[0.2em] opacity-50">BY POOP ART LAB v2.0</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="bg-dark text-white px-4 py-1 text-xs font-bold font-mono tracking-widest text-center">认证主理人</div>
                <p className="text-[10px] font-mono mt-2 uppercase opacity-60">信号 ID: #3902-{Math.floor(Math.random()*9000)+1000}</p>
              </div>
            </header>

            {/* Main Stage */}
            <main className="flex-1 flex px-12 pb-12 gap-16 overflow-hidden">
              
              {/* Left: The Art Toy Display */}
              <div className="flex-[1.3] relative flex items-center justify-center">
                {/* Visual Section */}
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <div className="relative w-[500px] aspect-square group">
                    {/* The 3D Render Image - CIRCULAR FRAME */}
                    <div className="w-full h-full rounded-full bg-white p-3 shadow-[0_30px_60px_-15px_rgba(45,27,20,0.3)] overflow-hidden relative border-4 border-white">
                      {state.imageUrl ? (
                        <motion.img
                          initial={{ scale: 1.1, filter: 'blur(10px)' }}
                          animate={{ scale: 1, filter: 'blur(0px)' }}
                          src={state.imageUrl}
                          alt="艺术品渲染"
                          className="w-full h-full object-cover rounded-full transition-transform duration-1000 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 uppercase font-mono text-xs opacity-20 tracking-widest">
                          正在渲染...
                        </div>
                      )}
                      
                      {/* Gloss Overlay */}
                      <div className="absolute inset-0 gloss-shine opacity-10 pointer-events-none" />
                    </div>

                    {/* Charm Floaties as decorative tags - LARGER AND SAME FONT AS FEEDBACK */}
                    <div className="absolute -right-16 top-1/2 -translate-y-1/2 space-y-4">
                      {state.result.charms.map((charm, idx) => (
                        <motion.div
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.5 + idx * 0.1 }}
                          key={idx}
                          className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl toy-shadow font-sans text-sm font-bold border-2 border-brand/20 tracking-wide"
                        >
                          {charm}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Base / Platform Visualization */}
                  <div className="mt-12 w-64 h-1 bg-dark rounded-full opacity-20 blur-xl" />
                </div>
              </div>

              {/* Right: The Analysis Sidebar */}
              <div className="flex-1 flex flex-col justify-between py-6 max-w-sm">
                {/* Input Summary */}
                <div className="bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/60 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-brand" />
                  <h3 className="font-cute text-sm tracking-widest text-brand mb-6">便便の原料</h3>
                  <div className="space-y-3">
                    {state.inputs.food && <p className="font-sans text-sm leading-relaxed text-dark/80">🍱 {state.inputs.food}</p>}
                    {state.inputs.drink && <p className="font-sans text-sm leading-relaxed text-dark/80">🥤 {state.inputs.drink}</p>}
                    {state.inputs.sleep && <p className="font-sans text-sm leading-relaxed text-dark/80">🌙 {state.inputs.sleep}</p>}
                    {state.inputs.location && <p className="font-sans text-sm leading-relaxed text-dark/80">📍 {state.inputs.location}</p>}
                  </div>
                </div>

                {/* Physiological Parameters - CHINESE LABELS */}
                <div className="bg-dark/5 p-6 rounded-3xl border border-dark/5 space-y-6">
                  {[
                    { label: '流动性', value: state.result.fluidity },
                    { label: '坚固度', value: state.result.firmness },
                    { label: '光泽度', value: state.result.gloss },
                    { label: '暗沉值', value: state.result.dullness, isDanger: true },
                  ].map((p, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between font-cute text-sm tracking-widest mb-2">
                        <span className={p.isDanger ? 'text-red-900' : 'text-dark opacity-70'}>{p.label}</span>
                        <span className={p.isDanger ? 'text-red-900' : 'text-brand'}>{p.value}%</span>
                      </div>
                      <div className="w-full h-1 bg-dark/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${p.value}%` }}
                          transition={{ duration: 1.5, delay: 0.8 + idx * 0.1 }}
                          className={`h-full rounded-full ${p.isDanger ? 'bg-red-900' : 'bg-dark'}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Score & Critique */}
                <div className="flex gap-8 items-center bg-dark/5 p-6 rounded-3xl border border-dark/5">
                  <div className="w-24 h-24 rounded-full border-[6px] border-dark flex items-center justify-center flex-shrink-0 bg-white toy-shadow relative group">
                    {/* LIVELY SCORE FONT */}
                    <span className="text-4xl font-cute">{state.result.score}</span>
                    <div className="absolute -top-3 -right-2 bg-brand text-white text-[9px] font-mono px-2 py-1 rounded font-bold uppercase tracking-widest shadow-lg transform rotate-12">
                      评分
                    </div>
                  </div>
                  <div>
                    <p className={`font-cute text-sm tracking-widest ${state.result.score < 50 ? 'text-red-800' : 'text-green-800'}`}>
                      便便の简介
                    </p>
                    <p className="text-xs leading-relaxed opacity-70 mt-2">
                      {state.result.humorCopy}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <button 
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full py-6 bg-dark text-white rounded-full font-bold text-sm tracking-[0.2em] hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all toy-shadow uppercase flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {isExporting ? '导出中...' : '导出艺术展海报'}
                </button>
              </div>
            </main>

            {/* Footer / API Note */}
            <footer className="p-8 border-t border-brand/10 flex justify-between items-center bg-white/20 backdrop-blur-sm">
              <div className="flex gap-12">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-mono text-[9px] uppercase tracking-tighter opacity-60">Gemini 引擎已连接</span>
                </div>
                <p className="font-mono text-[9px] uppercase opacity-40 tracking-tighter hidden md:block">
                  数据架构: 生物信号解析系统 -{'>'} {'{'} 流动性, 坚固度, 光泽度, 暗沉值 {'}'}
                </p>
              </div>
              <div className="flex gap-6">
                {['𝕏', 'IG', 'WB'].map(social => (
                  <div key={social} className="w-10 h-10 rounded-xl bg-dark/5 flex items-center justify-center text-[10px] font-bold cursor-pointer hover:bg-brand hover:text-white transition-all transform hover:-translate-y-1">
                    {social}
                  </div>
                ))}
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

