import React from "react";
import { Delete } from "lucide-react";
import { motion } from "framer-motion";

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  lang: "nb" | "en";
}

const keys = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "⌫"],
];

export default function NumericKeypad({ value, onChange, lang }: NumericKeypadProps) {
  const handleKey = (key: string) => {
    if (key === "⌫") {
      onChange(value.length > 1 ? value.slice(0, -1) : "0");
    } else if (key === ".") {
      if (!value.includes(".")) onChange(value + ".");
    } else {
      if (value === "0") onChange(key);
      else onChange(value + key);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-1.5 px-2 py-2">
      {keys.flat().map((key) => (
        <motion.button
          key={key}
          whileTap={{ scale: 0.92 }}
          onClick={() => handleKey(key)}
          className={`h-12 rounded-xl text-lg font-display font-bold transition-colors flex items-center justify-center
            ${key === "⌫"
              ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
              : "bg-muted hover:bg-muted/70 text-foreground"
            }`}
        >
          {key === "⌫" ? <Delete className="h-5 w-5" /> : key}
        </motion.button>
      ))}
    </div>
  );
}
