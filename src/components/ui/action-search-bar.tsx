"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Send,
    Briefcase,
    MapPin,
    Building2,
    Code,
    GraduationCap,
    Clock,
} from "lucide-react";

function useDebounceLocal<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

export interface Action {
    id: string;
    label: string;
    icon: React.ReactNode;
    description?: string;
    short?: string;
    end?: string;
}

interface SearchResult {
    actions: Action[];
}

interface ActionSearchBarProps {
    actions?: Action[];
    placeholder?: string;
    label?: string;
    value?: string;
    onChange?: (value: string) => void;
    onActionSelect?: (action: Action) => void;
    onSearch?: () => void;
}

function ActionSearchBar({ 
    actions = [], 
    placeholder = "Search...",
    label,
    value: controlledValue,
    onChange,
    onActionSelect,
    onSearch,
}: ActionSearchBarProps) {
    const [internalQuery, setInternalQuery] = useState("");
    const query = controlledValue !== undefined ? controlledValue : internalQuery;
    const [result, setResult] = useState<SearchResult | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const debouncedQuery = useDebounceLocal(query, 200);

    useEffect(() => {
        if (!isFocused || actions.length === 0) {
            setResult(null);
            return;
        }

        if (!debouncedQuery) {
            setResult({ actions: actions.slice(0, 6) });
            return;
        }

        const normalizedQuery = debouncedQuery.toLowerCase().trim();
        const filteredActions = actions.filter((action) => {
            const searchableText = `${action.label} ${action.description || ''}`.toLowerCase();
            return searchableText.includes(normalizedQuery);
        });

        setResult({ actions: filteredActions.slice(0, 6) });
    }, [debouncedQuery, isFocused, actions]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (onChange) {
            onChange(newValue);
        } else {
            setInternalQuery(newValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && query.trim()) {
            e.preventDefault();
            setIsFocused(false);
            if (onSearch) {
                onSearch();
            }
        } else if (e.key === "Escape") {
            setIsFocused(false);
        }
    };

    const handleSearchClick = () => {
        if (query.trim() && onSearch) {
            setIsFocused(false);
            onSearch();
        }
    };

    const container = {
        hidden: { opacity: 0, height: 0 },
        show: {
            opacity: 1,
            height: "auto",
            transition: {
                height: { duration: 0.3 },
                staggerChildren: 0.05,
            },
        },
        exit: {
            opacity: 0,
            height: 0,
            transition: {
                height: { duration: 0.2 },
                opacity: { duration: 0.15 },
            },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.2 },
        },
        exit: {
            opacity: 0,
            y: -5,
            transition: { duration: 0.15 },
        },
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleActionClick = (action: Action) => {
        if (onActionSelect) {
            onActionSelect(action);
        }
        setIsFocused(false);
    };

    return (
        <div className="w-full relative rounded-full">
            <div className="relative rounded-full">
                {label && (
                    <label
                        className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block border-b rounded-full"
                        htmlFor="search"
                    >
                        {label}
                    </label>
                )}
                <div className="relative rounded-full">
                    <Input
                        type="text"
                        placeholder={placeholder}
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={handleFocus}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        className="pl-9 pr-9 py-1.5 h-9 text-sm rounded-xl border-2 focus-visible:ring-offset-0"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <button 
                        type="button"
                        onClick={handleSearchClick}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted transition-colors"
                    >
                        <AnimatePresence mode="popLayout">
                            {query.length > 0 ? (
                                <motion.div
                                    key="send"
                                    initial={{ y: -10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 10, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <Send className="w-4 h-4 text-primary" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0 }}
                                >
                                    <div className="w-4 h-4" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isFocused && result && result.actions.length > 0 && (
                    <motion.div
                        className="absolute top-full left-0 right-0 z-50 border rounded-lg shadow-lg overflow-hidden dark:border-neutral-700 bg-background mt-1"
                        variants={container}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                    >
                        <motion.ul className="py-1">
                            {result.actions.map((action) => (
                                <motion.li
                                    key={action.id}
                                    className="px-3 py-2 flex items-center justify-between hover:bg-muted cursor-pointer"
                                    variants={item}
                                    layout
                                    onClick={() => handleActionClick(action)}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-muted-foreground">
                                            {action.icon}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">
                                                {action.label}
                                            </span>
                                            {action.description && (
                                                <span className="text-xs text-muted-foreground">
                                                    {action.description}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {action.end && (
                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                            {action.end}
                                        </span>
                                    )}
                                </motion.li>
                            ))}
                        </motion.ul>
                        <div className="px-3 py-2 border-t border-border">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>↑↓ Navigate</span>
                                <span>↵ Select</span>
                                <span>ESC Close</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export { ActionSearchBar };
