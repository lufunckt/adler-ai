import { ReactNode } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export function ModalFrame({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 grid place-items-center bg-gray-900/40 px-4 backdrop-blur-sm"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="figma-scroll max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-7 shadow-2xl"
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        initial={{ opacity: 0, scale: 0.98, y: 14 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-gray-900">{title}</h2>
          <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
