import Image from "next/image";
import styles from "../pages/index.module.css";

export default function Logo() {
  return (
    <a href="https://turnkey.com" target="_blank" rel="noopener noreferrer">
      <Image
        src="/logo.svg"
        alt="Turnkey Logo"
        className={styles.turnkeyLogo}
        width={100}
        height={24}
        priority
      />
    </a>
  );
}
