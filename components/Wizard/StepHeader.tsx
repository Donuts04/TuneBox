"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface StepHeaderProps {
  title: string;
  onBack: () => void;
}

export default function StepHeader({ title, onBack }: StepHeaderProps) {
  return (
    <div className="flex items-center justify-between border border-black dark:border-white p-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">{title}</h2>
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="hover:dark:bg-white hover:bg-black hover:text-white hover:dark:text-black text-black dark:text-white flex gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Start
      </Button>
    </div>
  );
}
