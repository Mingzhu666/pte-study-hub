'use client';

import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';

export default function Header() {
  return (
    <motion.header
      className="text-center py-12"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <GraduationCap size={28} color="white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent">
          PTE Academic Study Hub
        </h1>
      </div>
      <p className="text-gray-400 text-lg">
        Master all 22 modules with expert strategies
      </p>
      <div className="flex justify-center gap-4 mt-4">
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
          2025 Latest Updates
        </span>
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-500/20 text-purple-400">
          AI-Powered Strategies
        </span>
      </div>
    </motion.header>
  );
}
