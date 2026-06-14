"use client";

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

const AVATAR_OPTIONS = [
    "https://cdn.pixabay.com/photo/2022/10/21/20/29/wolf-head-7537918_1280.jpg",
    "https://cdn.pixabay.com/photo/2023/04/11/20/04/panda-7918134_1280.jpg",
    "https://cdn.pixabay.com/photo/2022/10/10/20/39/gnome-7512695_1280.jpg",
    "https://cdn.pixabay.com/photo/2022/11/06/19/48/panda-7574904_1280.jpg",
    "https://cdn.pixabay.com/photo/2022/12/18/02/07/fox-7662616_1280.jpg",
    "https://cdn.pixabay.com/photo/2022/12/04/00/01/owl-7633528_1280.png",
    "https://cdn.pixabay.com/photo/2022/11/18/21/32/cat-7601000_1280.jpg",
    "https://cdn.pixabay.com/photo/2023/01/04/16/18/cat-7697179_1280.jpg",
    "https://cdn.pixabay.com/photo/2023/02/28/19/22/drawing-7821641_1280.jpg"
];

const DEFAULT_AVATAR = AVATAR_OPTIONS[0];

export default function TopHeader() {
    const { data: session } = useSession();

    // Derive a user-scoped localStorage key so avatars never bleed between accounts
    const userId = session?.user?.id as string | undefined;
    const localStorageKey = userId ? `user_avatar_${userId}` : null;

    const firstName = session?.user?.name?.split(' ')[0] || 'Pharmacist';

    const [avatar, setAvatar] = useState<string>(DEFAULT_AVATAR);
    const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // ── Load avatar: prefer localStorage cache, then fetch from DB ────────────
    useEffect(() => {
        if (!userId) return;

        // 1. Immediately show cached value (instant, no flicker)
        const cached = localStorage.getItem(localStorageKey!);
        if (cached) {
            setAvatar(cached);
        }

        // 2. Fetch the authoritative value from the DB (handles cross-device / first load)
        fetch('/api/user/avatar')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.image) {
                    setAvatar(data.image);
                    localStorage.setItem(localStorageKey!, data.image);
                }
            })
            .catch(() => { /* silently ignore network errors */ });

    }, [userId, localStorageKey]);

    // ── Handle avatar selection ───────────────────────────────────────────────
    const handleAvatarSelect = async (url: string) => {
        // Optimistically update UI
        setAvatar(url);
        setIsAvatarMenuOpen(false);

        // Update localStorage cache immediately (user-scoped key)
        if (localStorageKey) {
            localStorage.setItem(localStorageKey, url);
        }

        // Persist to DB
        setIsSaving(true);
        try {
            await fetch('/api/user/avatar', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: url }),
            });
        } catch {
            // Silently fail — the cached value is still correct
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-[100] shrink-0 relative shadow-sm">

            {/* Background Decorative Shape */}
            <div className="absolute top-0 right-0 w-64 h-full pointer-events-none z-0 overflow-hidden">
                <svg viewBox="0 0 500 500" preserveAspectRatio="none" className="w-full h-full opacity-5">
                    <path d="M400,500 C200,400 300,200 500,100 L500,500 Z" fill="#00A99D" />
                </svg>
            </div>

            {/* Left Side: Welcome Message */}
            <div className="flex items-center gap-3 relative z-10">
                <div className="w-1 h-8 bg-emerald-500 rounded-full mr-2"></div>
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">
                    Welcome back, <span className="text-emerald-600">{firstName}</span>!
                </h1>
            </div>

            {/* Right Side: Profile & Actions */}
            <div className="flex items-center gap-6 relative z-10">

                {/* Avatar Selection Area */}
                <div className="relative">
                    <button
                        onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                        className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-200 hover:border-emerald-300 hover:bg-white transition-all shadow-sm active:scale-95"
                    >
                        <div className="w-10 h-10 rounded-full bg-emerald-100 overflow-hidden border-2 border-white shadow-inner shrink-0 relative">
                            <img
                                src={avatar}
                                alt="User Avatar"
                                className="w-full h-full object-cover object-center"
                            />
                            {/* Saving indicator ring */}
                            {isSaving && (
                                <div className="absolute inset-0 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                            )}
                        </div>
                        <span className="text-sm font-semibold text-gray-700 hidden md:block">Profile</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isAvatarMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Avatar Selection Dropdown */}
                    {isAvatarMenuOpen && (
                        <>
                            {/* Invisible backdrop to close menu on click outside */}
                            <div className="fixed inset-0 z-[105]" onClick={() => setIsAvatarMenuOpen(false)}></div>

                            <div className="absolute right-0 mt-3 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl p-5 z-[110] animate-in fade-in zoom-in duration-200">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">Change Avatar</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    {AVATAR_OPTIONS.map((url, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleAvatarSelect(url)}
                                            className={`w-16 h-16 rounded-full overflow-hidden border-4 cursor-pointer transition-all hover:scale-110 shadow-sm ${avatar === url ? 'border-emerald-500 scale-105' : 'border-gray-100 hover:border-emerald-200'
                                                }`}
                                        >
                                            <img src={url} alt={`Avatar option ${idx}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Logout Button */}
                <button
                    onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
                    className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all group shadow-sm border border-red-100"
                    title="Sign Out"
                >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        </header>
    );
}