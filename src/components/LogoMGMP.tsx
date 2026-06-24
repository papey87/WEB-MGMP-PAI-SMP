import React from "react";
// @ts-ignore
import logoImg from "../assets/images/mgmp_logo_1782303044413.jpg";

interface LogoMGMPProps {
  className?: string;
  size?: number;
}

export default function LogoMGMP({ className = "", size = 80 }: LogoMGMPProps) {
  return (
    <img
      src={logoImg}
      alt="Logo Resmi MGMP PAI SMP Kabupaten Subang"
      width={size}
      height={size}
      className={`${className} shrink-0 object-contain rounded-full`}
      referrerPolicy="no-referrer"
    />
  );
}

