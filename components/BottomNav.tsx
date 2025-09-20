import React from 'react';
import { NavLink } from 'react-router-dom';
import { DashboardIcon, DailyLogIcon, TrendsIcon, LibraryIcon, SettingsIcon } from './icons';

const BottomNav: React.FC = () => {
    const navItems = [
        { path: '/dashboard', icon: DashboardIcon, label: 'Dashboard' },
        { path: '/log', icon: DailyLogIcon, label: 'Daily Log' },
        { path: '/trends', icon: TrendsIcon, label: 'Trends' },
        { path: '/library', icon: LibraryIcon, label: 'Library' },
        { path: '/settings', icon: SettingsIcon, label: 'Settings' },
    ];

    return (
        <div className="sticky bottom-0">
            <div className="flex gap-2 border-t border-dark-700 bg-black px-4 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                {navItems.map(({ path, icon: Icon, label }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            `flex flex-1 flex-col items-center justify-end gap-1 rounded-full ${isActive ? 'text-primary-500' : 'text-gray-400'}`
                        }
                    >
                        <div className="flex h-8 items-center justify-center">
                            <Icon className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-medium tracking-[0.015em]">{label}</p>
                    </NavLink>
                ))}
            </div>
        </div>
    );
};

export default BottomNav;
