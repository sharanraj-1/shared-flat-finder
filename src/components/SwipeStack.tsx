"use client";

import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from "framer-motion";

export type SwipeDirection = "left" | "right";
export type CommitFn = (direction: SwipeDirection, intensity: number) => void;

interface SwipeStackProps<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  renderCard: (item: T, commit: CommitFn) => React.ReactNode;
  onCommit: (item: T, direction: SwipeDirection, intensity: number) => void;
  isDraggable?: (item: T) => boolean;
  dragLabels?: { left: string; right: string };
  emptyState: React.ReactNode;
}

const SWIPE_THRESHOLD = 110;

export function SwipeStack<T>({
  items,
  keyExtractor,
  renderCard,
  onCommit,
  isDraggable = () => true,
  dragLabels = { left: "NO", right: "YES" },
  emptyState,
}: SwipeStackProps<T>) {
  const visible = items.slice(0, 3);

  if (visible.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div className="relative h-full w-full">
      <AnimatePresence>
        {visible
          .slice()
          .reverse()
          .map((item, revIdx) => {
            const idx = visible.length - 1 - revIdx;
            const isTop = idx === 0;
            return (
              <SwipeCard
                key={keyExtractor(item)}
                stackIndex={idx}
                isTop={isTop}
                dragEnabled={isTop && isDraggable(item)}
                dragLabels={dragLabels}
                onCommit={(dir, intensity) => onCommit(item, dir, intensity)}
              >
                {(commit) => renderCard(item, commit)}
              </SwipeCard>
            );
          })}
      </AnimatePresence>
    </div>
  );
}

function SwipeCard({
  children,
  stackIndex,
  isTop,
  dragEnabled,
  dragLabels,
  onCommit,
}: {
  children: (commit: CommitFn) => React.ReactNode;
  stackIndex: number;
  isTop: boolean;
  dragEnabled: boolean;
  dragLabels: { left: string; right: string };
  onCommit: CommitFn;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-18, 18]);
  const likeOpacity = useTransform(x, [20, 140], [0, 1]);
  const passOpacity = useTransform(x, [-140, -20], [1, 0]);
  const [exiting, setExiting] = useState<SwipeDirection | null>(null);

  function commit(direction: SwipeDirection, intensity: number) {
    setExiting(direction);
    onCommit(direction, intensity);
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    if (Math.abs(offset) > SWIPE_THRESHOLD || Math.abs(velocity) > 500) {
      const direction: SwipeDirection = offset > 0 ? "right" : "left";
      const intensity = Math.min(Math.abs(offset) / 260, 1);
      commit(direction, intensity);
    }
  }

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        x: dragEnabled ? x : 0,
        rotate: dragEnabled ? rotate : 0,
        zIndex: 10 - stackIndex,
      }}
      initial={{ scale: 1 - stackIndex * 0.05, y: stackIndex * 14, opacity: stackIndex > 2 ? 0 : 1 }}
      animate={{ scale: 1 - stackIndex * 0.05, y: stackIndex * 14, opacity: 1 }}
      exit={
        exiting
          ? { x: exiting === "right" ? 500 : -500, opacity: 0, rotate: exiting === "right" ? 24 : -24 }
          : { opacity: 0, scale: 0.9 }
      }
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      drag={dragEnabled ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={dragEnabled ? handleDragEnd : undefined}
    >
      {isTop && dragEnabled && (
        <>
          <motion.div
            style={{ opacity: likeOpacity }}
            className="pointer-events-none absolute top-8 left-6 z-20 rotate-[-12deg] rounded-xl border-4 border-success bg-success-soft px-4 py-1 text-xl font-extrabold tracking-wide text-success"
          >
            {dragLabels.right}
          </motion.div>
          <motion.div
            style={{ opacity: passOpacity }}
            className="pointer-events-none absolute top-8 right-6 z-20 rotate-[12deg] rounded-xl border-4 border-danger bg-danger-soft px-4 py-1 text-xl font-extrabold tracking-wide text-danger"
          >
            {dragLabels.left}
          </motion.div>
        </>
      )}
      {children(commit)}
    </motion.div>
  );
}
