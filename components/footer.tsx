import { Disc } from "lucide-react";
import Image from "next/image";

const Footer = () => {
  return (
    <div className="flex flex-col items-center justify-center mt-24 pt-8">
      <div className="relative w-32 h-32 mb-4">
        <Image src="/okLogo.png" alt="Logo" fill className="object-contain" />
      </div>

      <div className="flex items-center justify-center">
        <Disc className="h-4 w-4 mr-2" />
        <span className="text-sm">
          Made by <span className="font-bold">Osama Khalil</span>
        </span>
      </div>
    </div>
  );
};

export default Footer;
