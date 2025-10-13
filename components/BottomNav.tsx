import React from 'react';
import { NavLink } from 'react-router-dom';
import { DashboardIcon, DailyLogIcon, TrendsIcon, LibraryIcon } from './icons';
import AskFitAI from './AskFitAI';

/**
 * A navigation component that displays at the bottom of the screen.
 * It provides links to the main sections of the application: Dashboard, Daily Log, Trends, and Library.
 * It also includes a central "Ask Gemini" button.
 * The active link is highlighted.
 * @returns {JSX.Element} The rendered bottom navigation component.
 */
const BottomNav: React.FC = () => {
    const navItems = [
        { path: '/dashboard', icon: DashboardIcon, label: 'Dashboard' },
        { path: '/log', icon: DailyLogIcon, label: 'Daily Log' },
        { path: '/trends', icon: TrendsIcon, label: 'Trends' },
        { path: '/library', icon: LibraryIcon, label: 'Library' },
    ];

    const midIndex = Math.ceil(navItems.length / 2);
    const leftItems = navItems.slice(0, midIndex);
    const rightItems = navItems.slice(midIndex);

    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `flex flex-1 flex-col items-center justify-end gap-1 rounded-full px-2 py-1 transition-colors duration-200 ${
            isActive ? 'text-primary-500' : 'text-gray-400 hover:text-primary-300'
        }`;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto">
            <div className="flex items-end justify-center gap-2 border-t border-dark-700 bg-dark-800 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-1px_10px_rgba(0,0,0,0.5)]">
                {leftItems.map(({ path, icon: Icon, label }) => (
                    <NavLink key={path} to={path} className={navLinkClasses}>
                        <div className="flex h-7 w-7 items-center justify-center">
                            <Icon className="h-6 w-6" />
                        </div>
                        <p className="text-[0.6rem] font-medium tracking-wide">{label}</p>
                    </NavLink>
                ))}

                <div className="relative flex-shrink-0 mb-1">
                    <AskFitAI />
                </div>

                {rightItems.map(({ path, icon: Icon, label }) => (
                    <NavLink key={path} to={path} className={navLinkClasses}>
                        <div className="flex h-7 w-7 items-center justify-center">
                            <Icon className="h-6 w-6" />
                        </div>
                        <p className="text-[0.6rem] font-medium tracking-wide">{label}</p>
                    </NavLink>
                ))}
            </div>
        </div>
    );
};

export default BottomNav;
