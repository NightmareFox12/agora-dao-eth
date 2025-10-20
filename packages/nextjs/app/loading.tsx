"use client";

import { motion } from "framer-motion";
import { Loader } from "lucide-react";
import { NextPage } from "next";

const Loading: NextPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex items-center justify-center h-screen flex-col"
    >
      <Loader className="w-10 h-10 animate-spin text-primary" />
      <motion.h1
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold mt-4"
      >
        Loading...
      </motion.h1>
    </motion.div>
  );
};

export default Loading;
