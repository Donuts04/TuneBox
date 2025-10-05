import { Disc } from "lucide-react";
import Image from "next/image";

const Footer = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <Image
        src="https://storage.googleapis.com/tunebox-stuff/logos/okLogo.png"
        alt="Logo"
        width={140}
        height={140}
        className="object-contain"
      />

      <div className="flex items-center justify-center gap-2">
        <Disc className="h-4 w-4" />
        <span className="text-sm">
          Made by <span className="font-bold">Osama Khalil</span>
        </span>
      </div>
    </div>
  );
};

export default Footer;
