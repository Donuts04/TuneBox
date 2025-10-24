"use client";

import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useState } from "react";

const NavbarComponent = () => {
  const navItems = [
    {
      name: "Home",
      link: "/",
    },
    {
      name: "Featured",
      link: "#featured",
    },
    {
      name: "Start",
      link: "#start",
    },
    {
      name: "Music Box",
      link: "#music-box",
    },
    {
      name: "Loops",
      link: "#loops",
    },
    {
      name: "About",
      link: "#about",
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative w-full">
      <Navbar>
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
        </NavBody>

        <MobileNav isOpen={isMobileMenuOpen}>
          <MobileNavHeader>
            <NavbarLogo />
            <div className="flex items-center gap-4">
              <MobileNavToggle
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </div>
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  if (item.link && item.link.startsWith("#")) {
                    e.preventDefault();
                    const target = document.querySelector(item.link);
                    if (target) {
                      (target as HTMLElement).scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }
                  } else if (item.link === "/") {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="block w-full px-4 py-3 text-left text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors duration-200"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
};

export default NavbarComponent;
