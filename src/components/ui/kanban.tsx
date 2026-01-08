"use client";

import React, {
  Dispatch,
  SetStateAction,
  useState,
  DragEvent,
  FormEvent,
} from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Flame, Building2, MapPin, ExternalLink, GripVertical } from "lucide-react";

// ============================================
// TYPES
// ============================================

export type ColumnType = "saved" | "applied" | "interview" | "offer" | "rejected";

export type CardType = {
  id: string;
  title: string;
  company: string;
  location?: string;
  column: ColumnType;
  jobUrl?: string;
  salary?: string;
  // Source tracking
  isManual?: boolean;
  isApplied?: boolean;
  isSaved?: boolean;
  opportunityId?: string;
};

export type ColumnConfig = {
  id: ColumnType;
  title: string;
  headingColor: string;
};

// ============================================
// MAIN COMPONENT
// ============================================

type KanbanProps = {
  cards: CardType[];
  setCards: Dispatch<SetStateAction<CardType[]>>;
  columns?: ColumnConfig[];
  className?: string;
};

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: "saved", title: "Saved", headingColor: "text-neutral-400" },
  { id: "applied", title: "Applied", headingColor: "text-blue-400" },
  { id: "interview", title: "Interview", headingColor: "text-amber-400" },
  { id: "offer", title: "Offer", headingColor: "text-emerald-400" },
  { id: "rejected", title: "Rejected", headingColor: "text-red-400" },
];

export const Kanban = ({ 
  cards, 
  setCards, 
  columns = DEFAULT_COLUMNS,
  className 
}: KanbanProps) => {
  return (
    <div className={cn("flex h-full w-full gap-4 overflow-x-auto p-6 pt-8", className)}>
      {columns.map((col) => (
        <Column
          key={col.id}
          title={col.title}
          column={col.id}
          headingColor={col.headingColor}
          cards={cards}
          setCards={setCards}
        />
      ))}
      <BurnBarrel setCards={setCards} />
    </div>
  );
};

// ============================================
// COLUMN
// ============================================

type ColumnProps = {
  title: string;
  headingColor: string;
  cards: CardType[];
  column: ColumnType;
  setCards: Dispatch<SetStateAction<CardType[]>>;
};

const Column = ({
  title,
  headingColor,
  cards,
  column,
  setCards,
}: ColumnProps) => {
  const [active, setActive] = useState(false);

  const handleDragStart = (e: DragEvent, card: CardType) => {
    e.dataTransfer.setData("cardId", card.id);
  };

  const handleDragEnd = (e: DragEvent) => {
    const cardId = e.dataTransfer.getData("cardId");

    setActive(false);
    clearHighlights();

    const indicators = getIndicators();
    const { element } = getNearestIndicator(e, indicators);

    const before = element.dataset.before || "-1";

    if (before !== cardId) {
      let copy = [...cards];

      let cardToTransfer = copy.find((c) => c.id === cardId);
      if (!cardToTransfer) return;
      cardToTransfer = { ...cardToTransfer, column };

      copy = copy.filter((c) => c.id !== cardId);

      const moveToBack = before === "-1";

      if (moveToBack) {
        copy.push(cardToTransfer);
      } else {
        const insertAtIndex = copy.findIndex((el) => el.id === before);
        if (insertAtIndex === undefined) return;

        copy.splice(insertAtIndex, 0, cardToTransfer);
      }

      setCards(copy);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    highlightIndicator(e);
    setActive(true);
  };

  const clearHighlights = (els?: HTMLElement[]) => {
    const indicators = els || getIndicators();
    indicators.forEach((i) => {
      i.style.opacity = "0";
    });
  };

  const highlightIndicator = (e: DragEvent) => {
    const indicators = getIndicators();
    clearHighlights(indicators);
    const el = getNearestIndicator(e, indicators);
    el.element.style.opacity = "1";
  };

  const getNearestIndicator = (e: DragEvent, indicators: HTMLElement[]) => {
    const DISTANCE_OFFSET = 50;

    const el = indicators.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = e.clientY - (box.top + DISTANCE_OFFSET);

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
      }
    );

    return el;
  };

  const getIndicators = () => {
    return Array.from(
      document.querySelectorAll(
        `[data-column="${column}"]`
      ) as unknown as HTMLElement[]
    );
  };

  const handleDragLeave = () => {
    clearHighlights();
    setActive(false);
  };

  const filteredCards = cards.filter((c) => c.column === column);

  return (
    <div className="w-72 shrink-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`font-medium ${headingColor}`}>{title}</h3>
        <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-sm text-neutral-400">
          {filteredCards.length}
        </span>
      </div>
      <div
        onDrop={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "w-full rounded-lg transition-colors min-h-[400px] pb-4",
          active ? "bg-neutral-800/50" : "bg-neutral-800/0"
        )}
      >
        {filteredCards.map((c) => (
          <Card key={c.id} {...c} handleDragStart={handleDragStart} />
        ))}
        <DropIndicator beforeId={null} column={column} />
        <AddCard column={column} setCards={setCards} />
      </div>
    </div>
  );
};

