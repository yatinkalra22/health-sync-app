'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard,
  FilePlus,
  Activity,
  Shield,
  Zap,
  Menu,
  X,
  Database,
  Bot,
  FlaskConical,
  Globe,
} from 'lucide-react';
import logo from '@/app/assets/images/logo.png';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/new', label: 'New PA Request', icon: FilePlus },
  { href: '/analytics', label: 'Analytics', icon: Activity },
];

const secondaryItems = [
  { href: '/agents', label: 'Agent Monitor', icon: Zap },
  { href: '/audit', label: 'Audit Log', icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [mockMode, setMockMode] = useState<{ mock_mode: boolean; reason: string; services: { elasticsearch: boolean; ai: boolean; fhir: boolean } } | null>(null);

  // Fetch mock mode status
  useEffect(() => {
    fetch('/api/mock-mode')
      .then(res => res.json())
      .then(setMockMode)
      .catch(() => setMockMode({ mock_mode: true, reason: 'Unable to detect', services: { elasticsearch: false, ai: false, fhir: false } }));
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile sidebar open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="relative py-4 px-3 border-b border-slate-700/50 flex items-center">
        <Link href="/" className="group flex items-center gap-1.5">
          <Image
            src={logo}
            alt="HealthSync APP"
            width={80}
            height={80}
            className="group-hover:opacity-85 transition-opacity drop-shadow-md shrink-0"
            style={{ objectFit: 'contain' }}
          />
          <div className="flex flex-col justify-center">
            <h1 className="text-lg font-bold tracking-tight leading-tight">HealthSync</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase leading-tight mt-0.5">AI Platform</p>
          </div>
        </Link>
        {/* Close button - mobile only, absolute top-right */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold px-3 mb-3">
          Main
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-blue-500/15 text-blue-400 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              )}
            >
              <item.icon className={cn('w-[18px] h-[18px]', isActive && 'text-blue-400')} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </Link>
          );
        })}

        <div className="pt-6">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold px-3 mb-3">
            System
          </p>
          {secondaryItems.map((item) => {
            const isSecActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isSecActive
                    ? 'bg-blue-500/15 text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                )}
              >
                <item.icon className="w-[18px] h-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Status indicator */}
      <div className="p-4 border-t border-slate-700/50 space-y-3">
        {/* Mock / Production Mode Indicator */}
        <div className={cn(
          'rounded-lg p-3 border transition-colors',
          mockMode?.mock_mode
            ? 'bg-amber-500/5 border-amber-500/20'
            : 'bg-emerald-500/5 border-emerald-500/20'
        )}>
          <div className="flex items-center gap-2 mb-1.5">
            {mockMode?.mock_mode ? (
              <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className={cn(
              'text-xs font-semibold',
              mockMode?.mock_mode ? 'text-amber-400' : 'text-emerald-400'
            )}>
              {mockMode?.mock_mode ? 'Mock Mode' : 'Production Mode'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
            {mockMode?.mock_mode
              ? 'Using in-memory demo data. No external services required.'
              : 'Connected to live Elasticsearch and AI services.'}
          </p>
          <div className="flex flex-wrap gap-1">
            <span className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium',
              mockMode?.services.elasticsearch
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-slate-700/50 text-slate-500'
            )}>
              <div className={cn('w-1 h-1 rounded-full', mockMode?.services.elasticsearch ? 'bg-emerald-400' : 'bg-slate-600')} />
              ES
            </span>
            <span className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium',
              mockMode?.services.ai
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-slate-700/50 text-slate-500'
            )}>
              <div className={cn('w-1 h-1 rounded-full', mockMode?.services.ai ? 'bg-emerald-400' : 'bg-slate-600')} />
              AI
            </span>
            <span className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium',
              mockMode?.services.fhir
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-slate-700/50 text-slate-500'
            )}>
              <div className={cn('w-1 h-1 rounded-full', mockMode?.services.fhir ? 'bg-emerald-400' : 'bg-slate-600')} />
              FHIR
            </span>
          </div>
        </div>

        <div className="rounded-lg p-3 bg-slate-800/80 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-200">System Active</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-300">
            <span>Agents: 5 ready</span>
            <span className="font-medium">{mockMode?.mock_mode ? 'Mock Data' : 'Live Data'}</span>
          </div>
        </div>

        {/* Tech Stack Badges */}
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-semibold text-yellow-400">
            <Database className="w-3 h-3" />
            ES|QL
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] font-semibold text-blue-400">
            <Bot className="w-3 h-3" />
            Gemini AI
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-semibold text-cyan-400">
            <Zap className="w-3 h-3" />
            FHIR R4
          </span>
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 px-0.5">
          <span>8 ES|QL Indices</span>
          <span>5 AI Agents</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-sm text-white flex items-center justify-between px-4 shadow-lg border-b border-slate-700/50" style={{ height: '56px' }}>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <Image
            src={logo}
            alt="HealthSync APP"
            width={120}
            height={38}
            style={{ objectFit: 'contain' }}
          />
        </Link>
        <div className="w-9 shrink-0" />
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - desktop: fixed, mobile: slide-in drawer */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen w-64 bg-slate-900 text-white flex flex-col z-50 transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
