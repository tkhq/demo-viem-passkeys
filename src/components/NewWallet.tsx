import styles from "../pages/index.module.css";

interface INewWalletProps {
  onSubmit: (data: any) => void;
}

export default function NewWallet({ onSubmit }: INewWalletProps) {
  return (
    <div>
      <h2>Create a new wallet</h2>
      <p className={styles.explainer}>
        We&apos;ll prompt your browser to create a new passkey. The details
        (credential ID, authenticator data, client data, attestation) will be
        used to create a new{" "}
        <a
          href="https://docs.turnkey.com/getting-started/sub-organizations"
          target="_blank"
          rel="noopener noreferrer"
        >
          Turnkey Sub-Organization
        </a>
        and a new{" "}
        <a
          href="https://docs.turnkey.com/getting-started/wallets"
          target="_blank"
          rel="noopener noreferrer"
        >
          Wallet
        </a>
        within it.
        <br />
        <br />
        This request to Turnkey will be created and signed by the backend API
        key pair.
      </p>
      <form className={styles.form} onSubmit={onSubmit}>
        <input
          className={styles.button}
          type="submit"
          value="Create new wallet"
        />
      </form>
    </div>
  );
}
