import styles from "../pages/index.module.css";

interface IExistingWalletProps {
  onSubmit: (data: any) => void;
}

export default function ExistingWallet({ onSubmit }: IExistingWalletProps) {
  return (
    <div className={styles.newWalletMargin}>
      <h2>Already created your wallet? Log back in</h2>
      <p className={styles.explainer}>
        Based on the parent organization ID and a stamp from your passkey used
        to created the sub-organization and wallet, we can look up your
        sub-organization using the{" "}
        <a
          href="https://docs.turnkey.com/api#tag/Who-am-I"
          target="_blank"
          rel="noopener noreferrer"
        >
          Whoami endpoint.
        </a>
      </p>
      <form className={styles.form} onSubmit={onSubmit}>
        <input
          className={styles.button}
          type="submit"
          value="Login to sub-org with existing passkey"
        />
      </form>
    </div>
  );
}
