'use client'

import { motion } from 'framer-motion'

export default function RevilaLoadingAnimation() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="text-6xl md:text-8xl font-black text-black tracking-tight"
        style={{ fontFamily: 'Boston Angel, serif' }}
      >
        Revila
      </motion.h1>
    </div>
  )
}