// ============================================
// CARD
// ============================================

type CardProps = CardType & {
  handleDragStart: (e: DragEvent, card: CardType) => void;
};

const Card = ({ 
  title, 
  id, 
  column, 
  company, 
  location, 
  jobUrl, 
  salary,
  isManual,
  isApplied,
  isSaved,
  opportunityId,
  handleDragStart 
}: CardProps) => {
  const cardData: CardType = { 
    title, id, column, company, location, jobUrl, salary,
    isManual, isApplied, isSaved, opportunityId
  };

  return (
    <>
      <DropIndicator beforeId={id} column={column} />
      <motion.div
        layout
        layoutId={id}
        draggable="true"
        onDragStart={(e) => handleDragStart(e as unknown as DragEvent, cardData)}
        className={cn(
          "cursor-grab rounded-lg border bg-neutral-800 p-3 active:cursor-grabbing hover:border-neutral-600 transition-colors",
          isApplied ? "border-blue-700/50" : isSaved ? "border-amber-700/50" : "border-neutral-700"
        )}
      >
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-neutral-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-neutral-100 truncate flex-1">{title}</p>
              {isApplied && (
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                  Applied
                </span>
              )}
              {isSaved && !isApplied && (
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                  Saved
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 flex items-center gap-1 mt-1">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{company}</span>
            </p>
            {location && (
              <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{location}</span>
              </p>
            )}
            {salary && (
              <p className="text-xs text-emerald-400 mt-1">{salary}</p>
            )}
          </div>
          {jobUrl && (
            <a 
              href={jobUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </motion.div>
    </>
  );
};

// ============================================
// DROP INDICATOR
// ============================================

type DropIndicatorProps = {
  beforeId: string | null;
  column: string;
};

const DropIndicator = ({ beforeId, column }: DropIndicatorProps) => {
  return (
    <div
      data-before={beforeId || "-1"}
      data-column={column}
      className="my-0.5 h-0.5 w-full bg-violet-400 opacity-0"
    />
  );
};

// ============================================
// BURN BARREL (DELETE)
// ============================================

const BurnBarrel = ({
  setCards,
}: {
  setCards: Dispatch<SetStateAction<CardType[]>>;
}) => {
  const [active, setActive] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setActive(true);
  };

  const handleDragLeave = () => {
    setActive(false);
  };

  const handleDragEnd = (e: DragEvent) => {
    const cardId = e.dataTransfer.getData("cardId");
    setCards((pv) => pv.filter((c) => c.id !== cardId));
    setActive(false);
  };

  return (
    <div
      onDrop={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "mt-10 grid h-56 w-56 shrink-0 place-content-center rounded-lg border text-3xl transition-colors",
        active
          ? "border-red-800 bg-red-800/20 text-red-500"
          : "border-neutral-700 bg-neutral-800/50 text-neutral-500"
      )}
    >
      {active ? <Flame className="h-10 w-10 animate-bounce" /> : <Trash2 className="h-10 w-10" />}
    </div>
  );
};

// ============================================
// ADD CARD
// ============================================

type AddCardProps = {
  column: ColumnType;
  setCards: Dispatch<SetStateAction<CardType[]>>;
};

const AddCard = ({ column, setCards }: AddCardProps) => {
  const [text, setText] = useState("");
  const [company, setCompany] = useState("");
  const [adding, setAdding] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!text.trim().length || !company.trim().length) return;

    const newCard: CardType = {
      column,
      title: text.trim(),
      company: company.trim(),
      id: crypto.randomUUID(),
    };

    setCards((pv) => [...pv, newCard]);
    setText("");
    setCompany("");
    setAdding(false);
  };

  return (
    <>
      {adding ? (
        <motion.form layout onSubmit={handleSubmit} className="mt-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
            placeholder="Job title..."
            className="w-full rounded border border-violet-400 bg-violet-400/20 p-2 text-sm text-neutral-50 placeholder-violet-300 focus:outline-0 mb-2"
          />
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company..."
            className="w-full rounded border border-violet-400 bg-violet-400/20 p-2 text-sm text-neutral-50 placeholder-violet-300 focus:outline-0"
          />
          <div className="mt-2 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded bg-neutral-50 px-3 py-1.5 text-xs text-neutral-950 transition-colors hover:bg-neutral-300"
            >
              <span>Add</span>
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </motion.form>
      ) : (
        <motion.button
          layout
          onClick={() => setAdding(true)}
          className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50"
        >
          <span>Add job</span>
          <Plus className="h-3 w-3" />
        </motion.button>
      )}
    </>
  );
};

export { Column, Card, DropIndicator, BurnBarrel, AddCard };
